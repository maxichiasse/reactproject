//backend/src/routes/projectRoutes.ts
import { Router } from "express";
import { projectSchema } from "../utils/validate";
import { requireAuth, type AuthRequest } from "../middleware/authMiddleware";
import { createProject } from "../services/projectService";
import { AppDataSource } from "../data-source";
import { Project } from "../entity/Project";
import { Organization } from "../entity/Organization";

const router = Router();

router.post("/organizations/:orgName/projects", requireAuth, async (req: AuthRequest, res) => {
    try {
        const { orgName } = req.params;
        const parsed = projectSchema.parse(req.body);

        if (parsed.minStudents > parsed.maxStudents)
            return res.status(400).json({ error: "minStudents > maxStudents" });

        const project = await createProject(orgName, req.user!.id, parsed.minStudents, parsed.maxStudents, parsed.maxGroups);
        res.status(201).json({
            ...project,
            joinUrl: `http://localhost:5173/CreateGroup/${project.id}/${project.secretKey}`
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/organizations/:orgName/project", async (req, res) => {
    const orgRepo = AppDataSource.getRepository(Organization);
    const projectRepo = AppDataSource.getRepository(Project);

    const org = await orgRepo.findOneBy({ name: req.params.orgName });
    if (!org) return res.status(404).json({ error: "Organisation introuvable" });

    const project = await projectRepo.findOne({
        where: { organization: { id: org.id } },
        relations: ["groups"],
    });

    if (!project) return res.status(404).json({ error: "Aucun projet trouvé" });

    const joinUrl = `http://localhost:5173/CreateGroup/${project.id}/${project.secretKey}`;

    res.json({ ...project, joinUrl });
});

// 🔹 Vérifie que le projet et la clé sont valides
router.get("/projects/:id/:key", async (req, res) => {
    const { id, key } = req.params;
    const projectRepo = AppDataSource.getRepository(Project);

    const project = await projectRepo.findOne({
        where: { id: Number(id), secretKey: key },
        relations: ["organization", "groups", "groups.students"],
    });

    if (!project)
        return res.status(404).json({ error: "Lien invalide ou projet introuvable" });

    res.json(project);
});


export default router;
