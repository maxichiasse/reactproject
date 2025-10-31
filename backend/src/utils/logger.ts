// backend/src/utils/logger.ts

/**
 * 🌍 Détection environnement
 */
export const ENV_MODE = process.env.NODE_ENV || "development";
export const isDev = ENV_MODE === "development";
export const isProd = ENV_MODE === "production";

/**
 * 🎯 Log toujours (succès/erreurs importantes)
 */
export function log(message: string, ...args: any[]) {
    console.log(message, ...args);
}

/**
 * 🧩 Log uniquement en développement (pour debug)
 */
export function devLog(message: string, ...args: any[]) {
    if (isDev) console.log(message, ...args);
}

/**
 * ⚠️ Log d’erreur (affiché dans tous les environnements)
 */
export function errorLog(message: string, ...args: any[]) {
    console.error("❌", message, ...args);
}
