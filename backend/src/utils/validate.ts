//backend/src/unit/validate.ts
import { z } from "zod";

/**
 * 🔹 Schéma pour la création d’un projet
 */
export const projectSchema = z.object({
    name: z.string().min(1, "Le nom du projet est requis"),
    minStudents: z.coerce.number().min(1),
    maxStudents: z.coerce.number().min(1),
    maxGroups: z.coerce.number().min(1),

});

/**
 * 🔹 Schéma pour la création d’un groupe
 */
export const createGroupSchema = z.object({
    secretKey: z
        .string()
        .min(1, "Clé secrète manquante ou invalide"),
    students: z
        .array(
            z.object({
                id: z.number().int(),
                login: z.string().min(1),
                avatar_url: z.string().url().optional(),
            })
        )
        .min(1, "Au moins un étudiant doit être présent"),
});

/**
 * 🔹 Schéma pour l’auth GitHub étudiant
 */
export const githubAuthStudentSchema = z.object({
    code: z.string().min(5, "Code OAuth invalide"),
    projectId: z
        .string()
        .regex(/^\d+$/, "projectId invalide"),
});
