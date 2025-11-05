// backend/src/services/authService.ts
import { AppDataSource } from "../data-source";
import { Prof } from "../entity/Prof";
import { decrypt } from "../utils/crypto";
import { ENV } from "../config/env";
import * as jwt from "jsonwebtoken";

/**
 * 🔹 Authentifie un prof via GitHub OAuth
 * → Si le prof est en base, on utilise son PAT enregistré
 * → Sinon, on refuse la connexion
 */


export async function handleGithubAuth(code: string) {
    // 1️⃣ Échange code OAuth ↔️ access_token GitHub
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
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

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token)
        throw new Error("Impossible d’obtenir le token OAuth GitHub");

    const oauthToken = tokenData.access_token;

    // 2️⃣ Récupère les infos du user GitHub (login, name, avatar)
    const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${oauthToken}` },
    });

    if (!userRes.ok)
        throw new Error("Erreur lors de la récupération du profil GitHub");

    const userData = await userRes.json();

    // 3️⃣ Vérifie si le prof est autorisé (présent en base)
    const userRepo = AppDataSource.getRepository(Prof);
    const prof = await userRepo.findOneBy({ login: userData.login });

    if (!prof) {
        console.error(`⛔ Prof ${userData.login} non autorisé`);
        throw new Error("Accès refusé : prof non autorisé");
    }

    // 4️⃣ Utilise le PAT déjà stocké (on ignore le token OAuth)
    if (!prof.encryptedToken) {
        console.error(`❌ Aucun PAT enregistré pour ${prof.login}`);
        throw new Error("Aucun PAT trouvé pour ce professeur.");
    }

    const githubToken = decrypt(prof.encryptedToken);
    console.log(`✅ Utilisation du PAT stocké pour ${prof.login}`);

    // 5️⃣ Met à jour les infos publiques
    prof.name = userData.name || prof.name;
    prof.avatar_url = userData.avatar_url || prof.avatar_url;
    await userRepo.save(prof);

    // 6️⃣ Génère un JWT pour la session
    const token = jwt.sign(
        {
            id: prof.id,
            login: prof.login,
            avatar_url: prof.avatar_url,
            name: prof.name,
        },
        ENV.JWT_SECRET,
        { expiresIn: "2h", algorithm: "HS256" }
    );

    // 7️⃣ Retourne le JWT + les infos publiques
    return {
        token,
        user: {
            id: prof.id,
            login: prof.login,
            name: prof.name,
            avatar_url: prof.avatar_url,
        },
    };
}
