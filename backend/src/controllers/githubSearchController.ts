// backend/src/controllers/githubSearchController.ts
import type { Request, Response } from "express";
import { handleGithubError } from "../utils/errorHandler";
import { searchGithubUsersByProject } from "../services/githubSearchService";

/**
 * 🔍 Recherche d’utilisateurs GitHub à partir du token du prof
 */
export const searchGithubUsers = async (req: Request, res: Response) => {
    try {
        const projectId = Number(req.params.projectId);
        const q = req.query.q as string;

        const results = await searchGithubUsersByProject(projectId, q);
        return res.json(results);
    } catch (err: any) {
        return handleGithubError(res, err);
    }
};
