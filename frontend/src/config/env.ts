// frontend/src/config/env.ts
export const ENV = {
    MODE: import.meta.env.MODE, // "development" ou "production"
    API_URL: import.meta.env.VITE_API_URL,
    GITHUB_CLIENT_ID: import.meta.env.VITE_GITHUB_CLIENT_ID,
    FRONT_URL:
        import.meta.env.MODE === "production"
            ? "https://githelper.up.railway.app"
            : "http://localhost:5173",
};
