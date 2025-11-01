// backend/src/controllers/organizationController.ts
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { Prof } from "../entity/Prof";
import { Organization } from "../entity/Organization";
import { Project } from "../entity/Project";
import * as crypto from "crypto";
import { ENV } from "../config/env";

/**
 * 🔐 Déchiffre le token PAT du professeur
 */
function decryptToken(encrypted: string): string {
    const [ivHex, dataHex] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const encryptedData = Buffer.from(dataHex, "hex");
    const key = Buffer.from(process.env.TOKEN_SECRET!, "hex");

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted.toString("utf8");
}

/**
 * 🧠 Cache mémoire pour limiter les appels GitHub (clé = login prof)
 */
const orgCache = new Map<string, { data: any; timestamp: number }>();

/**
 * 🔹 Synchronise et renvoie les organisations GitHub du professeur connecté
 */
export const getOrganizations = async (req: Request, res: Response) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Non authentifié" });

    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: number; login: string };
        const profRepo = AppDataSource.getRepository(Prof);
        const orgRepo = AppDataSource.getRepository(Organization);

        const prof = await profRepo.findOneBy({ login: decoded.login });
        if (!prof) return res.status(403).json({ error: "Prof non autorisé ou inexistant" });

        // 🔹 Vérifie le cache
        if (orgCache.has(prof.login)) {
            const { data, timestamp } = orgCache.get(prof.login)!;
            if (Date.now() - timestamp < 5 * 60 * 1000) {
                console.log(`⚡ Cache hit pour ${prof.login}`);
                return res.json(data);
            }
        }

        // 🔹 Appel GitHub pour les organisations
        const decryptedPAT = decryptToken(prof.encryptedToken);
        const orgRes = await fetch("https://api.github.com/user/orgs", {
            headers: {
                Authorization: `Bearer ${decryptedPAT}`,
                Accept: "application/vnd.github+json",
                "User-Agent": "GitHelper-App",
            },
        });

        if (!orgRes.ok) throw new Error(`Erreur GitHub : ${orgRes.status}`);
        const orgs = await orgRes.json();

        const currentIds: number[] = [];
        for (const org of orgs) {
            const existing = await orgRepo.findOneBy({ githubId: org.id });
            currentIds.push(org.id);

            if (!existing) {
                await orgRepo.save({
                    githubId: org.id,
                    name: org.login || org.name,
                    avatar_url:
                        org.avatar_url ||
                        "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
                    public_repos: org.public_repos ?? 0,
                    owner: prof,
                    ownerId: prof.id,
                });
            } else {
                existing.name = org.login || org.name;
                existing.avatar_url = org.avatar_url;
                existing.public_repos = org.public_repos ?? 0;
                await orgRepo.save(existing);
            }
        }

        // 🔹 Supprime les orgs locales supprimées sur GitHub
        const allLocal = await orgRepo.find({ where: { owner: prof } });
        for (const local of allLocal) {
            if (!currentIds.includes(local.githubId)) {
                await orgRepo.remove(local);
                console.log(`🗑️ Supprimé : ${local.name} (n'existe plus sur GitHub)`);
            }
        }

        const updated = await orgRepo.find({ where: { owner: prof } });
        orgCache.set(prof.login, { data: updated, timestamp: Date.now() });

        console.log(`✅ ${updated.length} orgs synchronisées pour ${prof.login}`);
        return res.json(updated);
    } catch (err: any) {
        console.error("❌ Erreur getOrganizations:", err.message);
        return res.status(500).json({ error: err.message || "Erreur interne du serveur" });
    }
};

/**
 * 🔹 Récupère les dépôts publics d’une organisation GitHub spécifique
 */
export const getOrganizationRepos = async (req: Request, res: Response) => {
    const token = req.cookies.token;
    const { orgName } = req.params;
    if (!token) return res.status(401).json({ error: "Non authentifié" });
    if (!orgName) return res.status(400).json({ error: "Organisation manquante" });

    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as { login: string };
        const profRepo = AppDataSource.getRepository(Prof);
        const prof = await profRepo.findOneBy({ login: decoded.login });
        if (!prof) return res.status(403).json({ error: "Prof non autorisé" });

        const decryptedPAT = decryptToken(prof.encryptedToken);

        const repoRes = await fetch(`https://api.github.com/orgs/${orgName}/repos`, {
            headers: {
                Authorization: `Bearer ${decryptedPAT}`,
                Accept: "application/vnd.github+json",
                "User-Agent": "GitHelper-App",
            },
        });

        if (!repoRes.ok) {
            const errText = await repoRes.text();
            throw new Error(`Erreur GitHub : ${repoRes.status} ${errText}`);
        }

        const repos = await repoRes.json();
        console.log(`📦 ${repos.length} dépôts trouvés pour ${orgName}`);
        return res.json(repos);
    } catch (err: any) {
        console.error("❌ Erreur getOrganizationRepos:", err.message);
        return res.status(500).json({ error: err.message || "Erreur interne du serveur" });
    }
};

