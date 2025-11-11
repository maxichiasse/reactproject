//frontend/src/types/Repository.ts
export interface Repository {
    id: number;
    name: string;
    html_url: string;
    description?: string;
    members?: {
        login: string;
        avatar_url: string;
        html_url: string;
    }[];
}
