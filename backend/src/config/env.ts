//backend/src/config/env.ts
import dotenv from "dotenv";
dotenv.config();

export const ENV = {
    CLIENT_ID: process.env.CLIENT_ID!,
    CLIENT_SECRET: process.env.CLIENT_SECRET!,
    JWT_SECRET: process.env.JWT_SECRET!,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY!,
    //ALLOWED_PROFS: process.env.ALLOWED_PROFS?.split(",").map((x) => x.trim()) || [],
    FRONT_URL: "http://localhost:5173",
};
