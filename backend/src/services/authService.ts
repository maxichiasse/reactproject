//backend/src/services/authService.ts
import { AppDataSource } from "../data-source";
import { Prof } from "../entity/Prof";
import { Organization } from "../entity/Organization";
import { encrypt } from "../utils/crypto";
import { ENV } from "../config/env";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

export async function handleGithubAuth(code: string) {
    // 1️⃣ Échanger le code contre un access_token GitHub
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
        }),
    });

    const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
        throw new Error(`Impossible d’obtenir un access_token: ${tokenData.error}`);
    }

    const access_token = tokenData.access_token;

    // 2️⃣ Récupérer les infos de l'utilisateur GitHub
    const userResponse = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResponse.ok) {
        const errText = await userResponse.text();
        throw new Error(`Erreur GitHub API: ${errText}`);
    }

    const userData = await userResponse.json() as {
        id: number;
        login: string;
        avatar_url: string;
        name: string;
    };

    // 3️⃣ Vérifie si ce prof est autorisé (présent dans la BDD)
    const userRepo = AppDataSource.getRepository(Prof);
    const existing = await userRepo.findOneBy({ id: userData.id });

    if (!existing) {
        console.log("Connexion refusée : prof non autorisé :", userData.login, userData.id);
        const error: any = new Error("Accès refusé : vous n’êtes pas autorisé à vous connecter.");
        error.status = 403;
        throw error;
    }

    // 4️⃣ Met à jour automatiquement les infos dans la BDD
    existing.login = userData.login;
    existing.name = userData.name;
    existing.avatar_url = userData.avatar_url;
    existing.encryptedToken = encrypt(access_token);

    await userRepo.save(existing);

    // 5️⃣ Synchroniser les organisations GitHub
    const orgResponse = await fetch("https://api.github.com/user/orgs", {
        headers: { Authorization: `Bearer ${access_token}` },
    });

// 👇 Ajout du typage explicite
    const orgs = (await orgResponse.json()) as {
        login: string;
        avatar_url: string;
        public_repos?: number;
    }[];

    const orgRepo = AppDataSource.getRepository(Organization);

    for (const org of orgs) {
        const existing = await orgRepo.findOneBy({ name: org.login, ownerId: userData.id });
        if (!existing) {
            await orgRepo.save(
                orgRepo.create({
                    name: org.login,
                    avatar_url: org.avatar_url,
                    public_repos: org.public_repos ?? 0,
                    ownerId: userData.id,
                })
            );
        } else {
            existing.avatar_url = org.avatar_url;
            existing.public_repos = org.public_repos ?? existing.public_repos;
            await orgRepo.save(existing);
        }
    }

    // 6️⃣ Créer un JWT
    const token = jwt.sign(
        {
            id: userData.id,
            login: userData.login,
            avatar_url: userData.avatar_url,
            name: userData.name,
        },
        ENV.JWT_SECRET,
        { expiresIn: "2h" }
    );

    return token;
}
