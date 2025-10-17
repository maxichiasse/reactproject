//backend/src/routes/authRoutes.ts
import express from "express";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { handleGithubAuth } from "../services/authService";
import { ENV } from "../config/env";

dotenv.config();
const router = express.Router();

// === AUTHENTIFICATION GITHUB ===
router.post("/auth/github", async (req: Request, res: Response) => {
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

        // 🔧 Utilise le code HTTP s’il existe, sinon 500
        const status = err.status || 500;

        res.status(status).json({
            success: false,
            error: err.message || "Erreur serveur",
        });
    }
});

// === RÉCUPÉRER L'UTILISATEUR CONNECTÉ ===
router.get("/me", (req: Request, res: Response) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Non authentifié" });

    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        res.json(decoded);
    } catch {
        res.status(403).json({ error: "Token invalide ou expiré" });
    }
});

// === DÉCONNEXION ===
router.post("/logout", (_req: Request, res: Response) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Déconnecté" });
});

export default router;
