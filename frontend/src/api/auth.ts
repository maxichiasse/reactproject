//frontend/src/api/auth.ts
import { api } from "./http";

export const authAPI = {
    // 🔐 Authentification via GitHub OAuth
    login: (code: string) => api.post("/api/auth/github", { code }),

    // 🚪 Déconnexion
    logout: () => api.post("/api/logout"),

    // 👤 Récupère les infos de l’utilisateur connecté
    me: () => api.get("/api/me"),
};
