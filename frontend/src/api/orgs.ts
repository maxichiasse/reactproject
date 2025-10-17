//frontend/src/api/orgs.ts
import { api } from "./http"

export const orgsAPI = {
    // 📦 Récupère la liste des organisations du user
    getAll: () => api.get("/api/organizations"),

    // 🔍 Vérifie s’il existe déjà un projet lié à une org
    getProjectForOrg: (orgName: string) => api.get(`/api/organizations/${orgName}/project`),

    // 📁 Récupère les repos GitHub d’une organisation
    getRepos: (orgName: string) => api.get(`/api/organizations/${orgName}/repos`),
};
