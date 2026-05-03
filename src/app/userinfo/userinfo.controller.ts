import jwt from "jsonwebtoken";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { publicKey } from "../../config/keys.js";
import AppError from "../../utils/AppError.js";

import type { Request, Response } from "express";

export async function getUserInfo(req: Request, res: Response) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError("Missing or invalid Authorization header", 401);
    }

    const token = authHeader.slice(7);

    let decoded: any;
    try {
        decoded = jwt.verify(token, publicKey, {
            algorithms: ["RS256"],
        });
    } catch (error: any) {
        throw new AppError(
            error.message === "jwt expired" ? "Token expired" : "Invalid token",
            401,
        );
    }

    const userId = parseInt(decoded.sub, 10);
    const scopes = (decoded.scope || "").split(" ").filter(Boolean);

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user || user.deletedAt) {
        throw new AppError("User not found", 404);
    }

    const response: any = {
        sub: user.id.toString(),
    };

    if (scopes.includes("profile")) {
        response.name = `${user.firstName} ${user.lastName || ""}`.trim();
        response.given_name = user.firstName;
        response.family_name = user.lastName || undefined;
    }

    if (scopes.includes("email")) {
        response.email = user.email;
        response.email_verified = user.emailVerified;
    }

    return res.status(200).json(response);
}
