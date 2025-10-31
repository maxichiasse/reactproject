// frontend/src/context/OrgsContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import axios from "axios";

interface Org {
    id?: number;
    name: string;
    avatar_url: string;
    public_repos: number;
}

interface OrgsContextType {
    orgs: Org[];
    loading: boolean;
    error: string | null;
    refreshOrgs: () => Promise<void>;
}

const OrgsContext = createContext<OrgsContextType | undefined>(undefined);

export const OrgsProvider = ({ children }: { children: ReactNode }) => {
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrgs = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.get("/api/organizations", { withCredentials: true });
            console.log("📦 Résultat /api/organizations:", res.data);

            if (Array.isArray(res.data)) {
                setOrgs(res.data);
            } else {
                console.error("⚠️ Réponse inattendue du backend:", res.data);
                setOrgs([]); // évite crash
                setError("Format inattendu reçu du serveur");
            }
        } catch (err: any) {
            console.error("❌ Erreur chargement organisations:", err.message);
            setError("Impossible de récupérer les organisations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orgs.length === 0) {
            fetchOrgs();
        }
    }, []);

    return (
        <OrgsContext.Provider value={{ orgs, loading, error, refreshOrgs: fetchOrgs }}>
            {children}
        </OrgsContext.Provider>
    );
};

export const useOrgsContext = () => {
    const ctx = useContext(OrgsContext);
    if (!ctx) throw new Error("useOrgsContext doit être utilisé dans un OrgsProvider");
    return ctx;
};
