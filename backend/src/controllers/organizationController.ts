//backend/src/controllers/githubSearchController.ts
import type { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { AppDataSource } from "../data-source";
import { syncOrganizations } from "../services/orgService";
import { Prof } from "../entity/Prof";
import { Organization } from "../entity/Organization";
import { decrypt } from "../utils/crypto";
import { githubFetch } from "../utils/github";
import {handleGithubError} from "../utils/errorHandler";

interface CustomJwtPayload extends jwt.JwtPayload {
    id: number;
}

/**
 * 🔹 Synchronise et renvoie toutes les organisations GitHub du prof connecté
 */
export const getOrganizations = async (req: Request, res: Response) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Non authentifié" });

    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as CustomJwtPayload;
        const orgs = await syncOrganizations(decoded.id);
        res.json(orgs);
    } catch (err: any) {
        return handleGithubError(res, err);
    }
};

/**
 * 🔹 Récupère les dépôts GitHub d’une organisation donnée
 */
export const getOrganizationRepos = async (req: Request, res: Response) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Non authentifié" });

    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as CustomJwtPayload;
        const profRepo = AppDataSource.getRepository(Prof);
        const orgRepo = AppDataSource.getRepository(Organization);

        // 🧩 On retrouve le prof connecté et son token GitHub
        const prof = await profRepo.findOneBy({ id: decoded.id });
        if (!prof || !prof.encryptedToken)
            return res.status(403).json({ error: "Token GitHub manquant" });

        // 🧩 Vérifie que l'organisation appartient bien au prof
        const org = await orgRepo.findOneBy({
            name: req.params.orgName,
            ownerId: decoded.id,
        });
        if (!org)
            return res.status(404).json({ error: "Organisation non trouvée" });

        // 🔓 Déchiffre le token GitHub
        const githubToken = decrypt(prof.encryptedToken);

        // 🌐 Appel API GitHub pour les repos
        const repos = await githubFetch(
            `https://api.github.com/orgs/${org.name}/repos`,
            githubToken
        );

        res.json(repos);
    } catch (err: any) {
        return handleGithubError(res, err);
    }
};
