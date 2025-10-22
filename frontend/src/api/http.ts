//frontend/src/api/http.ts
import axios from "axios";

/**
 * Client Axios global configuré pour toute l'application.
 * Il gère :
 *  - le baseURL selon l'environnement
 *  - les cookies (JWT)
 *  - les intercepteurs d'erreurs 401
 *  - le token Bearer si présent en localStorage
 */

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
    withCredentials: true,
    timeout: 15000, // ⏳ Timeout de 15 secondes
});

// === Intercepteur requêtes ===
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("jwt");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// === Intercepteur réponses ===
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const currentPath = window.location.pathname;

        if (status === 401) {
            console.warn("🔒 Non authentifié (401)");
            // ❌ Ne redirige PAS sur les routes publiques (comme /CreateGroup)
            const publicPaths = ["/", "/callback"];
            const isCreateGroup = currentPath.startsWith("/CreateGroup");
            if (!publicPaths.includes(currentPath) && !isCreateGroup) {
                window.location.href = "/";
            }
        }

        return Promise.reject(error);
    }
);
