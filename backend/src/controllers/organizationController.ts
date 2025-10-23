//backend/src/controllers/githubSearchController.ts
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { syncOrganizations, syncInstalledOrganizations } from "../services/orgService";
import { getInstalledOrgs, getInstallationRepos } from "../services/githubAppService";
import { handleGithubError } from "../utils/errorHandler";

interface CustomJwtPayload {
    id: number;
    login: string;
}

/**
 * 🔹 Récupère et synchronise toutes les organisations GitHub du prof connecté
 * Combine les orgs visibles via l’OAuth App et celles détectées via la GitHub App.
 */
export const getOrganizations = async (req: Request, res: Response) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Non authentifié" });

    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as CustomJwtPayload;

        // 🔁 Récupère les organisations via OAuth (GitHelperAuth)
        const oauthOrgs = await syncOrganizations(decoded.id);

        // 🔁 Récupère les organisations via la GitHub App (GitHelperProject)
        const appOrgs = await syncInstalledOrganizations(decoded.id);

        // 🔹 Fusionne les deux sans doublons
        const merged = [
            ...appOrgs,
            ...oauthOrgs.filter((o) => !appOrgs.some((a) => a.name === o.name)),
        ];

        res.json(merged);
    } catch (err: any) {
        console.error("❌ Erreur lors de la récupération des organisations:", err.message);
        return handleGithubError(res, err);
    }
};

/**
 * 🔹 Récupère les repositories d’une organisation via la GitHub App
 */
export const getOrganizationRepos = async (req: Request, res: Response) => {
    try {
        const { orgName } = req.params;
        if (!orgName) return res.status(400).json({ error: "Organisation manquante" });

        // Liste des installations de ta GitHub App
        const installations = await getInstalledOrgs();
        const org = installations.find((i: any) => i.account_login === orgName);

        if (!org) {
            return res
                .status(404)
                .json({ error: `Organisation '${orgName}' non trouvée ou non installée` });
        }

        // Récupère les repos de cette installation
        const repos = await getInstallationRepos(org.installation_id);
        res.json(repos);
    } catch (err: any) {
        console.error("❌ Erreur getOrganizationRepos:", err.message);
        return handleGithubError(res, err);
    }
};
