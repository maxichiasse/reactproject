// frontend/src/pages/MainPage/index.tsx
import styles from './MainPage.module.scss';
import { useSearchParams } from 'react-router-dom';
import { useToast } from "@contexts/ToastContext";
import { useEffect } from "react";
import { ENV } from "@config/env";
import { useAuth } from "@contexts/AuthContext";

const MainPage = () => {
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();
    const { user, loading } = useAuth();
    const error = searchParams.get("error");

    const redirectToGitHub = () => {
        const redirectUri = encodeURIComponent(`${ENV.FRONT_URL}/callback`);
        const url =
            `https://github.com/login/oauth/authorize` +
            `?client_id=${ENV.GITHUB_CLIENT_ID}` +
            `&scope=read:user%20read:org%20repo` +
            `&redirect_uri=${redirectUri}`;
        window.location.href = url;
    };

    useEffect(() => {
        if (error === "forbidden") showToast("❌ Vous n'êtes pas autorisé à accéder à ce site.", "error");
        else if (error === "unknown") showToast("⚠️ Une erreur inconnue est survenue.", "info");
        else if (error === "server") showToast("⚠️ Erreur serveur, réessayez plus tard.", "error");
    }, [error]);

    return (
        <div className={styles.container}>
            <div className={styles.blobA} />
            <div className={styles.blobB} />

            <section className={styles.hero}>
                <h1 className={styles.title}>
                    Gérez vos projets étudiants <span className={styles.gradient}>en 2 clics</span>
                </h1>

                <button className={styles.btnGithub} onClick={redirectToGitHub}>
                    <svg aria-hidden="true" viewBox="0 0 16 16" className={styles.ghIcon}>
                        <path
                            fill="currentColor"
                            d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38
              0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01
              1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95
              0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.1 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27
              1.53-1.04 2.2-.82 2.2-.82.44 1.09.16 1.9.08 2.1.51.56.82 1.27.82 2.15
              0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z"
                        />
                    </svg>
                    Se connecter avec GitHub
                </button>

                {!loading ? (
                    user ? (
                        <p className={styles.hint}>
                            Déjà connecté en tant que <b>@{user.login}</b>.{" "}
                            <a href="/orgs">Voir mes organisations →</a>
                        </p>
                    ) : (
                        <p className={styles.hint}>Accès réservé aux enseignants.</p>
                    )
                ) : (
                    <p className={styles.hint}>Chargement...</p>
                )}
            </section>
        </div>
    );
};

export default MainPage;
