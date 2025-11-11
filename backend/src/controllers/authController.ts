// backend/src/controllers/authController.ts
import type { Request, Response } from "express";
import { handleGithubAuth } from "../services/authService";
import { AuthRequest } from "../middleware/authMiddleware";
import { log, errorLog } from "../utils/logger";
import { handleGithubError } from "../utils/errorHandler";
import {AppError} from "../utils/appError";

export const githubAuth = async (req: Request, res: Response) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code manquant" });

    try {
        const { token, user } = await handleGithubAuth(code);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 2 * 60 * 60 * 1000,
        });

        log(`✅ Connexion réussie pour ${user.login}`);
        return res.json({ success: true, user });
    } catch (err: any) {
        errorLog("Erreur /auth/github:", err.message);
        if (err instanceof AppError) {                // ⬅️ ajoute ceci
            return res.status(err.status).json({ error: err.message });
        }
        return handleGithubError(res, err);
    }
};

export const getCurrentUser = (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Non authentifié" });
    res.json(req.user);
};

export const logout = (_req: Request, res: Response) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.status(200).json({ message: "Déconnecté" });
};
