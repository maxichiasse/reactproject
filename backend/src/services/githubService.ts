//backend/src/services/githubService.ts
import { AppDataSource } from "../data-source";
import { Project } from "../entity/Project";
import { Prof } from "../entity/Prof";
import { decrypt } from "../utils/crypto";

/**
 * 🔹 Récupère le token GitHub du prof propriétaire d’un projet
 */
export async function getProfessorTokenByProjectId(projectId: number): Promise<string> {
    const projectRepo = AppDataSource.getRepository(Project);
    const profRepo = AppDataSource.getRepository(Prof);

    // 1️⃣ Trouver le projet et le prof associé
    const project = await projectRepo.findOne({
        where: { id: projectId },
        relations: ["owner"],
    });

    if (!project || !project.owner)
        throw new Error("Projet ou propriétaire introuvable");

    const prof = await profRepo.findOneBy({ id: project.owner.id });
    if (!prof || !prof.encryptedToken)
        throw new Error("Token GitHub du prof introuvable");

    // 2️⃣ Déchiffrer le token
    const token = decrypt(prof.encryptedToken);
    return token;
}

/**
 * 🔹 Exécute un appel à l’API GitHub avec le token du prof
 */
export async function githubRequest(url: string, projectId: number) {
    const token = await getProfessorTokenByProjectId(projectId);

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
        },
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`GitHub API error (${res.status}): ${errText}`);
    }

    return res.json();
}
