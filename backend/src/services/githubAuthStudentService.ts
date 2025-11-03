// backend/src/services/githubAuthStudentService.ts
import { ENV } from "../config/env";

/**
 * 🔹 Échange le code OAuth GitHub d’un étudiant contre un access_token
 */
export async function exchangeStudentCodeForToken(code: string): Promise<string> {
    const redirectUri = `${ENV.FRONT_URL.replace(/\/$/, "")}/callback`;

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
            redirect_uri: redirectUri,
        }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
        throw new Error("Impossible d’obtenir un access_token étudiant");
    }

    return tokenData.access_token;
}

/**
 * 🔹 Récupère les informations du compte GitHub de l’étudiant
 */
export async function getStudentGithubProfile(token: string) {
    const userResponse = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!userResponse.ok) {
        const text = await userResponse.text();
        throw new Error(`Erreur GitHub (${userResponse.status}): ${text}`);
    }

    return userResponse.json();
}

/**
 * 🔹 Service complet pour l’authentification GitHub de l’étudiant
 */
export async function handleGithubAuthStudent(code: string, projectId: string) {
    const token = await exchangeStudentCodeForToken(code);
    const profile = await getStudentGithubProfile(token);

    return {
        id: profile.id,
        login: profile.login,
        name: profile.name,
        avatar_url: profile.avatar_url,
        projectId,
    };
}
