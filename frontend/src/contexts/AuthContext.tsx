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
            const parsed = JSON.parse(cached);
            console.log("🧠 Utilisateur trouvé en cache:", parsed.login);
            setUser(parsed);
            setLoading(false);
            return;
        }



        console.log("📡 Vérification utilisateur via /api/me...");
        authAPI
            .me()
            .then((res) => {
                console.log("✅ /api/me success:", res.data);
                setUser(res.data);
                sessionStorage.setItem("user", JSON.stringify(res.data));
            })
            .catch((err) => {
                console.error("❌ /api/me error:", err);
                setUser(null);
            })
            .finally(() => {
                console.log("🏁 AuthContext loading = false");
                setLoading(false);
            });
    }, []);


    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (e) {
            console.warn("⚠️ Erreur logout API:", e);
        }

        // 🧹 Nettoyer toute la session avant le reload
        sessionStorage.clear(); // ✅ vide TOUTES les clés de la session
        setUser(null);

        console.log("✅ Session nettoyée, redirection...");
        setTimeout(() => {
            window.location.href = "/";
        }, 100);
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
