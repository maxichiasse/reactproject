// backend/src/services/groupService.ts
import { AppDataSource } from "../data-source";
import { Project } from "../entity/Project";
import { Student } from "../entity/Student";
import { Group } from "../entity/Group";
import { createRepoAndInviteStudents } from "./githubRepoService";

/**
 * 🔹 Crée un groupe d’étudiants pour un projet donné
 */
export async function createGroupForProject(projectId: number, secretKey: string, students: any[]) {
    const projectRepo = AppDataSource.getRepository(Project);
    const groupRepo = AppDataSource.getRepository(Group);
    const studentRepo = AppDataSource.getRepository(Student);

    // 🔐 Vérifie la clé secrète du projet
    const project = await projectRepo.findOne({
        where: { id: projectId, secretKey },
        relations: ["organization", "owner"],
    });
    if (!project) throw new Error("Clé secrète invalide.");

    // 🚫 Vérifie si un étudiant est déjà inscrit dans un autre groupe du même projet
    for (const s of students) {
        const existing = await studentRepo.findOne({
            where: { project: { id: project.id }, githubId: String(s.id) },
        });
        if (existing) throw new Error(`@${s.login} est déjà inscrit dans un autre groupe.`);
    }

    // 🏷️ Crée un nom de groupe unique
    const count = await groupRepo.count({ where: { project: { id: project.id } } });
    const groupName = `Groupe${(count + 1).toString().padStart(2, "0")}`;

    // 💾 Crée et sauvegarde le groupe
    const group = groupRepo.create({ name: groupName, project });
    await groupRepo.save(group);

    // 💾 Sauvegarde les étudiants
    for (const s of students) {
        const stud = studentRepo.create({
            githubId: String(s.id),
            githubLogin: s.login,
            githubAvatar: s.avatar_url ?? "https://avatars.githubusercontent.com/u/0?v=4",
            project,
            group,
        });
        await studentRepo.save(stud);
    }

    // 🔥 Crée le repo GitHub et invite les étudiants
    let repoUrl: string | null = null;
    let warning: string | null = null;

    try {
        repoUrl = await createRepoAndInviteStudents(project.id, groupName, students);
    } catch (err: any) {
        console.error("⚠️ Erreur création repo ou ajout collaborateurs:", err.message);
        warning = err.message;
    }

    return { success: true, groupName, repoUrl, warning };
}
