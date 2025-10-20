// backend/src/routes/githubSearchRoutes.ts
import * as express from "express";
import { searchGithubUsers } from "../controllers/githubSearchController";

const router = express.Router();

// 🔍 Recherche d’utilisateurs GitHub
router.get("/projects/:projectId/github-users", searchGithubUsers);

export default router;
