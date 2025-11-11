//backend/src/controllers/groupController.ts
import type { Response } from "express";
import { handleGithubError } from "../utils/errorHandler";
import { createGroupSchema } from "../utils/validate";
import { createGroupForProject, deleteGroup } from "../services/groupService";
import { AuthRequest } from "../middleware/authMiddleware";

/**
 * ➕ Crée un groupe d'étudiants et un repo GitHub pour un projet
 */
export const createGroup = async (req: AuthRequest, res: Response) => {
    try {
        const parsed = createGroupSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: parsed.error.flatten().fieldErrors,
            });
        }

        const { secretKey, students } = parsed.data;
        const { projectId } = req.params;
        const result = await createGroupForProject(Number(projectId), secretKey, students);

        return res.json(result);
    } catch (err: any) {
        return handleGithubError(res, err);
    }
};

/**
 * ❌ Supprime un groupe et son repository GitHub
 * 🔒 Vérifie le token JWT du professeur
 * ⚠️ NOTE: req.params.groupName est en réalité le **repoName** (ce qui vient du frontend)
 */
export const deleteGroupController = async (req: AuthRequest, res: Response) => {
    try {
        const repoName = req.params.groupName; // ex: "groupe01-monprojet"
        const { orgName } = req.body;

        if (!repoName || !orgName) {
            return res.status(400).json({ error: "Nom du repo ou de l'organisation manquant." });
        }

        if (!req.user) {
            return res.status(401).json({ error: "Non authentifié." });
        }

        const result = await deleteGroup(repoName, orgName, req.user.id);
        return res.json(result);
    } catch (err: any) {
        return handleGithubError(res, err);
    }
};
