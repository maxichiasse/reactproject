// frontend/src/contexts/OrgsContext.tsx
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

    /**
     * 🔁 Récupère les organisations depuis l’API
     */
    const fetchOrgs = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await orgsAPI.getAllWithRepoCount();
            const newOrgs: ExtendedOrganization[] = Array.isArray(res.data) ? res.data : [];

            // 🧠 Cache en sessionStorage pour accélérer les prochaines visites
            sessionStorage.setItem("orgData", JSON.stringify(newOrgs));
            sessionStorage.setItem("orgs_lastUpdate", Date.now().toString());
            setOrgs(newOrgs);

        } catch (err: any) {
            console.error("❌ Erreur chargement orgs:", err.message);
            setError("Impossible de récupérer les organisations");
        } finally {
            setLoading(false);
        }
    };

    /**
     * 🧹 Supprime le cache
     */
    const clearOrgs = () => {
        setOrgs([]);
        sessionStorage.removeItem("orgData");
        sessionStorage.removeItem("orgs_lastUpdate");
    };

    /**
     * 🎯 Effet principal — logique TTL + détection de refresh
     */
    useEffect(() => {
        console.log("👀 OrgsContext déclenché", { authLoading, user });

        if (authLoading) return;
        if (!user) {
            clearOrgs();
            return;
        }

        const cachedData = sessionStorage.getItem("orgData");
        const lastUpdate = Number(sessionStorage.getItem("orgs_lastUpdate") || 0);
        const ttl = 60 * 1000; // 1 minute de cache
        const isExpired = Date.now() - lastUpdate > ttl;

        // ⚡ 1️⃣ Si c’est un “hard reload” (F5 ou Ctrl+R), on refait fetchOrgs
        const navType = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        const isReload = navType?.type === "reload";

        if (isReload) {
            console.log("🔄 Reload détecté → fetchOrgs forcé");
            fetchOrgs();
            return;
        }

        // ⚡ 2️⃣ Si cache existant + pas expiré → on l’utilise
        if (cachedData && !isExpired) {
            console.log("📦 Utilisation du cache orgData");
            setOrgs(JSON.parse(cachedData));
            return;
        }

        // ⚡ 3️⃣ Sinon → requête API
        console.log("🌐 fetchOrgs (pas de cache valide)");
        fetchOrgs();
    }, [authLoading, user?.login]);

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
