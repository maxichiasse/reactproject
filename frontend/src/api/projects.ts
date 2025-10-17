//frontend/src/api/projects.ts
import { api } from "./http";
import type { CreateGroupPayload, CreateProjectPayload } from "types/api";

/**
 * API centralisée pour la gestion des projets.
 * Toutes les requêtes axios liées aux projets passent ici.
 */
export const projectsAPI = {
    /** ➕ Crée un projet pour une organisation */
    create: (orgName: string, payload: CreateProjectPayload) =>
        api.post(`/api/organizations/${orgName}/projects`, payload),

    /** 🔍 Récupère un projet existant (via orgName) */
    get: (orgName: string) =>
        api.get(`/api/organizations/${orgName}/project`),

    /** 🔍 Récupère un projet via ID + clé secrète */
    getBySecret: (projectId: string, key: string) =>
        api.get(`/api/projects/${projectId}/${key}`),

    /** 👤 Récupère le profil GitHub d’un étudiant via code OAuth */
    getStudentByCode: (projectId: string, code: string) =>
        api.get(`/api/projects/${projectId}/student`, { params: { code } }),

    /** 🔎 Recherche des utilisateurs GitHub pour ajout dans un groupe */
    searchGithubUsers: (projectId: string, q: string) =>
        api.get(`/api/projects/${projectId}/github-users`, { params: { q } }),

    /** 🧑‍🤝‍🧑 Crée un groupe d’étudiants */
    createGroup: (projectId: string, payload: CreateGroupPayload) =>
        api.post(`/api/projects/${projectId}/groups`, payload),
};
