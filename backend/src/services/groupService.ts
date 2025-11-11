// backend/src/services/groupService.ts
import { AppDataSource } from "../data-source";
import { Project } from "../entity/Project";
import { Student } from "../entity/Student";
import { Group } from "../entity/Group";
import { createRepoAndInviteStudents, deleteGithubRepo } from "./githubRepoService";
import { ILike, Raw } from "typeorm";

/**
 * 🔹 Crée un groupe d’étudiants pour un projet donné
 */
export async function createGroupForProject(
    projectId: number,
    secretKey: string,
    students: any[]
) {
    const projectRepo = AppDataSource.getRepository(Project);
    const groupRepo = AppDataSource.getRepository(Group);
    const studentRepo = AppDataSource.getRepository(Student);

    const project = await projectRepo.findOne({
        where: { id: projectId, secretKey },
        relations: ["organization", "owner"],
    });
    if (!project) throw new Error("Clé secrète invalide.");

    for (const s of students) {
        const existing = await studentRepo.findOne({
            where: { project: { id: project.id }, githubId: String(s.id) },
        });
        if (existing) throw new Error(`@${s.login} est déjà inscrit dans un autre groupe.`);
    }

    const count = await groupRepo.count({ where: { project: { id: project.id } } });
    const groupName = `Groupe${(count + 1).toString().padStart(2, "0")}`;

    const group = groupRepo.create({ name: groupName, project });
    await groupRepo.save(group);

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

function inferGroupNameFromRepo(repoName: string) {
    const idx = repoName.indexOf("-");
    return (idx > 0 ? repoName.slice(0, idx) : repoName).trim();
}

/**
 * ❌ Supprime un groupe et son repository GitHub
 * 🔹 Gère à la fois les repos GitHelper (liés à la base)
 *   et les repos externes (non liés à la base)
 */
export async function deleteGroup(repoName: string, orgName: string, requesterId: number) {
    const groupRepo = AppDataSource.getRepository(Group);
    const prefix = inferGroupNameFromRepo(repoName);

    let group =
        await groupRepo.findOne({
            where: { name: Raw((alias) => `LOWER(${alias}) = LOWER(:n)`, { n: repoName }) },
            relations: ["project", "project.owner", "project.organization"],
        }) ||
        await groupRepo.findOne({
            where: { name: ILike(prefix) },
            relations: ["project", "project.owner", "project.organization"],
        });

    const isExternal = !group;
    let profId: number | null = null;
    let orgFromDB: string | null = null;

    if (group) {
        const project = group.project;
        if (project.owner.id !== requesterId) {
            throw new Error("Accès refusé : vous n’êtes pas le propriétaire du projet.");
        }

        if (project.organization) orgFromDB = project.organization.name;
        profId = project.owner.id;
    }

    const orgToUse = orgFromDB || orgName;
    if (!orgToUse) console.warn("⚠️ Organisation inconnue, tentative de suppression directe…");

    try {
        if (profId) {
            await deleteGithubRepo(orgToUse, repoName.toLowerCase(), profId);
        } else {
            console.log(`ℹ️ Suppression externe : ${repoName}`);
            const proj = await AppDataSource.getRepository(Project)
                .createQueryBuilder("p")
                .leftJoinAndSelect("p.owner", "owner")
                .leftJoinAndSelect("p.organization", "organization")
                .getOne();

            if (proj?.owner) {
                await deleteGithubRepo(orgToUse, repoName.toLowerCase(), proj.owner.id);
            } else {
                console.warn("⚠️ Aucun token prof valide pour suppression GitHub.");
            }
        }
    } catch (err: any) {
        console.error(`❌ Erreur GitHub suppression ${repoName}:`, err.response?.data || err.message);
    }

    if (!isExternal && group) {
        await groupRepo.remove(group);
        console.log(`✅ Groupe supprimé en base : ${group.name}`);
    } else {
        console.log(`ℹ️ Repo ${repoName} non géré par GitHelper → suppression GitHub uniquement.`);
    }

    return {
        success: true,
        message: isExternal
            ? `Repository "${repoName}" supprimé (aucun groupe associé)`
            : `Repository et groupe "${repoName}" supprimés`,
    };
}
