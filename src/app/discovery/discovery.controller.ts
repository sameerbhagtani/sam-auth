import { getJWKS } from "../../config/jwks.js";
import env from "../../config/env.js";

import type { Request, Response } from "express";

export async function getOpenIdConfiguration(req: Request, res: Response) {
    return res.status(200).json({
        issuer: env.ISSUER,
        authorization_endpoint: `${env.ISSUER}/authorize`,
        token_endpoint: `${env.ISSUER}/token`,
        userinfo_endpoint: `${env.ISSUER}/userinfo`,
        jwks_uri: `${env.ISSUER}/.well-known/jwks.json`,
    });
}

export async function getJWKSJson(req: Request, res: Response) {
    return res.status(200).json(getJWKS());
}
