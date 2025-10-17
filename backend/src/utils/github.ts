//backend/src/utils/github.ts
export async function githubFetch(url: string, token: string) {
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
        },
    });
    if (!res.ok) throw new Error(`Erreur GitHub API: ${res.status}`);
    return await res.json();
}