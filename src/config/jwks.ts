import { importSPKI, exportJWK, type JWK } from "jose";
import { publicKey } from "./keys.js";
import env from "./env.js";

let jwks: { keys: JWK[] };

export async function initJWKS() {
    const key = await importSPKI(publicKey, "RS256");
    const jwk = await exportJWK(key);

    jwks = {
        keys: [
            {
                ...jwk,
                use: "sig",
                alg: "RS256",
                kid: env.KEY_ID,
            },
        ],
    };
}

export function getJWKS() {
    if (!jwks) {
        throw new Error("JWKS not initialized. Call initJWKS() first.");
    }
    return jwks;
}
