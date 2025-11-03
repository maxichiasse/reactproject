// backend/src/controllers/organizationController.ts
import type { Request, Response } from "express";
import { organizationService } from "../services/organizationService";
import { handleGithubError } from "../utils/errorHandler";

/**
 * 🔹 Synchronise et renvoie les organisations GitHub du professeur connecté
 */
export const getOrganizations = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ error: "Non authentifié" });

        const prof = await organizationService.getProfessorFromToken(token);
        const orgs = await organizationService.getOrganizations(prof);
        return res.json(orgs);
    } catch (err: any) {
        return handleGithubError(res, err);
    }
};

/**
 * 🔹 Récupère les dépôts d’une organisation GitHub
 */
export const getOrganizationRepos = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.token;
        const { orgName } = req.params;
        if (!token) return res.status(401).json({ error: "Non authentifié" });

        const prof = await organizationService.getProfessorFromToken(token);
        const repos = await organizationService.getOrganizationRepos(prof, orgName);
        return res.json(repos);
    } catch (err: any) {
        return handleGithubError(res, err);
    }
};

/**
 * 🔹 Récupère les organisations + leurs dépôts
 */
export const getOrganizationsWithRepoCount = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ error: "Non authentifié" });

        const prof = await organizationService.getProfessorFromToken(token);
        const orgs = await organizationService.getOrganizationsWithRepoCount(prof);
        return res.json(orgs);
    } catch (err: any) {
        return handleGithubError(res, err);
    }
};

/**
 * 🔹 Récupère les détails d’une organisation
 */
export const getOrganizationDetails = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.token;
        const { orgName } = req.params;
        if (!token) return res.status(401).json({ error: "Non authentifié" });

        const prof = await organizationService.getProfessorFromToken(token);
        const details = await organizationService.getOrganizationDetails(prof, orgName);
        return res.json(details);
    } catch (err: any) {
        return handleGithubError(res, err);
    }
};

