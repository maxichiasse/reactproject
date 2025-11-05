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
            console.log("🧠 Utilisateur trouvé en cache:", JSON.parse(cached).login);
            setUser(JSON.parse(cached));
            setLoading(false);
            return;
        }

        const hasToken = document.cookie.includes("token=");
        console.log("🍪 Token présent:", hasToken);

        if (!hasToken) {
            console.log("🚫 Aucun token -> utilisateur non connecté");
            setLoading(false);
            return;
        }

        console.log("📡 Vérification utilisateur via /api/me...");
        authAPI
            .me()
            .then((res) => {
                console.log("✅ Auth OK:", res.data.login);
                setUser(res.data);
                sessionStorage.setItem("user", JSON.stringify(res.data));
            })
            .catch(() => {
                console.error("❌ Erreur /api/me");
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);


    const logout = async () => {
        await authAPI.logout(); // supprime le cookie côté serveur
        sessionStorage.removeItem("orgData");
        sessionStorage.removeItem("user");
        setUser(null);
        window.location.href = "/";
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
