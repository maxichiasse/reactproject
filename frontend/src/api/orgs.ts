// frontend/src/api/orgs.ts
import { api } from "./http";

export const orgsAPI = {
    /** 📦 Liste des organisations du prof avec nombre de repos GitHub */
    getAllWithRepoCount: () => api.get("/api/organizations-with-repo-count"),

    /** 🧩 Détails d’une organisation : projet + repos */
    getDetails: (orgName: string) => api.get(`/api/organizations/${orgName}/details`),

    /** ⚙️ Anciennes méthodes (encore utilisées ailleurs éventuellement) */
    getAll: () => api.get("/api/organizations"),
    getProjectForOrg: (orgName: string) => api.get(`/api/organizations/${orgName}/project`),
    getRepos: (orgName: string) => api.get(`/api/organizations/${orgName}/repos`),
};
