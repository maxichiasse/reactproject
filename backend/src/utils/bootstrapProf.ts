//backend/src/utils/bootstrapProf.ts
import axios from "axios";
import { DataSource } from "typeorm";
import { Prof } from "../entity/Prof";
import * as crypto from "crypto";

function encryptToken(token: string): string {
    const algorithm = "aes-256-cbc";
    const secretKey = Buffer.from(process.env.TOKEN_SECRET!, "hex");
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

    const encrypted = Buffer.concat([cipher.update(token), cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export async function bootstrapProfessorToken(db: DataSource) {
    const rawToken = process.env.GITHUB_TOKEN_RAW;

    if (!rawToken) {
        console.log("✅ Aucun token GitHub brut détecté — rien à faire.");
        return;
    }

    console.log("🔍 Token GitHub brut détecté, vérification...");

    try {
        const res = await axios.get("https://api.github.com/user", {
            headers: { Authorization: `token ${rawToken}` },
        });

        const { id, login, name, avatar_url } = res.data;
        console.log(`✅ Token valide pour ${login}`);

        const encrypted = encryptToken(rawToken);
        const profRepo = db.getRepository(Prof);

        let existing = await profRepo.findOneBy({ login });

        if (existing) {
            existing.encryptedToken = encrypted;
            await profRepo.save(existing);
            console.log("✅ Mise à jour du professeur existant");
        } else {
            const newProf = profRepo.create({ id, login, name, avatar_url, encryptedToken: encrypted });
            await profRepo.save(newProf);
            console.log("✅ Nouveau professeur ajouté !");
        }

        // ✅ SUPPRESSION AUTOMATIQUE DE LA VARIABLE RAILWAY
        await deleteRailwayVariable("GITHUB_TOKEN_RAW");
        console.log("🧹 Variable GITHUB_TOKEN_RAW supprimée de Railway ✅");

    } catch (e: any) {
        console.error("❌ Erreur de vérification GitHub :", e.response?.data || e.message);
    }
}

/// ---- Fonction pour supprimer la variable Railway ---- ///
async function deleteRailwayVariable(variableName: string) {
    const railwayToken = process.env.RAILWAY_TOKEN;
    const railwayServiceId = process.env.RAILWAY_SERVICE_ID;

    if (!railwayToken || !railwayServiceId) {
        console.log("⚠️ Impossible de supprimer la variable : manque RAILWAY_TOKEN ou SERVICE_ID");
        return;
    }

    await axios.delete(
        `https://backboard.railway.app/v2/services/${railwayServiceId}/variables/${variableName}`,
        {
            headers: { Authorization: `Bearer ${railwayToken}` },
        }
    );
}
