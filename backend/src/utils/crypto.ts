// backend/src/utils/crypto.ts
import crypto from "crypto";

const TOKEN_SECRET = process.env.TOKEN_SECRET!;
if (!TOKEN_SECRET) throw new Error("❌ TOKEN_SECRET manquant !");

const key = Buffer.from(TOKEN_SECRET, "hex");
const IV_LENGTH = 16;

/**
 * 🔐 Chiffre un texte en AES-256-CBC
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/**
 * 🔓 Déchiffre un texte AES-256-CBC
 */
export function decrypt(text: string): string {
    const [ivHex, encryptedHex] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const encryptedText = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString("utf8");
}
