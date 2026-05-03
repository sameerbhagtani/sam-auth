import type { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export default function validate<T extends z.ZodType>(schema: T) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        if (!result.success) {
            const message = result.error.issues
                .map((issue) => issue.message)
                .join(", ");

            return res.status(400).json({
                success: false,
                message,
            });
        }

        req.validatedData = result.data;
        return next();
    };
}
