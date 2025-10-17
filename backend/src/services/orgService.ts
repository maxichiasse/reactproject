//backend/src/services/orgService.ts
import { AppDataSource } from "../data-source";
import { Organization } from "../entity/Organization";
import { Prof } from "../entity/Prof";
import { decrypt } from "../utils/crypto";
import { githubFetch } from "../utils/github";

export async function syncOrganizations(profId: number) {
    const profRepo = AppDataSource.getRepository(Prof);
    const orgRepo = AppDataSource.getRepository(Organization);

    const prof = await profRepo.findOneBy({ id: profId });
    if (!prof || !prof.encryptedToken) throw new Error("Token GitHub manquant");
    const githubToken = decrypt(prof.encryptedToken);

    const orgsGithub = await githubFetch("https://api.github.com/user/orgs", githubToken);

    for (const org of orgsGithub) {
        const orgDetail = await githubFetch(`https://api.github.com/orgs/${org.login}`, githubToken);
        const totalRepos = (orgDetail.public_repos || 0) + (orgDetail.total_private_repos || 0);

        let existing = await orgRepo.findOneBy({ name: org.login, ownerId: profId });
        if (!existing) {
            existing = orgRepo.create({
                name: org.login,
                avatar_url: org.avatar_url,
                public_repos: totalRepos,
                ownerId: profId,
            });
        } else {
            existing.avatar_url = org.avatar_url;
            existing.public_repos = totalRepos;
        }

        await orgRepo.save(existing);
    }

    return orgRepo.find({ where: { ownerId: profId } });
}
