//backend/src/routes/testGithubRoutes.ts
import express from "express";
import { githubRequest } from "../services/githubService";

const router = express.Router();

router.get("/test/github/:projectId", async (req, res) => {
    try {
        const { projectId } = req.params;
        const data = await githubRequest("https://api.github.com/user", Number(projectId));
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
