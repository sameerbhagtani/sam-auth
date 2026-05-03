import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { db } from "../../db/index.js";
import { users, authSessions } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import env from "../../config/env.js";

import AppError from "../../utils/AppError.js";

import type { Request, Response } from "express";
import type { RegisterType, LoginType } from "./auth.schemas.js";

export async function getRegisterPage(req: Request, res: Response) {
    const authorizeQuery = {
        client_id: (req.query.client_id as string) || "",
        redirect_uri: (req.query.redirect_uri as string) || "",
        scope: (req.query.scope as string) || "",
        response_type: (req.query.response_type as string) || "",
        state: (req.query.state as string) || "",
    };
    return res.status(200).render("auth/register", { authorizeQuery });
}

export async function getLoginPage(req: Request, res: Response) {
    const authorizeQuery = {
        client_id: (req.query.client_id as string) || "",
        redirect_uri: (req.query.redirect_uri as string) || "",
        scope: (req.query.scope as string) || "",
        response_type: (req.query.response_type as string) || "",
        state: (req.query.state as string) || "",
    };
    return res.status(200).render("auth/login", { authorizeQuery });
}

export async function registerUser(req: Request, res: Response) {
    const {
        firstName,
        lastName,
        email,
        password,
        client_id,
        redirect_uri,
        scope,
        response_type,
        state,
    } = (req.validatedData as RegisterType).body;

    const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
    if (existingUser) {
        throw new AppError("User already exists", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(users).values({
        firstName,
        lastName,
        email,
        emailVerified: true, // temp
        passwordHash,
    });

    const qs = new URLSearchParams({
        client_id,
        redirect_uri,
        scope,
        response_type,
        state,
    }).toString();

    return res.status(200).json({
        success: true,
        redirectUrl: `/authorize?${qs}`,
    });
}

export async function loginUser(req: Request, res: Response) {
    const {
        email,
        password,
        client_id,
        redirect_uri,
        scope,
        response_type,
        state,
    } = (req.validatedData as LoginType).body;

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || user.deletedAt) throw new AppError("Invalid credentials", 401);

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw new AppError("Invalid credentials", 401);

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionTokenHash = crypto
        .createHash("sha256")
        .update(sessionToken)
        .digest("hex");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.insert(authSessions).values({
        sessionTokenHash,
        userId: user.id,
        expiresAt,
    });

    res.cookie("auth_session", sessionToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const qs = new URLSearchParams({
        client_id,
        redirect_uri,
        scope,
        response_type,
        state,
    }).toString();

    return res.status(200).json({
        success: true,
        redirectUrl: `/authorize?${qs}`,
    });
}
