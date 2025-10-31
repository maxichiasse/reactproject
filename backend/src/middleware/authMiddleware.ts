//backend/src/middleware/authMiddleware.ts
import type { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { ENV } from "../config/env";

export interface AuthRequest extends Request {
    user?: { id: number; login?: string; avatar_url?: string; name?: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Non authentifié" });

    try {
        req.user = jwt.verify(token, ENV.JWT_SECRET, {
            algorithms: ["HS256"],
        }) as any;
        next();
    } catch {
        return res.status(403).json({ error: "Token invalide ou expiré" });
    }
}