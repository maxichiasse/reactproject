// backend/src/routes/organizationRoutes.ts
import * as express from "express";
import {
    getOrganizations,
    getOrganizationRepos,
    getOrganizationsWithRepoCount,
    getOrganizationDetails,
} from "../controllers/organizationController";

const router = express.Router();

// 🔹 Synchronisation et récupération des organisations du prof
router.get("/organizations", getOrganizations);

// 🔹 Récupération du nombre de repositories par organisation
router.get("/organizations-with-repo-count", getOrganizationsWithRepoCount);

// 🔹 Récupération des dépôts GitHub d’une organisation
router.get("/organizations/:orgName/repos", getOrganizationRepos);

// 🔹 Récupération complète : projet + repos
router.get("/organizations/:orgName/details", getOrganizationDetails);

export default router;
