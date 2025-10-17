// backend/src/routes/authRoutes.ts
import * as express from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { githubAuth, getCurrentUser, logout } from "../controllers/authController";

const router = express.Router();

router.post("/auth/github", githubAuth);
router.get("/me", requireAuth, getCurrentUser);
router.post("/logout", logout);

export default router;
