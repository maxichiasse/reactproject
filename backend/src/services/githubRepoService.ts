//backend/src/services/githubRepoService.ts
import axios from "axios";
import { AppDataSource } from "../data-source";
import { Project } from "../entity/Project";
import { Prof } from "../entity/Prof";
import { decrypt } from "../utils/crypto";

/**
 * 🔹 Récupère et déchiffre le token GitHub du prof propriétaire d’un projet
 */
export async function getDecryptedToken(profId: number): Promise<string> {
    const profRepo = AppDataSource.getRepository(Prof);
    const prof = await profRepo.findOneBy({ id: profId });

    if (!prof?.encryptedToken) {
        throw new Error("Token GitHub du prof introuvable");
    }

    return decrypt(prof.encryptedToken);
}

/**
 * 🔹 Crée un repository GitHub privé dans l’organisation du prof pour un groupe donné
 */
export async function createGithubRepoForGroup(projectId: number, groupName: string) {
    const projectRepo = AppDataSource.getRepository(Project);

    const project = await projectRepo.findOne({
        where: { id: projectId },
        relations: ["owner", "organization"],
    });

    if (!project) throw new Error("Projet introuvable");
    if (!project.owner || !project.organization)
        throw new Error("Owner ou organisation manquante");

    const token = await getDecryptedToken(project.owner.id);
    const orgName = project.organization.name;
    const repoName = `${groupName}-${project.name}`.toLowerCase().replace(/\s+/g, "-");

    console.log(`🚀 Création du repo GitHub : ${orgName}/${repoName}`);

    try {
        const response = await axios.post(
            `https://api.github.com/orgs/${orgName}/repos`,
            {
                name: repoName,
                private: true,
                description: `Repository pour ${groupName} (${project.name})`,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github+json",
                },
            }
        );

        console.log(`✅ Repo créé : ${response.data.html_url}`);
        return response.data; // contient html_url, name, id, etc.
    } catch (err: any) {
        console.error("❌ Erreur GitHub (création repo):", err.response?.status, err.response?.data || err.message);
        throw err;
    }
}

/**
 * 🔹 Ajoute un étudiant GitHub comme collaborateur sur le repo du groupe
 */
export async function addCollaboratorToRepo(
    orgName: string,
    repoName: string,
    githubLogin: string,
    token: string
) {
    try {
        const response = await axios.put(
            `https://api.github.com/repos/${orgName}/${repoName}/collaborators/${githubLogin}`,
            {
                permission: "push", // droits d'écriture (commit, push, etc.)
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github+json",
                },
            }
        );

        console.log(`👥 Invitation envoyée à ${githubLogin} pour ${repoName}`);
        return response.data;
    } catch (err: any) {
        if (err.response?.status === 404)
            console.error(`⚠️ Repo ou utilisateur introuvable pour ${githubLogin}`);
        else
            console.error("❌ Erreur ajout collaborateur:", err.response?.data || err.message);
    }
}

/**
 * 🔹 Crée un repo et ajoute automatiquement les étudiants collaborateurs
 */
export async function createRepoAndInviteStudents(projectId: number, groupName: string, students: { login: string }[]) {
    const projectRepo = AppDataSource.getRepository(Project);
    const project = await projectRepo.findOne({
        where: { id: projectId },
        relations: ["owner", "organization"],
    });

    if (!project) throw new Error("Projet introuvable");
    if (!project.owner || !project.organization)
        throw new Error("Owner ou organisation manquante");

    const token = await getDecryptedToken(project.owner.id);
    const orgName = project.organization.name;

    // Étape 1 → créer le repo
    const repo = await createGithubRepoForGroup(projectId, groupName);

    // Étape 2 → inviter les étudiants
    for (const student of students) {
        await addCollaboratorToRepo(orgName, repo.name, student.login, token);
    }

    return repo.html_url;
}
