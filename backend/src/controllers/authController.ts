// backend/src/controllers/authController.ts
import type { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Prof } from "../entity/Prof";
import * as crypto from "crypto";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { AuthRequest } from "../middleware/authMiddleware";

/**
 * 🔓 Déchiffre le PAT du prof
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
 * 🔐 Connexion via OAuth GitHub :
 * - Authentifie l’utilisateur GitHub
 * - Vérifie s’il est dans la table `prof`
 * - Déchiffre son PAT et récupère ses organisations
 * - Crée un JWT avec ses infos (id, login, name, avatar_url)
 * - Stocke le JWT dans un cookie sécurisé
 */
export const githubAuth = async (req: Request, res: Response) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code manquant" });

    try {
        // 1️⃣ Échange le code contre un access_token OAuth GitHub
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
            body: new URLSearchParams({
                client_id: ENV.CLIENT_ID,
                client_secret: ENV.CLIENT_SECRET,
                code,
            }),
        });

        const tokenData = await tokenRes.json();
        const oauthToken = tokenData.access_token;
        if (!oauthToken) throw new Error("Impossible d’obtenir le token OAuth");

        // 2️⃣ Récupère les infos utilisateur GitHub
        const userRes = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${oauthToken}` },
        });
        const userData = await userRes.json();

        const { login, id, avatar_url, name } = userData;
        if (!login) throw new Error("Utilisateur GitHub introuvable");

        // 3️⃣ Vérifie si le user est enregistré dans la table `prof`
        const profRepo = AppDataSource.getRepository(Prof);
        const prof = await profRepo.findOneBy({ login });

        if (!prof) {
            return res.status(403).json({
                success: false,
                error: "Accès refusé : ce compte GitHub n’est pas enregistré comme professeur.",
            });
        }

        // 4️⃣ Déchiffre le PAT du prof
        const decryptedPAT = decryptToken(prof.encryptedToken);

        // 5️⃣ Récupère toutes les organisations du prof via son PAT
        const orgRes = await fetch("https://api.github.com/user/orgs", {
            headers: { Authorization: `Bearer ${decryptedPAT}` },
        });

        if (!orgRes.ok) {
            const text = await orgRes.text();
            throw new Error(`Erreur GitHub : ${text}`);
        }

        const orgs = await orgRes.json();
        const organizations = orgs.map((org: any) => ({
            id: org.id,
            name: org.login || org.name,
            avatar_url:
                org.avatar_url ||
                "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
            public_repos: org.public_repos || 0,
        }));

        console.log(`✅ Connexion réussie pour ${login} (${organizations.length} organisations)`);

        // 6️⃣ Crée un JWT (inclut les infos utiles pour le frontend)
        const token = jwt.sign(
            { id, login, name: name || prof.name, avatar_url: avatar_url || prof.avatar_url },
            process.env.JWT_SECRET!,
            { expiresIn: "2h" }
        );

        // 7️⃣ Stocke le JWT dans un cookie sécurisé
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 2 * 60 * 60 * 1000, // 2h
        });

        // 8️⃣ Renvoie les infos et les organisations au frontend
        return res.status(200).json({
            success: true,
            user: { id, login, name: name || prof.name, avatar_url: avatar_url || prof.avatar_url },
            organizations,
        });
    } catch (err: any) {
        console.error("❌ Erreur /auth/github:", err.message);
        res.status(500).json({
            success: false,
            error: err.message || "Erreur serveur",
        });
    }
};

/**
 * 👤 Récupère l’utilisateur courant (via JWT)
 */
export const getCurrentUser = (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Non authentifié" });
    res.json(req.user);
};

/**
 * 🚪 Déconnexion (efface le cookie JWT)
 */
export const logout = (_req: Request, res: Response) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.status(200).json({ message: "Déconnecté" });
};
