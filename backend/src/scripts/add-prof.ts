//backend/src/scripts/add-prof.ts
import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();

import { AppDataSource } from "../data-source";
import { Prof } from "../entity/Prof";
import axios from "axios";
import * as crypto from "crypto";

// ─── 🔐 Chiffrement AES-256-CBC ──────────────────────────────────────────────
function encryptToken(token: string): string {
    const algorithm = "aes-256-cbc";
    const secretKey = Buffer.from(process.env.TOKEN_SECRET!, "hex");

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

    const encrypted = Buffer.concat([cipher.update(token), cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

// ─── 🏁 Script principal ───────────────────────────────────────────────────────
const plainToken = process.argv[2];

if (!plainToken) {
    console.error("❌ Tu dois passer le token GitHub en argument !");
    console.error("Exemple : npx ts-node src/backend/scripts/add-prof.ts ghp_tonToken");
    process.exit(1);
}

AppDataSource.initialize().then(async () => {
    console.log("✅ Connexion à la base de données réussie");

    try {
        // 1. Appel API GitHub pour valider le token
        const response = await axios.get("https://api.github.com/user", {
            headers: {
                Authorization: `token ${plainToken}`,
            },
        });

        const scopes = response.headers["x-oauth-scopes"];
        const { id, login, name, avatar_url } = response.data;

        console.log("🔍 Token validé !");
        console.log(`👤 Utilisateur GitHub : ${login} (${id})`);
        console.log(`🛡️ Scopes du token   : ${scopes || "Aucun scope retourné"}`);

        // 2. Chiffrement du token
        const encryptedToken = encryptToken(plainToken);

        // 3. Insertion ou mise à jour en base de données
        const profRepo = AppDataSource.getRepository(Prof);
        const existing = await profRepo.findOneBy({ id });

        if (existing) {
            console.log(`♻️ Mise à jour du prof ${login}...`);
            existing.encryptedToken = encryptedToken;
            await profRepo.save(existing);
            console.log("✅ Mise à jour réussie !");
        } else {
            const prof = profRepo.create({
                id,
                login,
                name,
                avatar_url,
                encryptedToken,
            });
            await profRepo.save(prof);
            console.log("✅ Nouveau prof ajouté en base !");
        }

    } catch (err: any) {
        if (err.response?.status === 401) {
            console.error("❌ Token invalide ou expiré (401 Unauthorized)");
        } else if (err.response?.status === 403) {
            console.error("❌ Accès interdit à l’API GitHub (403 Forbidden)");
        } else {
            console.error("❌ Erreur lors de l’appel GitHub :", err.message);
        }
        process.exit(1);
    }

    process.exit(0);
}).catch((err) => {
    console.error("❌ Erreur DB :", err.message);
    process.exit(1);
});
