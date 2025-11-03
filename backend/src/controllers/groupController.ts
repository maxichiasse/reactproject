//backend/src/controllers/groupController.ts
import type { Request, Response } from "express";
import { handleGithubError } from "../utils/errorHandler";
import { createGroupSchema } from "../utils/validate";
import { createGroupForProject } from "../services/groupService";

/**
 * ➕ Crée un groupe d'étudiants et un repo GitHub pour un projet
 */
export const createGroup = async (req: Request, res: Response) => {
    try {
        // ✅ Étape 1 : Validation du corps de la requête
        const parsed = createGroupSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: parsed.error.flatten().fieldErrors,
            });
        }

        const { secretKey, students } = parsed.data;
        const { projectId } = req.params;

        // ✅ Étape 2 : Appel du service métier
        const result = await createGroupForProject(Number(projectId), secretKey, students);

        return res.json(result);
    } catch (err: any) {
        return handleGithubError(res, err);
    }
};

