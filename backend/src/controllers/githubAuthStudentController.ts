//backend/src/controllers/githubAuthStudentController.ts
import type { Request, Response } from "express";
import { handleGithubError } from "../utils/errorHandler";
import { githubAuthStudentSchema } from "../utils/validate";
import { handleGithubAuthStudent } from "../services/githubAuthStudentService";

/**
 * 🎓 Authentifie un étudiant via GitHub OAuth
 */
export const githubAuthStudent = async (req: Request, res: Response) => {
    try {
        // ✅ Étape 1 : validation Zod
        const parsed = githubAuthStudentSchema.safeParse({
            code: req.query.code,
            projectId: req.params.projectId,
        });

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: parsed.error.flatten().fieldErrors,
            });
        }

        // ✅ Étape 2 : délègue toute la logique au service
        const { code, projectId } = parsed.data;
        const student = await handleGithubAuthStudent(code, projectId);

        // ✅ Étape 3 : réponse finale propre
        return res.json(student);
    } catch (err: any) {
        return handleGithubError(res, err);
    }
};

