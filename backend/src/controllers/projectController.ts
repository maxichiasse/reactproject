//backend/src/controllers/projectController.ts
import type { Request, Response } from "express";
import { projectSchema } from "../utils/validate";
import { requireAuth, type AuthRequest } from "../middleware/authMiddleware";
import { createProject } from "../services/projectService";
import { AppDataSource } from "../data-source";
import { Project } from "../entity/Project";
import { Organization } from "../entity/Organization";
import {ENV} from "../config/env";
import { Group } from "../entity/Group";


/**
 * ➕ Crée un projet pour une organisation donnée
 */
export const createProjectController = async (req: AuthRequest, res: Response) => {
    try {
        const { orgName } = req.params;
        const parsed = projectSchema.parse(req.body);

        if (parsed.minStudents > parsed.maxStudents)
            return res.status(400).json({ error: "minStudents > maxStudents" });

        const project = await createProject(
            orgName,
            req.user!.id,
            parsed.name,
            parsed.minStudents,
            parsed.maxStudents,
            parsed.maxGroups
        );

        res.status(201).json({
            ...project,
            joinUrl: `${ENV.FRONT_URL}/CreateGroup/${project.id}/${project.secretKey}`,
        });
    } catch (err: any) {
        console.error("Erreur création projet:", err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * 🔍 Récupère le projet associé à une organisation
 */
export const getProjectByOrg = async (req: Request, res: Response) => {
    try {
        const orgRepo = AppDataSource.getRepository(Organization);
        const projectRepo = AppDataSource.getRepository(Project);

        const org = await orgRepo.findOneBy({ name: req.params.orgName });
        if (!org)
            return res.status(404).json({ error: "Organisation introuvable" });

        const project = await projectRepo.findOne({
            where: { organization: { id: org.id } },
            relations: ["groups"],
        });

        if (!project)
            return res.status(404).json({ error: "Aucun projet trouvé" });

        const joinUrl = `http://localhost:5173/CreateGroup/${project.id}/${project.secretKey}`;
        res.json({ ...project, joinUrl });
    } catch (err: any) {
        console.error("Erreur récupération projet:", err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * ✅ Vérifie que le projet et la clé secrète sont valides
 */
export const verifyProjectLink = async (req: Request, res: Response) => {
    try {
        const { id, key } = req.params;
        const projectRepo = AppDataSource.getRepository(Project);

        const project = await projectRepo.findOne({
            where: { id: Number(id), secretKey: key },
            relations: ["organization", "groups", "groups.students"],
        });

        if (!project)
            return res.status(404).json({ error: "Lien invalide ou projet introuvable" });

        res.json(project);
    } catch (err: any) {
        console.error("Erreur vérification lien projet:", err);
        res.status(500).json({ error: err.message });
    }
};

export const deleteProjectController = async (req: AuthRequest, res: Response) => {
    try {
        const { orgName } = req.params;
        if (!req.user) return res.status(401).json({ error: "Non authentifié." });

        const projectRepo = AppDataSource.getRepository(Project);

        // Projet du prof pour cette org
        const project = await projectRepo.findOne({
            where: { organization: { name: orgName }, owner: { id: req.user.id } },
            relations: ["organization", "owner"],
        });

        if (!project) {
            return res.status(404).json({ error: "Projet introuvable pour cette organisation." });
        }

        // Compter les groupes liés
        const groupRepo = AppDataSource.getRepository(Group);
        const groupCount = await groupRepo.count({ where: { project: { id: project.id } } });

        if (groupCount > 0) {
            return res
                .status(409)
                .json({ error: `Ce projet contient encore ${groupCount} groupe(s). Supprimez-les d'abord.` });
        }

        await projectRepo.remove(project);
        console.log(`🗑️ Projet supprimé : ${orgName}`);

        return res.json({ success: true, message: "Projet supprimé avec succès." });
    } catch (err: any) {
        console.error("❌ Erreur suppression projet :", err);
        return res.status(500).json({ error: err.message || "Erreur serveur" });
    }
};
