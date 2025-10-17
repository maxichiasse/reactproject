// backend/src/controllers/authController.ts
import type { Request, Response } from "express";
import { handleGithubAuth } from "../services/authService";
import { AuthRequest } from "../middleware/authMiddleware";

export const githubAuth = async (req: Request, res: Response) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code manquant" });

    try {
        const token = await handleGithubAuth(code);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 2 * 60 * 60 * 1000,
        });

        res.status(200).json({ success: true });
    } catch (err: any) {
        console.error("Erreur /auth/github:", err);
        res.status(err.status || 500).json({
            success: false,
            error: err.message || "Erreur serveur",
        });
    }
};

export const getCurrentUser = (req: AuthRequest, res: Response) => {
    res.json(req.user);
};

export const logout = (_req: Request, res: Response) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Déconnecté" });
};
