//backend/src/routes/githubAuthStudentRoutes.ts
import * as express from "express";
import { githubAuthStudent } from "../controllers/githubAuthStudentController";

const router = express.Router();

router.get("/projects/:projectId/student", githubAuthStudent);

export default router;
