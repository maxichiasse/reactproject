//backend/src/middleware/errorMiddleware.ts
import type {Request, Response, NextFunction} from "express";

interface HttpError extends Error {
    status?: number;
}

export function errorMiddleware(
    err: HttpError,
    _req: Request,
    res: Response,
    _next: NextFunction
) {
    console.error("💥 Erreur:", err.message);

    res.status(err.status || 500).json({
        error: err.message || "Erreur interne du serveur",
    });
}
