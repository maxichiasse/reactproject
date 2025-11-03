// backend/src/services/authService.ts
import { AppDataSource } from "../data-source";
import { Prof } from "../entity/Prof";
import { encrypt } from "../utils/crypto";
import { ENV } from "../config/env";
import * as jwt from "jsonwebtoken";

/**
 * 🔹 Authentifie un prof via GitHub OAuth et met à jour ses infos de base
 */
export async function handleGithubAuth(code: string) {
    // 1️⃣ Échange code OAuth ↔️ access_token GitHub
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: new URLSearchParams({
            client_id: ENV.CLIENT_ID,
            client_secret: ENV.CLIENT_SECRET,
            code,
        }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("Impossible d’obtenir le token OAuth GitHub");

    const oauthToken = tokenData.access_token;

    // 2️⃣ Infos GitHub user
    const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${oauthToken}` },
    });
    if (!userRes.ok) throw new Error("Erreur lors de la récupération du profil GitHub");

    const userData = await userRes.json();

    // 3️⃣ Vérifie si le prof existe
    const userRepo = AppDataSource.getRepository(Prof);
    let prof = await userRepo.findOneBy({ login: userData.login });
    if (!prof) throw new Error("Accès refusé : prof non autorisé");

    // 4️⃣ Mise à jour infos + token chiffré
    prof.name = userData.name;
    prof.avatar_url = userData.avatar_url;
    prof.encryptedToken = encrypt(oauthToken);
    await userRepo.save(prof);

    // 5️⃣ JWT de session local
    const token = jwt.sign(
        { id: prof.id, login: prof.login, avatar_url: prof.avatar_url, name: prof.name },
        ENV.JWT_SECRET,
        { expiresIn: "2h", algorithm: "HS256" }
    );

    return {
        token,
        user: { id: prof.id, login: prof.login, name: prof.name, avatar_url: prof.avatar_url },
    };
}
