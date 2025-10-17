//backend/src/utils/validate.ts
import { z } from "zod";

export const projectSchema = z.object({
    minStudents: z.coerce.number().min(1),
    maxStudents: z.coerce.number().min(1),
    maxGroups: z.coerce.number().min(1),
});
