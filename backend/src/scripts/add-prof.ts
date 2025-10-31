// backend/src/scripts/add-prof.ts
import "reflect-metadata";
import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import { Prof } from "../entity/Prof";
import { Organization } from "../entity/Organization";
import { Project } from "../entity/Project";
import { Group } from "../entity/Group";
import { Student } from "../entity/Student";
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

// ─── ⚙️ Fonction d’ajout dans une base donnée ────────────────────────────────
async function addToDatabase(envFile: string, label: string, plainToken: string) {
    // ⚠️ Important : override = true pour remplacer les anciennes valeurs
    dotenv.config({ path: envFile, override: true });

    const host = process.env.MYSQLHOST!;
    const port = Number(process.env.MYSQLPORT!);
    const user = process.env.MYSQLUSER!;
    const database = process.env.MYSQLDATABASE!;

    const db = new DataSource({
        type: "mariadb",
        host,
        port,
        username: user,
        password: process.env.MYSQLPASSWORD!,
        database,
        entities: [Prof, Organization, Project, Group, Student],
        synchronize: false,
        logging: false,
    });

    console.log(`\n🔹 [${label}] Connexion à ${host}:${port} (user: ${user}, db: ${database})...`);
    await db.initialize();
    console.log(`✅ [${label}] Base de données connectée (${database})`);

    const profRepo = db.getRepository(Prof);

    try {
        // 1️⃣ Vérification du token via l’API GitHub
        const response = await axios.get("https://api.github.com/user", {
            headers: { Authorization: `token ${plainToken}` },
        });

        const scopes = response.headers["x-oauth-scopes"];
        const { id, login, name, avatar_url } = response.data;

        console.log(`🔍 [${label}] Token validé pour ${login}`);
        console.log(`🛡️ [${label}] Scopes du token : ${scopes || "Non spécifié"}`);

        // 2️⃣ Chiffrement du token
        const encryptedToken = encryptToken(plainToken);

        // 3️⃣ Ajout ou mise à jour du professeur
        const existing = await profRepo.findOneBy({ login });

        if (existing) {
            console.log(`♻️ [${label}] Mise à jour du prof ${login}...`);
            existing.encryptedToken = encryptedToken;
            await profRepo.save(existing);
            console.log(`✅ [${label}] Mise à jour réussie !`);
        } else {
            const prof = profRepo.create({ id, login, name, avatar_url, encryptedToken });
            await profRepo.save(prof);
            console.log(`✅ [${label}] Nouveau prof ajouté !`);
        }
    } catch (err: any) {
        console.error(`❌ [${label}] Erreur :`, err.response?.data?.message || err.message);
    } finally {
        await db.destroy();
        console.log(`🔚 [${label}] Connexion fermée.`);
    }
}

// ─── 🏁 Script principal ─────────────────────────────────────────────────────
const plainToken = process.argv[2];
if (!plainToken) {
    console.error("❌ Tu dois passer le token GitHub en argument !");
    console.error("Exemple : npm run add-prof ghp_tonToken");
    process.exit(1);
}

(async () => {
    console.log("🚀 Début de l’ajout du professeur dans les deux bases...");

    // ➤ Ajout base locale
    await addToDatabase(".env.local", "LOCAL", plainToken);

    // ➤ Ajout base Railway
    await addToDatabase(".env.production", "RAILWAY", plainToken);

    console.log("\n🏁 Terminé : professeur ajouté/mis à jour dans les deux bases !");
    process.exit(0);
})();

