//backend/src/routes/organizationRoutes.ts
import * as express from "express";
import { getOrganizations, getOrganizationRepos } from "../controllers/organizationController";

const router = express.Router();

// 🔹 Synchronisation et récupération des organisations du prof
router.get("/organizations", getOrganizations);

// 🔹 Récupération des dépôts GitHub d’une organisation
router.get("/organizations/:orgName/repos", getOrganizationRepos);

export default router;
