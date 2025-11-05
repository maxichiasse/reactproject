import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { orgsAPI } from "@api/orgs";
import { useToast } from "@contexts/ToastContext";
import { useAuth } from "@contexts/AuthContext";
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();
    const { user, loading: authLoading } = useAuth();

    const fetchOrgs = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await orgsAPI.getAllWithRepoCount();
            const newOrgs: ExtendedOrganization[] = Array.isArray(res.data) ? res.data : [];

            const prevOrgs: ExtendedOrganization[] = JSON.parse(sessionStorage.getItem("orgData") || "[]");
            sessionStorage.setItem("orgData", JSON.stringify(newOrgs));
            setOrgs(newOrgs);

            // Optionnel : notifications diff (comme ton compareOrgs)
        } catch (err: any) {
            console.error("❌ Erreur chargement orgs:", err.message);
            setError("Impossible de récupérer les organisations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("👀 useEffect OrgsContext déclenché", { authLoading, user });
        if (authLoading) return;
        if (user) {
            console.log("➡️ Fetch des organisations...");
            fetchOrgs();
        } else {
            console.log("🧹 Pas de user -> clearOrgs()");
            setOrgs([]);
        }
    }, [user, authLoading]);


    const clearOrgs = () => {
        setOrgs([]);
        sessionStorage.removeItem("orgData");
    };

    return (
        <OrgsContext.Provider value={{ orgs, loading, error, refreshOrgs: fetchOrgs, clearOrgs }}>
            {children}
        </OrgsContext.Provider>
    );
};

export const useOrgs = () => {
    const ctx = useContext(OrgsContext);
    if (!ctx) throw new Error("useOrgs doit être utilisé dans un OrgsProvider");
    return ctx;
};
