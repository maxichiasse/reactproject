//backend/src/config/env.ts

import 'dotenv/config'
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
    TOKEN_SECRET: required("TOKEN_SECRET"),

    FRONT_URL: required("FRONT_URL"),
};

console.log("🌍 Environnement :", process.env.NODE_ENV);
console.log("📁 Base MySQL :", process.env.MYSQLHOST);
console.log("🔗 Front URL :", ENV.FRONT_URL);


