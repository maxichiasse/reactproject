//backend/src/utils/github.ts
export async function githubFetch(path: string, token: string) {
    const base = "https://api.github.com";
    const url = path.startsWith("http") ? path : `${base}${path}`;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur GitHub API (${res.status}): ${text}`);
    }

    return await res.json();
}
