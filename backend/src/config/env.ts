//backend/src/config/env.ts
import * as dotenv from "dotenv";
dotenv.config();

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
    FRONT_URL: process.env.FRONT_URL || "https://reactproject-production-b20a.up.railway.app/",

    GITHUB_APP_ID: required("GITHUB_APP_ID"),
    GITHUB_APP_PRIVATE_KEY: required("GITHUB_APP_PRIVATE_KEY"),
    GITHUB_APP_CLIENT_ID: required("GITHUB_APP_CLIENT_ID"),
    GITHUB_APP_CLIENT_SECRET: required("GITHUB_APP_CLIENT_SECRET"),
};



