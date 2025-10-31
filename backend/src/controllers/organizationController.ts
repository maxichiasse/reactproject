// backend/src/controllers/organizationController.ts
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { Prof } from "../entity/Prof";
import * as crypto from "crypto";
import { ENV } from "../config/env";

/**
 * Déchiffre le PAT du professeur
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
 * 🔹 Récupère les organisations GitHub du professeur connecté via son PAT (pas la GitHub App)
 */
export const getOrganizations = async (req: Request, res: Response) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Non authentifié" });

    try {
        // 1️⃣ Décoder le JWT pour récupérer le login GitHub
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: number; login: string };
        const login = decoded.login;

        // 2️⃣ Récupérer le prof depuis la base
        const profRepo = AppDataSource.getRepository(Prof);
        const prof = await profRepo.findOneBy({ login });
        if (!prof) {
            return res.status(403).json({ error: "Prof non autorisé ou inexistant" });
        }

        // 3️⃣ Déchiffrer le PAT
        const decryptedPAT = decryptToken(prof.encryptedToken);

        // 4️⃣ Appeler l’API GitHub avec ce PAT
        const orgRes = await fetch("https://api.github.com/user/orgs", {
            headers: {
                Authorization: `Bearer ${decryptedPAT}`,
                Accept: "application/vnd.github+json",
                "User-Agent": "GitHelper-App",
            },
        });

        if (!orgRes.ok) {
            const errorText = await orgRes.text();
            throw new Error(`Erreur GitHub : ${orgRes.status} ${errorText}`);
        }

        const orgs = await orgRes.json();

        // 5️⃣ Mapper le format
        const formattedOrgs = orgs.map((org: any) => ({
            id: org.id,
            name: org.login || org.name,
            avatar_url:
                org.avatar_url ||
                "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
            public_repos: org.public_repos ?? 0,
        }));

        console.log(`✅ Orgs récupérées via PAT pour ${login} (${formattedOrgs.length})`);
        return res.json(formattedOrgs);
    } catch (err: any) {
        console.error("❌ Erreur /api/organizations:", err.message);
        return res.status(500).json({ error: err.message || "Erreur interne du serveur" });
    }
};

/**
 * (Optionnel) — Récupère les repos d’une org avec le PAT (et non la GitHub App)
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
        return res.json(repos);
    } catch (err: any) {
        console.error("❌ Erreur getOrganizationRepos:", err.message);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};
