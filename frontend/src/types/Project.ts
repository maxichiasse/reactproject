//frontend/src/types/Project.ts
export interface Project {
    id: number;
    orgName: string;
    secretKey: string;
    joinUrl: string;
    minStudents: number;
    maxStudents: number;
    maxGroups: number;
}
