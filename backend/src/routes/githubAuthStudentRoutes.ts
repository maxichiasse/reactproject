//backend/src/routes/githubAuthStudentRoutes.ts
import express from "express";
import { githubRequest } from "../services/githubService";

const router = express.Router();

/**
 * 🎓 Récupère le profil public GitHub de l’utilisateur
 * (via OAuth de GitHub, en utilisant le token du prof du projet)
 */
router.get("/projects/:projectId/student", async (req, res) => {
    const { projectId } = req.params;
    const { code } = req.query;

    if (!code || typeof code !== "string")
        return res.status(400).json({ error: "Code OAuth manquant" });

    try {
        // 1️⃣ Échanger le code pour obtenir un token temporaire (étudiant)
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
            body: new URLSearchParams({
                client_id: process.env.CLIENT_ID!,
                client_secret: process.env.CLIENT_SECRET!,
                code,
                redirect_uri: "http://localhost:5173/callback", // 🔥 AJOUT ICI
            }),
        });

        const tokenData = await tokenResponse.json();
        console.log("🔍 Réponse GitHub tokenData:", tokenData);

        const token = tokenData.access_token;
        if (!token) throw new Error("Impossible d’obtenir un access_token étudiant");

        // 2️⃣ Appel API GitHub pour obtenir les infos publiques
        const userResponse = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!userResponse.ok) {
            const text = await userResponse.text();
            throw new Error(`Erreur GitHub: ${text}`);
        }

        const data = await userResponse.json();

        res.json({
            id: data.id,
            login: data.login,
            name: data.name,
            avatar_url: data.avatar_url,
        });
    } catch (err: any) {
        console.error("Erreur /projects/:projectId/student:", err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;
