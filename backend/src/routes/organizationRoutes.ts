//backend/src/routes/organizationRoutes.ts
import { Router } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { syncOrganizations } from "../services/orgService";
import { AppDataSource } from "../data-source";
import { Prof } from "../entity/Prof";
import { Organization } from "../entity/Organization";
import { decrypt } from "../utils/crypto";
import { githubFetch } from "../utils/github";

const router = Router();

interface CustomJwtPayload extends jwt.JwtPayload {
    id: number;
}

/**
 * 🔹 Route pour synchroniser et récupérer toutes les organisations du prof connecté
 */
router.get("/organizations", async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Non authentifié" });

    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as CustomJwtPayload;
        const orgs = await syncOrganizations(decoded.id);
        res.json(orgs);
    } catch (err: any) {
        console.error("Erreur /organizations:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * 🔹 Route pour récupérer les repositories GitHub d’une organisation
 */
router.get("/organizations/:orgName/repos", async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Non authentifié" });

    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as CustomJwtPayload;
        const profRepo = AppDataSource.getRepository(Prof);
        const orgRepo = AppDataSource.getRepository(Organization);

        // 🔑 On retrouve le prof connecté et son token GitHub chiffré
        const prof = await profRepo.findOneBy({ id: decoded.id });
        if (!prof || !prof.encryptedToken)
            return res.status(403).json({ error: "Token GitHub manquant" });

        // 🔍 On vérifie que l'organisation existe et appartient au prof
        const org = await orgRepo.findOneBy({
            name: req.params.orgName,
            ownerId: decoded.id,
        });
        if (!org)
            return res.status(404).json({ error: "Organisation non trouvée" });

        // 🔓 Déchiffre le token GitHub du prof
        const githubToken = decrypt(prof.encryptedToken);

        // 🌐 Appel API GitHub pour récupérer les repos
        const repos = await githubFetch(
            `https://api.github.com/orgs/${org.name}/repos`,
            githubToken
        );

        res.json(repos);
    } catch (err: any) {
        console.error("Erreur /organizations/:orgName/repos:", err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;
