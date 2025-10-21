//backend/src/controllers/githubAuthStudentController.ts
import type { Request, Response } from "express";
import { ENV } from "../config/env";
import {handleGithubError} from "../utils/errorHandler";

export const githubAuthStudent = async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { code } = req.query;

    if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Code OAuth manquant" });
    }

    try {
        // 1️⃣ Échanger le code OAuth contre un access_token
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
                redirect_uri: ENV.FRONT_URL + "/callback", // cohérent avec ta config
            }),
        });

        const tokenData = await tokenResponse.json();
        const token = tokenData.access_token;

        if (!token) throw new Error("Impossible d’obtenir un access_token étudiant");

        // 2️⃣ Appeler l’API GitHub pour récupérer les infos utilisateur
        const userResponse = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!userResponse.ok) {
            const text = await userResponse.text();
            throw new Error(`Erreur GitHub: ${text}`);
        }

        const data = await userResponse.json();

        // 3️⃣ Réponse finale simplifiée
        res.json({
            id: data.id,
            login: data.login,
            name: data.name,
            avatar_url: data.avatar_url,
            projectId, // utile pour savoir à quel projet rattacher
        });
    } catch (err: any) {
        return handleGithubError(res, err);
    }
};
