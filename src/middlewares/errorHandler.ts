import type { Request, Response, NextFunction } from "express";

export default function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const statusCode = err.statusCode || 500;

    // console.log(err);

    return res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
}
