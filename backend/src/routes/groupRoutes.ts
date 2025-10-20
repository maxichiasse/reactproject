//backend/src/routes/groupRoutes.ts
import * as express from "express";
import { createGroup } from "../controllers/groupController";

const router = express.Router();

// ➕ Création d’un groupe d’étudiants et du repo associé
router.post("/projects/:projectId/groups", createGroup);

export default router;
