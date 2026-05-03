import { z } from "zod";
import { getSchema } from "../authorize/authorize.schemas.js";

export const registerSchema = z.object({
    body: getSchema.shape.query.extend({
        firstName: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "First Name is required"
                        : "First Name must be a string",
            })
            .trim()
            .min(1, "First Name is required")
            .max(50, "First Name cannot be of more than 50 characters"),
        lastName: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "Last Name is required"
                        : "Last Name must be a string",
            })
            .trim()
            .min(1, "Last Name is required")
            .max(50, "Last Name cannot be of more than 50 characters")
            .optional(),
        email: z
            .email({
                error: (issue) =>
                    issue.input === undefined
                        ? "Email is required"
                        : "Invalid email format",
            })
            .trim()
            .min(1, "Email is required")
            .max(255, "Email cannot be of more than 255 characters"),
        password: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "Password is required"
                        : "Password must be a string",
            })
            .regex(
                /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_])[^\s]{6,}$/,
                "Password must contain min 6 characters, use a mix of letters, numbers, and symbols. No spaces.",
            ),
    }),
});

export type RegisterType = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
    body: getSchema.shape.query.extend({
        email: z
            .email({
                error: (issue) =>
                    issue.input === undefined
                        ? "Email is required"
                        : "Invalid email format",
            })
            .trim()
            .min(1, "Email is required"),
        password: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "Password is required"
                        : "Password must be a string",
            })
            .min(1, "Password is required"),
    }),
});

export type LoginType = z.infer<typeof loginSchema>;
