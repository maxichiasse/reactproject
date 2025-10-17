// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "@api/auth";
import type { User } from "types/User";

interface AuthContextProps {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    loading: true,
    logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // 🔹 Récupère l'utilisateur via le cookie JWT
    useEffect(() => {
        authAPI
            .me()
            .then((res) => setUser(res.data))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const logout = async () => {
        await authAPI.logout(); // supprime le cookie côté serveur
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
