//backend/src/controllers/githubAuthStudentController.ts
import type { Request, Response } from "express";
import { ENV } from "../config/env";
import { handleGithubError } from "../utils/errorHandler";
import { githubAuthStudentSchema } from "../utils/validate";

export const githubAuthStudent = async (req: Request, res: Response) => {
    try {
        // ✅ Validation Zod
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

        const { code, projectId } = parsed.data;

        // 1️⃣ Échange du code OAuth contre un access_token
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
            body: new URLSearchParams({
                client_id: ENV.CLIENT_ID,
                client_secret: ENV.CLIENT_SECRET,
                code,
                redirect_uri: ENV.FRONT_URL + "/callback",
            }),
        });

        const tokenData = await tokenResponse.json();
        const token = tokenData.access_token;
        if (!token) throw new Error("Impossible d’obtenir un access_token étudiant");

        // 2️⃣ Récupère les infos GitHub de l'utilisateur
        const userResponse = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!userResponse.ok) {
            const text = await userResponse.text();
            throw new Error(`Erreur GitHub: ${text}`);
        }

        const data = await userResponse.json();

        // 3️⃣ Réponse finale
        res.json({
            id: data.id,
            login: data.login,
            name: data.name,
            avatar_url: data.avatar_url,
            projectId,
        });
    } catch (err: any) {
        return handleGithubError(res, err);
    }
};
