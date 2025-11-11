//backend/src/unit/errorHandler.ts
import type { Response } from "express";

/**
 * 🧰 Gère uniformément les erreurs provenant de l’API GitHub.
 */
export function handleGithubError(res: Response, err: any) {
    console.error("❌ Erreur GitHub :", err.response?.status || "", err.response?.data || err.message);
    if (err?.status) {
        return res.status(err.status).json({ success: false, error: err.message });
    }
    const status = err.response?.status || 500;
    let message = "Erreur inconnue avec l’API GitHub.";

    if (status === 401)
        message = "Token GitHub invalide ou expiré.";
    else if (status === 403)
        message = "Accès interdit à l’API GitHub (rate limit ou permission manquante).";
    else if (status === 404)
        message = "Ressource GitHub introuvable.";
    else if (status === 422)
        message = "Requête invalide envoyée à GitHub.";
    else if (status >= 500)
        message = "Erreur interne GitHub. Réessayez plus tard.";
    else if (err.message)
        message = err.message;

    return res.status(status).json({ success: false, error: message });
}