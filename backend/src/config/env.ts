//backend/src/config/env.ts
import * as dotenv from "dotenv";
dotenv.config({path: ".env.local"});

function required(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`❌ Variable d'environnement manquante : ${name}`);
    return value;
}

export const ENV = {
    CLIENT_ID: required("CLIENT_ID"),
    CLIENT_SECRET: required("CLIENT_SECRET"),
    JWT_SECRET: required("JWT_SECRET"),
    ENCRYPTION_KEY: required("ENCRYPTION_KEY"),
    FRONT_URL:
        process.env.NODE_ENV === "production"
            ? "https://githelper.up.railway.app"
            : "http://localhost:5173",

    GITHUB_APP_ID: required("GITHUB_APP_ID"),
    GITHUB_APP_PRIVATE_KEY: required("GITHUB_APP_PRIVATE_KEY"),
    GITHUB_APP_CLIENT_ID: required("GITHUB_APP_CLIENT_ID"),
    GITHUB_APP_CLIENT_SECRET: required("GITHUB_APP_CLIENT_SECRET"),
};



