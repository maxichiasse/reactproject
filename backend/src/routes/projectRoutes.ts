//backend/src/routes/projectRoutes.ts
import * as express from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
    createProjectController,
    getProjectByOrg,
    verifyProjectLink,
} from "../controllers/projectController";

const router = express.Router();

// ➕ Créer un projet
router.post("/organizations/:orgName/projects", requireAuth, createProjectController);

// 🔍 Récupérer un projet d’organisation
router.get("/organizations/:orgName/project", getProjectByOrg);

// ✅ Vérifier la validité d’un lien de projet
router.get("/projects/:id/:key", verifyProjectLink);

export default router;
