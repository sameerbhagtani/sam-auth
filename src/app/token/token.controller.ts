import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { db } from "../../db/index.js";
import {
    authorizationCodes,
    clients,
    users,
    refreshTokens,
} from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { privateKey } from "../../config/keys.js";
import AppError from "../../utils/AppError.js";

import env from "../../config/env.js";

import type { Request, Response } from "express";
import type { TokenType } from "./token.schemas.js";

function buildAccessToken(
    user: typeof users.$inferSelect,
    audience: string,
    scopes: string[],
) {
    return jwt.sign(
        {
            sub: user.id.toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName || ""}`.trim(),
            scope: scopes.join(" "),
        },
        privateKey,
        {
            algorithm: "RS256",
            expiresIn: "1h",
            issuer: env.ISSUER,
            audience,
        },
    );
}

function buildIdToken(
    user: typeof users.$inferSelect,
    audience: string,
    scopes: string[],
) {
    const idTokenClaims: Record<string, unknown> = {
        sub: user.id.toString(),
    };

    if (scopes.includes("profile")) {
        idTokenClaims.name = `${user.firstName} ${user.lastName || ""}`.trim();
        idTokenClaims.given_name = user.firstName;
        idTokenClaims.family_name = user.lastName || undefined;
    }

    if (scopes.includes("email")) {
        idTokenClaims.email = user.email;
        idTokenClaims.email_verified = user.emailVerified;
    }

    return jwt.sign(idTokenClaims, privateKey, {
        algorithm: "RS256",
        expiresIn: "1h",
        issuer: env.ISSUER,
        audience,
    });
}

function buildRefreshTokenValue() {
    return crypto.randomBytes(32).toString("hex");
}

async function issueTokenResponse(
    user: typeof users.$inferSelect,
    clientDbId: number,
    clientAudience: string,
    scopes: string[],
) {
    const accessToken = buildAccessToken(user, clientAudience, scopes);
    const idToken = buildIdToken(user, clientAudience, scopes);
    const refreshTokenValue = buildRefreshTokenValue();
    const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshTokenValue)
        .digest("hex");

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(refreshTokens).values({
        tokenHash: refreshTokenHash,
        userId: user.id,
        clientId: clientDbId,
        grantedScopes: scopes,
        expiresAt,
    });

    return {
        access_token: accessToken,
        id_token: idToken,
        refresh_token: refreshTokenValue,
        token_type: "Bearer",
        expires_in: 3600,
    };
}

export async function exchangeToken(req: Request, res: Response) {
    const body = (req.validatedData as TokenType).body;
    const { grant_type, client_id, client_secret } = body;

    const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.clientId, client_id));

    if (!client || client.deletedAt) {
        throw new AppError("Invalid client_id", 400);
    }

    const isSecretValid = await bcrypt.compare(
        client_secret,
        client.clientSecretHash || "",
    );
    if (!isSecretValid) {
        throw new AppError("Invalid client_secret", 401);
    }

    if (grant_type === "authorization_code") {
        const { code, redirect_uri } = body;

        const [authCode] = await db
            .select()
            .from(authorizationCodes)
            .where(eq(authorizationCodes.code, code));

        if (!authCode || authCode.expiresAt < new Date()) {
            throw new AppError("Invalid authorization code", 400);
        }

        if (!client.redirectUris.includes(redirect_uri)) {
            throw new AppError("redirect_uri mismatch", 400);
        }

        if (authCode.clientId !== client.id) {
            throw new AppError(
                "Authorization code does not belong to this client",
                400,
            );
        }

        if (authCode.redirectUri !== redirect_uri) {
            throw new AppError("redirect_uri mismatch", 400);
        }

        await db
            .delete(authorizationCodes)
            .where(eq(authorizationCodes.code, code));

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, authCode.userId));

        if (!user || user.deletedAt) {
            throw new AppError("User not found", 400);
        }

        const tokenResponse = await issueTokenResponse(
            user,
            client.id,
            client.clientId,
            authCode.scopes,
        );

        return res.status(200).json(tokenResponse);
    }

    const { refresh_token } = body;

    const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refresh_token)
        .digest("hex");

    const [storedRefreshToken] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.tokenHash, refreshTokenHash));

    if (!storedRefreshToken) {
        throw new AppError("Invalid refresh_token", 400);
    }

    if (storedRefreshToken.revokedAt) {
        throw new AppError("Refresh token revoked", 400);
    }

    if (storedRefreshToken.expiresAt < new Date()) {
        throw new AppError("Refresh token expired", 400);
    }

    if (storedRefreshToken.clientId !== client.id) {
        throw new AppError("Refresh token does not belong to this client", 400);
    }

    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, storedRefreshToken.userId));

    if (!user || user.deletedAt) {
        throw new AppError("User not found", 400);
    }

    await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.tokenHash, refreshTokenHash));

    const tokenResponse = await issueTokenResponse(
        user,
        client.id,
        client.clientId,
        storedRefreshToken.grantedScopes,
    );

    return res.status(200).json(tokenResponse);
}
