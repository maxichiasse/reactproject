// backend/src/services/authService.ts
import { AppDataSource } from "../data-source";
import { Prof } from "../entity/Prof";
import { Organization } from "../entity/Organization";
import { encrypt } from "../utils/crypto";
import { ENV } from "../config/env";
import * as jwt from "jsonwebtoken";
import fetch from "node-fetch";

interface TokenResponse {
    access_token?: string;
    error?: string;
}

interface GithubUser {
    id: number;
    login: string;
    name: string;
    avatar_url: string;
}

interface GithubOrg {
    login: string;
    avatar_url: string;
    public_repos?: number;
    total_private_repos?: number;
}

/**
 * 🔹 Authentifie un prof via GitHub OAuth et synchronise ses organisations
 */
export async function handleGithubAuth(code: string) {
    // 1️⃣ Échange code OAuth ↔️ access_token GitHub
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: new URLSearchParams({
            client_id: ENV.CLIENT_ID,
            client_secret: ENV.CLIENT_SECRET,
            code,
        }),
    });

    const tokenData = (await tokenResponse.json()) as TokenResponse;
    if (!tokenData.access_token)
        throw new Error(`Impossible d’obtenir un access_token GitHub : ${tokenData.error}`);

    const userToken = tokenData.access_token;

    // 2️⃣ Infos GitHub user
    const userResponse = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${userToken}` },
    });
    const userData = (await userResponse.json()) as GithubUser;

    // 3️⃣ Vérifie si le prof existe
    const userRepo = AppDataSource.getRepository(Prof);
    let prof = await userRepo.findOneBy({ id: userData.id });
    if (!prof) throw new Error("Accès refusé : prof non autorisé");

    // 4️⃣ Mise à jour infos + token chiffré
    prof.login = userData.login;
    prof.name = userData.name;
    prof.avatar_url = userData.avatar_url;
    prof.encryptedToken = encrypt(userToken);
    await userRepo.save(prof);

    // 5️⃣ Synchronisation des organisations GitHub
    const orgResponse = await fetch("https://api.github.com/user/orgs", {
        headers: { Authorization: `Bearer ${userToken}` },
    });

    const orgsGithub = (await orgResponse.json()) as GithubOrg[];
    const orgRepo = AppDataSource.getRepository(Organization);
    const localOrgs = await orgRepo.find({ where: { ownerId: prof.id } });

    const githubOrgNames = orgsGithub.map((o) => o.login);

    for (const org of orgsGithub) {
        const orgDetailResponse = await fetch(`https://api.github.com/orgs/${org.login}`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        const orgDetail = (await orgDetailResponse.json()) as GithubOrg;

        const totalRepos = (orgDetail.public_repos || 0) + (orgDetail.total_private_repos || 0);
        let existing = await orgRepo.findOneBy({ name: org.login, ownerId: prof.id });
        if (!existing) {
            existing = orgRepo.create({
                name: org.login,
                avatar_url: org.avatar_url,
                public_repos: totalRepos,
                ownerId: prof.id,
            });
        } else {
            existing.avatar_url = org.avatar_url;
            existing.public_repos = totalRepos;
        }
        await orgRepo.save(existing);
    }

    for (const local of localOrgs) {
        if (!githubOrgNames.includes(local.name)) {
            console.log(`🗑️ Suppression de ${local.name} (n'existe plus sur GitHub)`);
            await orgRepo.remove(local);
        }
    }

    console.log(`✅ SyncOrgs terminée : ${orgsGithub.length} organisations pour ${prof.login}`);

    // 6️⃣ JWT de session local
    const token = jwt.sign(
        { id: prof.id, login: prof.login, avatar_url: prof.avatar_url, name: prof.name },
        ENV.JWT_SECRET,
        { expiresIn: "2h", algorithm: "HS256" }
    );

    return { token, user: { id: prof.id, login: prof.login, name: prof.name, avatar_url: prof.avatar_url } };
}
