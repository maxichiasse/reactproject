// frontend/src/pages/MainPage/index.tsx
import styles from './MainPage.module.scss';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from "@hooks/useToast";
import { useEffect } from "react";
import { ENV } from "@config/env";
import { useAuth } from "@contexts/AuthContext";

const MainPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { showToast, ToastContainer } = useToast();
    const error = searchParams.get("error");
    const { user, loading } = useAuth(); // ✅ récupère l’utilisateur depuis le context global

    /** 🔁 Redirige vers la page d’autorisation GitHub */
    const redirectToGitHub = () => {
        const redirectUri = encodeURIComponent(`${ENV.FRONT_URL}/callback`);
        const url = `https://github.com/login/oauth/authorize` +
            `?client_id=${ENV.GITHUB_CLIENT_ID}` +
            `&scope=read:user%20read:org%20repo` +
            `&redirect_uri=${redirectUri}`;
        window.location.href = url;
    };

    /** 📂 Si l’utilisateur est connecté → /orgs, sinon → GitHub OAuth */
    const handleProjects = () => {
        if (loading) return; // 🕒 attend que AuthContext ait fini sa requête
        if (user) {
            showToast("✅ Connexion confirmée, redirection vers vos organisations...", "success");
            setTimeout(() => navigate("/orgs"), 1200);
        } else {
            showToast("⚠️ Vous devez vous connecter via GitHub.", "info");
            redirectToGitHub();
        }
    };

    useEffect(() => {
        if (error === "forbidden")
            showToast("❌ Vous n'êtes pas autorisé à accéder à ce site.", "error");
        else if (error === "unknown")
            showToast("⚠️ Une erreur inconnue est survenue.", "info");
        else if (error === "server")
            showToast("⚠️ Erreur serveur, réessayez plus tard.", "error");
    }, [error]);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Bienvenue sur GitHelper</h1>

            <div className={styles.buttons}>
                <button className={styles.btnLogin} onClick={redirectToGitHub}>
                    Se connecter
                </button>
                <button className={styles.btnProjects} onClick={handleProjects}>
                    Projets
                </button>
            </div>

            <ToastContainer />
        </div>
    );
};

export default MainPage;
