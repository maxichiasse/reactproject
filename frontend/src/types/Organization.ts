//frontend/src/types/Organization.ts
export interface Organization {
    id: number;
    login?: string;
    name: string;
    avatar_url: string;
    public_repos?: number;
    repoCount?: number;
}
