//frontend/src/types/api.ts
export interface CreateProjectPayload {
    name: string,
    minStudents: number;
    maxStudents: number;
    maxGroups: number;
}

export interface CreateGroupPayload {
    secretKey: string;
    students: Array<{ id: number; login: string; avatar_url: string }>;
}
