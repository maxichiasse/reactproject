// backend/src/services/githubSearchService.ts
import { githubRequest } from "./githubService";

/**
 * 🔍 Recherche d’utilisateurs GitHub en utilisant le token du prof (lié à un projet)
 * @param projectId ID du projet (sert à récupérer le token du prof)
 * @param query Texte à rechercher sur GitHub
 */
export async function searchGithubUsersByProject(projectId: number, query: string) {
    if (!query || query.trim().length < 1) {
        throw new Error("Paramètre de recherche manquant ou invalide.");
    }

    const data = await githubRequest(
        `https://api.github.com/search/users?q=${encodeURIComponent(query)}`,
        projectId
    );

    return (data.items || []).map((user: any) => ({
        id: user.id,
        login: user.login,
        avatar_url: user.avatar_url,
    }));
}
