//backend/src/services/projectService.ts
import { AppDataSource } from "../data-source";
import { Project } from "../entity/Project";
import { Organization } from "../entity/Organization";
import { Prof } from "../entity/Prof";
import crypto from "crypto";

export async function createProject(
    orgName: string,
    profId: number,
    minStudents: number,
    maxStudents: number,
    maxGroups: number
) {
    const orgRepo = AppDataSource.getRepository(Organization);
    const projectRepo = AppDataSource.getRepository(Project);

    const org = await orgRepo.findOne({ where: { name: orgName, ownerId: profId } });
    if (!org) throw new Error("Organisation introuvable");

    const existing = await projectRepo.findOne({
        where: { organization: { id: org.id } },
        relations: ["groups"],
    });

    if (existing) {
        if (existing.groups.length === 0) {
            // 🛠️ Modifier le projet existant
            existing.minStudents = minStudents;
            existing.maxStudents = maxStudents;
            existing.maxGroups = maxGroups;
            await projectRepo.save(existing);
            return existing;
        } else {
            throw new Error("Un projet existe déjà pour cette organisation et des groupes sont créés.");
        }
    }


    const secretKey = crypto.randomBytes(16).toString("hex");

    const project = projectRepo.create({
        name: org.name,
        secretKey,
        minStudents,
        maxStudents,
        maxGroups,
        organization: org,
        owner: { id: profId } as Prof,
    });

    await projectRepo.save(project);
    return project;
}

