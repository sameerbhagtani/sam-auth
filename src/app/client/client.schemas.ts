import { z } from "zod";

export const registerSchema = z.object({
    body: z.strictObject({
        name: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "Name is required"
                        : "Name must be a string",
            })
            .trim()
            .min(1, "Name is required")
            .max(100, "Name cannot be of more than 100 characters"),
        redirectUris: z
            .array(z.url())
            .min(1, "At least one redirect URI is required"),
        allowedScopes: z
            .array(z.enum(["openid", "profile", "email"]))
            .min(1, "At least one scope is required")
            .refine((scopes) => scopes.includes("openid"), {
                message: `Scope "openid" is required`,
            }),
    }),
});

export type RegisterType = z.infer<typeof registerSchema>;
