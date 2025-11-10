// backend/src/services/organizationService.ts
import { AppDataSource } from "../data-source";
import { Prof } from "../entity/Prof";
import { Organization } from "../entity/Organization";
import { Project } from "../entity/Project";
import { ENV } from "../config/env";
import jwt from "jsonwebtoken";
import { decrypt } from "../utils/crypto";
import { githubFetch } from "../utils/github";


/* ============================================================
   💾 Met à jour les organisations GitHub en base
============================================================ */

async function upsertOrganizationsForProf(prof: Prof, orgsFromGithub: any[]) {
    const orgRepo = AppDataSource.getRepository(Organization);
    const currentIds: number[] = [];

    for (const org of orgsFromGithub) {
        currentIds.push(org.id);

        let existing = await orgRepo.findOne({
            where: { githubId: org.id, owner: { id: prof.id } },
        });

        if (!existing) {
            // 🆕 Nouvelle organisation : on la crée
            existing = orgRepo.create({
                githubId: org.id,
                name: org.login || org.name,
                avatar_url:
                    org.avatar_url ||
                    "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
                public_repos: org.public_repos ?? 0,
                owner: prof,
            });
        } else {
            // ✏️ On met à jour sans recréer (on garde le même ID)
            existing.name = org.login || org.name;
            existing.avatar_url = org.avatar_url;
            existing.public_repos = org.public_repos ?? 0;
        }

        await orgRepo.save(existing);
    }

    // ✅ Retourne toutes les orgs du prof (avec leurs projets liés)
    return orgRepo.find({
        where: { owner: { id: prof.id } },
        relations: ["projects"],
    });
}


/* ============================================================
   ⚡ Cache mémoire pour limiter les appels GitHub
============================================================ */
const orgCache = new Map<string, { data: any; timestamp: number }>();

/* ============================================================
   🔹 Fonctions principales
============================================================ */
export const organizationService = {
    async getProfessorFromToken(token: string) {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as { login: string };
        const prof = await AppDataSource.getRepository(Prof).findOneBy({ login: decoded.login });
        if (!prof) throw new Error("Prof non autorisé");
        return prof;
    },

    async fetchOrganizations(prof: Prof) {
        const decryptedPAT = decrypt(prof.encryptedToken);
        return githubFetch("/user/orgs", decryptedPAT);
    },

    async getOrganizations(prof: Prof) {
        // Vérifie le cache
        if (orgCache.has(prof.login)) {
            const { data, timestamp } = orgCache.get(prof.login)!;
            if (Date.now() - timestamp < 5 * 60 * 1000) return data;
        }

        const orgsFromGithub = await this.fetchOrganizations(prof);
        const updated = await upsertOrganizationsForProf(prof, orgsFromGithub);

        orgCache.set(prof.login, { data: updated, timestamp: Date.now() });
        return updated;
    },

    async getOrganizationRepos(prof: Prof, orgName: string) {
        const decryptedPAT = decrypt(prof.encryptedToken);
        return githubFetch(`/orgs/${orgName}/repos`, decryptedPAT);
    },

        async getOrganizationsWithRepoCount(prof: Prof) {
            const orgs = await this.fetchOrganizations(prof);
            const orgRepo = AppDataSource.getRepository(Organization);
            const projectRepo = AppDataSource.getRepository(Project);

            // 🔄 Mets à jour en base les organisations du prof
            await upsertOrganizationsForProf(prof, orgs);

            const decryptedPAT = decrypt(prof.encryptedToken);
            const results: any[] = [];

            // Pour chaque organisation GitHub
            for (const org of orgs) {
                const orgName = org.login || org.name;
                const repos = await githubFetch(`/orgs/${orgName}/repos?per_page=100`, decryptedPAT);

                // Vérifie s'il existe un projet lié à cette organisation
                const localOrg = await orgRepo.findOne({
                    where: { name: orgName, owner: { id: prof.id } },
                    relations: ["projects"],
                });

                let projectExists = false;
                let hasGroups = false;

                if (localOrg && localOrg.projects.length > 0) {
                    const project = await projectRepo.findOne({
                        where: { organization: { id: localOrg.id } },
                        relations: ["groups"],
                    });
                    if (project) {
                        projectExists = true;
                        hasGroups = project.groups && project.groups.length > 0;
                    }
                }

                results.push({
                    id: org.id,
                    name: orgName,
                    avatar_url: org.avatar_url,
                    repoCount: repos.length,
                    projectExists,
                    hasGroups,
                });
            }

            return results;
        },

    async getOrganizationDetails(prof: Prof, orgName: string) {
        const decryptedPAT = decrypt(prof.encryptedToken);
        const projectRepo = AppDataSource.getRepository(Project);

        // 🔹 Récupère le projet local lié à cette organisation (PostgreSQL)
        const project = await projectRepo.findOne({
            where: { organization: { name: orgName }, owner: { id: prof.id } },
            relations: ["groups"],
        });

        // 🔹 Récupère les repos GitHub
        const repos = await this.getOrganizationRepos(prof, orgName);

        // 🧠 Pour chaque repo → on ajoute les collaborateurs (étudiants)
        const enrichedRepos = await Promise.all(
            repos.map(async (repo: any) => {
                try {
                    // Appel API GitHub pour les collaborateurs
                    const collaborators = await githubFetch(
                        `/repos/${orgName}/${repo.name}/collaborators`,
                        decryptedPAT
                    );

                    // Filtrer pour exclure le prof (owner)
                    const members = collaborators
                        .filter(
                            (user: any) =>
                                user.login.toLowerCase() !==
                                repo.owner.login.toLowerCase()
                        )
                        .map((user: any) => ({
                            login: user.login,
                            avatar_url: user.avatar_url,
                            html_url: user.html_url,
                        }));

                    return {
                        id: repo.id,
                        name: repo.name,
                        description: repo.description || "Pas de description",
                        html_url: repo.html_url,
                        members,
                    };
                } catch (err: any) {
                    console.warn(`⚠️ Impossible de charger les collaborateurs pour ${repo.name}`);
                    return {
                        id: repo.id,
                        name: repo.name,
                        description: repo.description || "Pas de description",
                        html_url: repo.html_url,
                        members: [],
                    };
                }
            })
        );

        return { organization: orgName, project: project || null, repositories: enrichedRepos };
    },

};
