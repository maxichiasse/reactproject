//backend/src/controllers/githubSearchController.ts
import type { Request, Response } from "express";
import { githubRequest } from "../services/githubService";

/**
 * 🔍 Recherche d’utilisateurs GitHub à partir du token du prof
 */
export const searchGithubUsers = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { q } = req.query;

        // 🧩 Validation des paramètres
        if (!q || typeof q !== "string" || q.trim().length < 1) {
            return res.status(400).json({ error: "Paramètre de recherche manquant ou invalide." });
        }

        // 🔹 Appel GitHub via ton service (token du prof)
        const data = await githubRequest(
            `https://api.github.com/search/users?q=${encodeURIComponent(q)}`,
            Number(projectId)
        );

        // 🔹 Simplifie la réponse pour le frontend
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
};
