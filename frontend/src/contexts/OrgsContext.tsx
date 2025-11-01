// frontend/src/contexts/OrgsContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import { orgsAPI } from "@api/orgs";
import { useToast } from "@contexts/ToastContext";
import type { Organization } from "types/Organization";
import type { Repository } from "types/Repository";

interface ExtendedOrganization extends Organization {
    repos?: Repository[];
}

interface OrgsContextType {
    orgs: ExtendedOrganization[];
    loading: boolean;
    error: string | null;
    refreshOrgs: () => Promise<void>;
    clearOrgs: () => void;
}

const OrgsContext = createContext<OrgsContextType | undefined>(undefined);

export const OrgsProvider = ({ children }: { children: ReactNode }) => {
    const [orgs, setOrgs] = useState<ExtendedOrganization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    /**
     * 🧩 Compare deux listes d’organisations + repos
     */
    const compareOrgs = (prev: ExtendedOrganization[], next: ExtendedOrganization[]) => {
        const addedOrgs: string[] = [];
        const removedOrgs: string[] = [];
        const addedRepos: string[] = [];
        const removedRepos: string[] = [];

        const prevNames = prev.map((o) => o.name);
        const newNames = next.map((o) => o.name);

        // Orgs ajoutées / supprimées
        for (const name of newNames)
            if (!prevNames.includes(name)) addedOrgs.push(name);
        for (const name of prevNames)
            if (!newNames.includes(name)) removedOrgs.push(name);

        // Repos ajoutés/supprimés
        const commonOrgs = next.filter((o) => prevNames.includes(o.name));
        for (const org of commonOrgs) {
            const prevOrg = prev.find((o) => o.name === org.name);
            const prevRepos = prevOrg?.repos?.map((r) => r.name) ?? [];
            const newRepos = org.repos?.map((r) => r.name) ?? [];

            for (const repo of newRepos)
                if (!prevRepos.includes(repo)) addedRepos.push(`${org.name}/${repo}`);
            for (const repo of prevRepos)
                if (!newRepos.includes(repo)) removedRepos.push(`${org.name}/${repo}`);
        }

        return { addedOrgs, removedOrgs, addedRepos, removedRepos };
    };

    /**
     * 🔁 Fetch principal
     */
    const fetchOrgs = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await orgsAPI.getAllWithRepoCount();
            const newOrgs: ExtendedOrganization[] = Array.isArray(res.data)
                ? res.data
                : [];

            const storedPrev = sessionStorage.getItem("orgData");
            const prevOrgs: ExtendedOrganization[] = storedPrev
                ? JSON.parse(storedPrev)
                : [];

            // 🧠 Si un cache existe déjà, comparer immédiatement
            if (prevOrgs.length > 0) {
                const { addedOrgs, removedOrgs, addedRepos, removedRepos } = compareOrgs(
                    prevOrgs,
                    newOrgs
                );

                if (addedOrgs.length > 0)
                    showToast(
                        `✨ Organisation${addedOrgs.length > 1 ? "s" : ""} ajoutée${addedOrgs.length > 1 ? "s" : ""} : ${addedOrgs.join(
                            ", "
                        )}`,
                        "success"
                    );

                if (removedOrgs.length > 0)
                    showToast(
                        `❌ Organisation${removedOrgs.length > 1 ? "s" : ""} supprimée${removedOrgs.length > 1 ? "s" : ""} : ${removedOrgs.join(
                            ", "
                        )}`,
                        "error"
                    );

                if (addedRepos.length > 0)
                    showToast(
                        `📦 Nouveau repo${addedRepos.length > 1 ? "s" : ""} : ${addedRepos.join(
                            ", "
                        )}`,
                        "info"
                    );

                if (removedRepos.length > 0)
                    showToast(
                        `🗑️ Repo supprimé${removedRepos.length > 1 ? "s" : ""} : ${removedRepos.join(
                            ", "
                        )}`,
                        "error"
                    );
            }

            // ✅ Mise à jour de la mémoire + cache navigateur
            sessionStorage.setItem("orgData", JSON.stringify(newOrgs));
            setOrgs(newOrgs);
        } catch (err: any) {
            console.error("❌ Erreur chargement orgs:", err.message);
            setError("Impossible de récupérer les organisations");
        } finally {
            setLoading(false);
        }
    };

    /**
     * 🧩 Chargement initial : lit le cache puis fetch
     */
    useEffect(() => {
        const stored = sessionStorage.getItem("orgData");
        if (stored) setOrgs(JSON.parse(stored));
        fetchOrgs();
    }, []);

    /**
     * 🚪 Logout : nettoyage complet
     */
    const clearOrgs = () => {
        setOrgs([]);
        sessionStorage.removeItem("orgData");
    };

    return (
        <OrgsContext.Provider
            value={{ orgs, loading, error, refreshOrgs: fetchOrgs, clearOrgs }}
        >
            {children}
        </OrgsContext.Provider>
    );
};

export const useOrgs = () => {
    const ctx = useContext(OrgsContext);
    if (!ctx) throw new Error("useOrgs doit être utilisé dans un OrgsProvider");
    return ctx;
};
