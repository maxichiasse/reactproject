//backend/src/controllers/githubSearchController.ts
import type { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Project } from "../entity/Project";
import { Student } from "../entity/Student";
import { Group } from "../entity/Group";
import { createRepoAndInviteStudents } from "../services/githubRepoService";
import {handleGithubError} from "../utils/errorHandler";

/**
 * ➕ Crée un groupe d'étudiants et un repo GitHub pour un projet
 */
export const createGroup = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { secretKey, students } = req.body;

        const projectRepo = AppDataSource.getRepository(Project);
        const groupRepo = AppDataSource.getRepository(Group);
        const studentRepo = AppDataSource.getRepository(Student);

        // 🔐 Vérifie la clé secrète du projet
        const project = await projectRepo.findOne({
            where: { id: Number(projectId), secretKey },
            relations: ["organization", "owner"],
        });
        if (!project) {
            return res.status(403).json({ error: "Clé secrète invalide." });
        }

        // 🚫 Vérifie si un étudiant est déjà inscrit dans un groupe du même projet
        for (const s of students) {
            const existing = await studentRepo.findOne({
                where: { project: { id: project.id }, githubId: String(s.id) },
            });
            if (existing) {
                return res.status(400).json({
                    error: `@${s.login} est déjà inscrit dans un autre groupe.`,
                });
            }
        }

        // 🏷️ Crée un nom de groupe unique
        const count = await groupRepo.count({ where: { project: { id: project.id } } });
        const groupName = `Groupe${(count + 1).toString().padStart(2, "0")}`;

        // 💾 Création du groupe
        const group = new Group();
        group.name = groupName;
        group.project = project;
        await groupRepo.save(group);

        // 💾 Enregistre les étudiants dans la BDD
        for (const s of students) {
            const stud = new Student();
            stud.githubId = String(s.id);
            stud.githubLogin = s.login;
            stud.githubAvatar = s.avatar_url;
            stud.project = project;
            stud.group = group;
            await studentRepo.save(stud);
        }

        // 🔥 Crée le repository GitHub et invite les étudiants
        try {
            const repoUrl = await createRepoAndInviteStudents(project.id, groupName, students);
            console.log("✅ Repo créé et invitations envoyées");
            res.json({ success: true, groupName, repoUrl });
        } catch (err: any) {
            console.error("⚠️ Erreur création repo ou ajout collaborateurs:", err);
            res.json({
                success: true,
                groupName,
                repoUrl: null,
                warning: err.message,
            });
        }
    } catch (err: any) {
        return handleGithubError(res, err);
    }
};
