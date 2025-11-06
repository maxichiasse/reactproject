//frontend/src/contexts/OrgsContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
    useRef
} from "react";
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

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const cacheKeyFor = (userId: number) => `orgData:${userId}`;

export const OrgsProvider = ({ children }: { children: ReactNode }) => {
    const [orgs, setOrgs] = useState<ExtendedOrganization[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const hydratedRef = useRef(false);

    // 🧩 Charge les organisations depuis le serveur
    const fetchOrgs = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await orgsAPI.getAllWithRepoCount();
            const newOrgs: ExtendedOrganization[] = Array.isArray(res.data) ? res.data : [];

            if (user?.id) {
                sessionStorage.setItem(
                    cacheKeyFor(user.id),
                    JSON.stringify({ ts: Date.now(), data: newOrgs })
                );
            }
            setOrgs(newOrgs);
            showToast("✅ Organisations mises à jour", "success");
        } catch (err: any) {
            console.error("❌ Erreur chargement orgs:", err.message);
            setError("Impossible de récupérer les organisations");
        } finally {
            setLoading(false);
        }
    };

    // 🧠 Hydrate depuis le cache si disponible et récent
    const hydrateFromCacheIfPossible = (): boolean => {
        if (!user?.id) return false;
        const raw = sessionStorage.getItem(cacheKeyFor(user.id));
        if (!raw) return false;

        try {
            const parsed = JSON.parse(raw) as { ts: number; data: ExtendedOrganization[] };
            const fresh = Date.now() - parsed.ts < CACHE_TTL_MS;
            setOrgs(parsed.data || []);
            hydratedRef.current = true;
            console.log(fresh ? "💾 Orgs chargées depuis cache (frais)" : "🕓 Cache expiré");
            return fresh;
        } catch {
            console.warn("⚠️ Cache orgs invalide, suppression.");
            sessionStorage.removeItem(cacheKeyFor(user.id));
            return false;
        }
    };

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            console.log("🧹 Aucun utilisateur -> clearOrgs()");
            hydratedRef.current = false;
            setOrgs([]);
            return;
        }

        // 1️⃣ Essaye d’hydrater le cache
        const fresh = hydrateFromCacheIfPossible();

        // 2️⃣ Si pas frais → fetch depuis le serveur
        if (!fresh) {
            console.log("🌐 Cache manquant ou expiré → fetchOrgs()");
            fetchOrgs();
        }
    }, [authLoading, user?.id]); // 👈 déclenche uniquement quand l’utilisateur change

    // 🧹 Nettoyer les orgs
    const clearOrgs = () => {
        setOrgs([]);
        hydratedRef.current = false;
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
