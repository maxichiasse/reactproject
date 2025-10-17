//backend/app.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { errorMiddleware } from "./middleware/errorMiddleware";
import authRoutes from "./routes/authRoutes";
import orgRoutes from "./routes/organizationRoutes";
import projectRoutes from "./routes/projectRoutes";
import testGithubRoutes from "./routes/testGithubRoutes";
import githubSearchRoutes from "./routes/githubSearchRoutes";
import githubAuthStudentRoutes from "./routes/githubAuthStudentRoutes";
import GroupRoutes from "./routes/groupRoutes";


export const app = express();

// === Sécurité & middlewares globaux ===
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
}));

// === Routes API ===
app.use("/api", authRoutes);
app.use("/api", orgRoutes);
app.use("/api", testGithubRoutes);
app.use("/api", githubSearchRoutes);
app.use("/api", githubAuthStudentRoutes);
app.use("/api", GroupRoutes);
app.use("/api", projectRoutes);


// === Gestion globale des erreurs ===
app.use(errorMiddleware);
