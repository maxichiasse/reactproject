// backend/src/services/orgService.ts
import axios from "axios";
import { AppDataSource } from "../data-source";
import { Organization } from "../entity/Organization";
import { Prof } from "../entity/Prof";
import { decrypt } from "../utils/crypto";
import { githubFetch } from "../utils/github";
import { getInstalledOrgs } from "./githubAppService";

/**
 * 🔹 Déchiffre le token GitHub du prof pour utiliser l’OAuth App
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
 * 🔹 Synchronise les organisations via le token utilisateur (OAuth App)
 */
export async function syncOrganizations(profId: number) {
    const orgRepo = AppDataSource.getRepository(Organization);
    const profRepo = AppDataSource.getRepository(Prof);

    const prof = await profRepo.findOneBy({ id: profId });
    if (!prof) throw new Error("Prof introuvable");

    const token = await getDecryptedToken(profId);
    const orgsResponse = await githubFetch("/user/orgs", token);

    for (const org of orgsResponse) {
        let existing = await orgRepo.findOneBy({ name: org.login, ownerId: profId });

        if (!existing) {
            existing = orgRepo.create({
                name: org.login,
                avatar_url: org.avatar_url,
                public_repos: org.public_repos,
                ownerId: profId,
            });
        } else {
            existing.avatar_url = org.avatar_url;
            existing.public_repos = org.public_repos;
        }

        await orgRepo.save(existing);
    }

    const finalList = await orgRepo.find({ where: { ownerId: profId } });
    console.log(`✅ SyncOrgs terminée : ${finalList.length} organisations via OAuth pour ${prof.login}`);
    return finalList;
}

/**
 * 🔹 Synchronise les organisations installées via la GitHub App
 * (fonctionne sans “Grant”, automatiquement dès que l’app est installée)
 */
export async function syncInstalledOrganizations(profId: number) {
    const orgRepo = AppDataSource.getRepository(Organization);
    const profRepo = AppDataSource.getRepository(Prof);

    const prof = await profRepo.findOneBy({ id: profId });
    if (!prof) throw new Error("Prof introuvable");

    // 🔹 Liste des organisations où la GitHub App est installée
    const installedOrgs = await getInstalledOrgs();

    for (const org of installedOrgs) {
        let existing = await orgRepo.findOneBy({ name: org.account_login, ownerId: profId });

        if (!existing) {
            existing = orgRepo.create({
                name: org.account_login,
                avatar_url: org.account_avatar,
                public_repos: 0,
                ownerId: profId,
            });
        } else {
            existing.avatar_url = org.account_avatar;
        }

        await orgRepo.save(existing);
    }

    const finalList = await orgRepo.find({ where: { ownerId: profId } });
    console.log(`✅ SyncInstalledOrgs : ${finalList.length} organisations via GitHub App pour ${prof.login}`);
    return finalList;
}

