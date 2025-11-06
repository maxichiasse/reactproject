//frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
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
    const didInit = useRef(false); // ✅ évite les doubles appels en dev strict mode

    useEffect(() => {
        if (didInit.current) return;
        didInit.current = true;

        console.log("🔄 AuthContext mount...");

        const cached = sessionStorage.getItem("user");
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                console.log("🧠 Utilisateur trouvé en cache:", parsed.login);
                setUser(parsed);
            } catch {
                console.warn("⚠️ Cache utilisateur corrompu, suppression.");
                sessionStorage.removeItem("user");
            }
        }

        console.log("📡 Vérification utilisateur via /api/me...");
        authAPI
            .me()
            .then((res) => {
                if (res.data && res.data.login) {
                    console.log("✅ /api/me success:", res.data.login);
                    setUser(res.data);
                    sessionStorage.setItem("user", JSON.stringify(res.data));
                } else {
                    console.log("🚫 Aucun utilisateur connecté.");
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

    // ✅ Logout complet et immédiat
    const logout = async () => {
        try {
            await authAPI.logout();
        } catch {
            /* ignore */
        }

        console.log("🧹 Nettoyage complet de la session côté frontend...");
        sessionStorage.clear();
        localStorage.removeItem("orgData");

        setUser(null);

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
