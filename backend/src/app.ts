//backend/app.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { configureSecurity} from "./config/security";

import { errorMiddleware } from "./middleware/errorMiddleware";
import authRoutes from "./routes/authRoutes";
import orgRoutes from "./routes/organizationRoutes";
import projectRoutes from "./routes/projectRoutes";
import githubSearchRoutes from "./routes/githubSearchRoutes";
import githubAuthStudentRoutes from "./routes/githubAuthStudentRoutes";
import GroupRoutes from "./routes/groupRoutes";

export const app = express();

app.set("trust proxy", 1);

// === Sécurité & middlewares globaux ===
app.use(express.json());
app.use(cookieParser());

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://githelper.up.railway.app",
        ],
        credentials: true,
    })
);


app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
    })
);

app.use(morgan("dev"));
configureSecurity(app);

// === Routes API ===
app.use("/api", authRoutes);
app.use("/api", orgRoutes);
app.use("/api", githubSearchRoutes);
app.use("/api", githubAuthStudentRoutes);
app.use("/api", GroupRoutes);
app.use("/api", projectRoutes);

// === Gestion globale des erreurs ===
app.use(errorMiddleware);