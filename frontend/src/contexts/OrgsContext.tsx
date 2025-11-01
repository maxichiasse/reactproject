// frontend/src/contexts/OrgsContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { orgsAPI } from "@api/orgs";
import type { Organization } from "types/Organization";

interface OrgsContextType {
    orgs: Organization[];
    loading: boolean;
    error: string | null;
    refreshOrgs: () => Promise<void>;
}

const OrgsContext = createContext<OrgsContextType | undefined>(undefined);

export const OrgsProvider = ({ children }: { children: ReactNode }) => {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastFetched, setLastFetched] = useState<number | null>(null);

    const fetchOrgs = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await orgsAPI.getAllWithRepoCount();
            if (Array.isArray(res.data)) {
                setOrgs(res.data);
                setLastFetched(Date.now());
            } else {
                setError("Format inattendu du serveur");
            }
        } catch (err: any) {
            console.error("❌ Erreur chargement orgs:", err.message);
            setError("Impossible de récupérer les organisations");
        } finally {
            setLoading(false);
        }
    };

    // Charger une seule fois ou si les données ont plus de 10 minutes
    useEffect(() => {
        if (!lastFetched || Date.now() - lastFetched > 10 * 60 * 1000) {
            fetchOrgs();
        }
    }, []);

    return (
        <OrgsContext.Provider value={{ orgs, loading, error, refreshOrgs: fetchOrgs }}>
            {children}
        </OrgsContext.Provider>
    );
};

export const useOrgs = () => {
    const ctx = useContext(OrgsContext);
    if (!ctx) throw new Error("useOrgs doit être utilisé dans un OrgsProvider");
    return ctx;
};
