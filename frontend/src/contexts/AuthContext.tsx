import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "@api/auth";
import type { User } from "types/User";

interface AuthContextProps {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
    user: null,
    loading: true,
    logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("🔄 AuthContext mount...");
        const cached = sessionStorage.getItem("user");
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                console.log("🧠 Utilisateur trouvé en cache:", parsed.login);
                setUser(parsed);
            } catch {
                console.warn("⚠️ Cache user invalide, suppression.");
                sessionStorage.removeItem("user");
            }
        }

        // ✅ Toujours vérifier l'état réel côté serveur
        console.log("📡 Vérification utilisateur via /api/me...");
        authAPI
            .me()
            .then((res) => {
                console.log("✅ /api/me success:", res.data);
                if (res.data && res.data.login) {
                    setUser(res.data);
                    sessionStorage.setItem("user", JSON.stringify(res.data));
                } else {
                    setUser(null);
                    sessionStorage.removeItem("user");
                }
            })
            .catch((err) => {
                console.error("❌ /api/me error:", err);
                setUser(null);
                sessionStorage.removeItem("user");
            })
            .finally(() => {
                console.log("🏁 AuthContext loading = false");
                setLoading(false);
            });
    }, []);

    // ✅ Logout propre et total
    const logout = async () => {
        try {
            await authAPI.logout(); // supprime cookie JWT
        } catch {
            /* ignore */
        }

        console.log("🧹 Nettoyage complet de la session côté frontend...");
        sessionStorage.clear();
        localStorage.removeItem("orgData");

        // Reset immédiat du state
        setUser(null);

        // Re-rendu + redirection propre
        await new Promise((resolve) => setTimeout(resolve, 150));
        window.location.replace("/");
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
