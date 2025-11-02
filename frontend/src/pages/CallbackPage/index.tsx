//frontend/src/pages/CallbackPage/index.tsx
import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from "@api/auth.ts";
import styles from './CallbackPage.module.scss';

const CallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const alreadyFetched = useRef(false);

    useEffect(() => {
        const code = searchParams.get("code");
        const state = searchParams.get("state") || "";

        if (!code || alreadyFetched.current) return;
        alreadyFetched.current = true;

        // 🧭 Cas étudiant: state="createGroup|<projectId>|<key>"
        if (state.startsWith("createGroup|")) {
            const [, projectId, key] = state.split("|");
            // On renvoie l’étudiant sur sa page CreateGroup avec le code OAuth
            navigate(`/CreateGroup/${projectId}/${key}?code=${encodeURIComponent(code)}`);
            return;
        }

        // 👨‍🏫 Cas prof (flux existant)
        authAPI
            .login(code)
            .then((res) => {
                if (res.status === 200 && res.data.success) {
                    window.location.href = "/orgs";
                } else if (res.status === 403) {
                    navigate("/?error=forbidden");
                } else {
                    navigate("/?error=unknown");
                }
            })
            .catch((err: any) => {
                const status = err.response?.status;

                if (status === 403) {
                    navigate("/?error=forbidden");
                } else if (status === 401) {
                    navigate("/?error=unauthorized");
                } else {
                    navigate("/?error=server");
                }
            });    }, [searchParams, navigate]);

    return (
        <div className={styles.message}>
            <div className={styles.spinner}></div>
            <p>Connexion à GitHub en cours...</p>
        </div>
    );
};

export default CallbackPage;