/**
 * 🔹 Récupère toutes les organisations GitHub du prof connecté
 *     + leurs dépôts publics associés.
 */
export const getOrganizationsWithRepoCount = async (req: Request, res: Response) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Non authentifié" });

    try {
        // 🔐 Décodage du token JWT
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as { login: string };
        const profRepo = AppDataSource.getRepository(Prof);
        const prof = await profRepo.findOneBy({ login: decoded.login });
        if (!prof) return res.status(403).json({ error: "Prof non autorisé" });

        // 🔑 Déchiffre le token personnel GitHub (PAT)
        const decryptedPAT = decryptToken(prof.encryptedToken);

        // 🧩 Récupère toutes les organisations dont le prof est membre/owner
        const orgRes = await fetch("https://api.github.com/user/orgs", {
            headers: {
                Authorization: `Bearer ${decryptedPAT}`,
                Accept: "application/vnd.github+json",
                "User-Agent": "GitHelper-App",
            },
        });

        if (!orgRes.ok) throw new Error(`Erreur GitHub : ${orgRes.status}`);
        const orgs = await orgRes.json();

        const results: any[] = [];

        // ⚡️ Promise.all pour accélérer le fetch des repos
        await Promise.all(
            orgs.map(async (org: any) => {
                try {
                    // 📦 Requêtes GitHub pour récupérer tous les dépôts publics de l'organisation
                    const reposRes = await fetch(
                        `https://api.github.com/orgs/${org.login}/repos?per_page=100`,
                        {
                            headers: {
                                Authorization: `Bearer ${decryptedPAT}`,
                                Accept: "application/vnd.github+json",
                                "User-Agent": "GitHelper-App",
                            },
                        }
                    );

                    if (!reposRes.ok) {
                        console.warn(`⚠️ Impossible de récupérer les dépôts pour ${org.login}`);
                        return;
                    }

                    const repos = await reposRes.json();

                    // 🧩 Simplifie les dépôts (frontend-friendly)
                    const simplifiedRepos = Array.isArray(repos)
                        ? repos.map((r: any) => ({
                            id: r.id,
                            name: r.name,
                            html_url: r.html_url,
                            description: r.description || "Pas de description",
                        }))
                        : [];

                    results.push({
                        id: org.id,
                        name: org.login || org.name,
                        avatar_url: org.avatar_url,
                        repoCount: simplifiedRepos.length,
                        repos: simplifiedRepos,
                    });
                } catch (innerErr: any) {
                    console.error(`❌ Erreur lors du fetch des repos de ${org.login}:`, innerErr.message);
                }
            })
        );

        console.log(`✅ ${results.length} organisations synchronisées pour ${prof.login}`);
        return res.json(results);
    } catch (err: any) {
        console.error("❌ Erreur getOrganizationsWithRepoCount:", err.message);
        return res.status(500).json({ error: err.message || "Erreur interne" });
    }
};

/**
 * 🔹 Récupère les détails d’une organisation : projet + repositories
 */
export const getOrganizationDetails = async (req: Request, res: Response) => {
    const token = req.cookies.token;
    const { orgName } = req.params;
    if (!token) return res.status(401).json({ error: "Non authentifié" });

    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as { login: string };
        const profRepo = AppDataSource.getRepository(Prof);
        const projectRepo = AppDataSource.getRepository(Project);
        const prof = await profRepo.findOneBy({ login: decoded.login });
        if (!prof) return res.status(403).json({ error: "Prof non autorisé" });

        const decryptedPAT = decryptToken(prof.encryptedToken);

        // 🔹 Projet local
        const project = await projectRepo.findOne({
            where: { organization: { name: orgName }, owner: { id: prof.id } },
            relations: ["groups"],
        });

        // 🔹 Repos GitHub
        const repoRes = await fetch(`https://api.github.com/orgs/${orgName}/repos`, {
            headers: {
                Authorization: `Bearer ${decryptedPAT}`,
                Accept: "application/vnd.github+json",
            },
        });

        if (!repoRes.ok) throw new Error(`Erreur GitHub : ${repoRes.status}`);
        const repos = await repoRes.json();

        const simplifiedRepos = repos.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description || "Pas de description",
            html_url: r.html_url,
        }));

        return res.json({
            organization: orgName,
            project: project || null,
            repositories: simplifiedRepos,
        });
    } catch (err: any) {
        console.error("❌ Erreur getOrganizationDetails:", err.message);
        return res.status(500).json({ error: err.message || "Erreur interne du serveur" });
    }
};
