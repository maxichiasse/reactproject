//backend/src/middleware/authMiddleware.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

export interface AuthRequest extends Request {
    user?: { id: number };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Non authentifié" });

    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: number };
        req.user = decoded;
        next();
    } catch {
        return res.status(403).json({ error: "Token invalide ou expiré" });
    }
}
