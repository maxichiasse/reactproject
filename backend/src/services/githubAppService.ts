// backend/src/services/githubAppService.ts
import jwt from "jsonwebtoken";
import axios from "axios";
import { ENV } from "../config/env";

/**
 * 🔹 Génère un JWT d’authentification signé pour la GitHub App
 * Ce JWT est valable 10 minutes (spécifié par GitHub)
 */
export function generateAppJWT(): string {
    const now = Math.floor(Date.now() / 1000);

    const payload = {
        iat: now - 60, // écart de sécurité
        exp: now + 9 * 60, // 9 minutes
        iss: ENV.GITHUB_APP_ID, // identifiant de l'app GitHub
    };

    return jwt.sign(payload, ENV.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n"), {
        algorithm: "RS256",
    });
}

/**
 * 🔹 Liste toutes les installations (organisations ou comptes)
 * où la GitHub App est installée.
 *
 * 👉 Chaque installation correspond à une organisation
 *     visible dans ton frontend sans "Grant" manuel.
 */
export async function getInstalledOrgs() {
    const jwtApp = generateAppJWT();

    const res = await axios.get("https://api.github.com/app/installations", {
        headers: {
            Authorization: `Bearer ${jwtApp}`,
            Accept: "application/vnd.github+json",
        },
    });

    // Format simplifié pour ton frontend
    const orgs = res.data.map((inst: any) => ({
        installation_id: inst.id,
        account_login: inst.account.login,
        account_avatar: inst.account.avatar_url,
        html_url: inst.account.html_url,
    }));

    return orgs;
}

/**
 * 🔹 Récupère un token d’installation (installation access token)
 * Ce token permet d’accéder aux repos de l’organisation installée.
 *
 * 👉 Tu l’utiliseras dans ton futur code pour afficher les repos via la GitHub App.
 */
export async function getInstallationToken(installationId: number): Promise<string> {
    const jwtApp = generateAppJWT();

    const res = await axios.post(
        `https://api.github.com/app/installations/${installationId}/access_tokens`,
        {},
        {
            headers: {
                Authorization: `Bearer ${jwtApp}`,
                Accept: "application/vnd.github+json",
            },
        }
    );

    return res.data.token;
}

/**
 * 🔹 Exemple d’utilisation : récupérer les repos d’une org via la GitHub App
 * (Optionnel mais prêt à l’emploi)
 */
export async function getInstallationRepos(installationId: number) {
    const token = await getInstallationToken(installationId);

    const res = await axios.get("https://api.github.com/installation/repositories", {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
        },
    });

    return res.data.repositories.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        html_url: repo.html_url,
        description: repo.description,
    }));
}
