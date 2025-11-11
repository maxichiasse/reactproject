//backend/src/routes/groupRoutes.ts
import * as express from "express";
import { createGroup, deleteGroupController } from "../controllers/groupController";
import { requireAuth } from "../middleware/authMiddleware";

const router = express.Router();

// ➕ Création d’un groupe d’étudiants et du repo associé
router.post("/projects/:projectId/groups", createGroup);

// ❌ Suppression d’un groupe et de son repo GitHub (authentification requise)
router.delete("/groups/:groupName", requireAuth, deleteGroupController);

export default router;
