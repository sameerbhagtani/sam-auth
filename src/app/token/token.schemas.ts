import { z } from "zod";

export const authorizationCodeTokenSchema = z.object({
    body: z.strictObject({
        grant_type: z.literal("authorization_code"),
        client_id: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "Client ID is required"
                        : "Client ID must be a string",
            })
            .min(1, "Client ID is required")
            .max(255, "Client ID too long"),
        client_secret: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "Client Secret is required"
                        : "Client Secret must be a string",
            })
            .min(1, "Client Secret is required")
            .max(255, "Client Secret too long"),
        code: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "Authorization Code is required"
                        : "Authorization Code must be a string",
            })
            .min(1, "Authorization Code is required")
            .max(255, "Authorization Code too long"),
        redirect_uri: z
            .url({
                error: (issue) =>
                    issue.input === undefined
                        ? "Redirect URI is required"
                        : "Redirect URI must be a valid URI",
            })
            .min(1, "Redirect URI is required"),
    }),
});

export const refreshTokenSchema = z.object({
    body: z.strictObject({
        grant_type: z.literal("refresh_token"),
        client_id: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "Client ID is required"
                        : "Client ID must be a string",
            })
            .min(1, "Client ID is required")
            .max(255, "Client ID too long"),
        client_secret: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "Client Secret is required"
                        : "Client Secret must be a string",
            })
            .min(1, "Client Secret is required")
            .max(255, "Client Secret too long"),
        refresh_token: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "Refresh Token is required"
                        : "Refresh Token must be a string",
            })
            .min(1, "Refresh Token is required")
            .max(255, "Refresh Token too long"),
    }),
});

export const tokenSchema = z.union([
    authorizationCodeTokenSchema,
    refreshTokenSchema,
]);

export type AuthorizationCodeTokenType = z.infer<
    typeof authorizationCodeTokenSchema
>;
export type RefreshTokenType = z.infer<typeof refreshTokenSchema>;
export type TokenType = z.infer<typeof tokenSchema>;
