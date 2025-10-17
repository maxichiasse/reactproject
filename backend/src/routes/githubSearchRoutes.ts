//backend/src/routes/githubSearchRoutes.ts
import express from "express";
import { githubRequest } from "../services/githubService";

const router = express.Router();

/**
 * 🔍 Recherche d’utilisateurs GitHub à partir du token du prof
 */
router.get("/projects/:projectId/github-users", async (req, res) => {
    try {
        const { projectId } = req.params;
        const { q } = req.query;

        if (!q || typeof q !== "string" || q.trim().length < 1)
            return res.status(400).json({ error: "Paramètre de recherche manquant ou invalide." });

        // 🔹 Requête GitHub (via le service qui récupère le token du prof)
        const data = await githubRequest(
            `https://api.github.com/search/users?q=${encodeURIComponent(q)}`,
            Number(projectId)
        );

        // 🔹 On simplifie le résultat pour le frontend
        const results = (data.items || []).map((user: any) => ({
            id: user.id,
            login: user.login,
            avatar_url: user.avatar_url,
        }));

        res.json(results);
    } catch (err: any) {
        console.error("Erreur recherche GitHub:", err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;
