// frontend/src/pages/OrgsPage/index.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@api/auth";
import type { User } from "types/User";
import styles from "./OrgsPage.module.scss";
import { useOrgs } from "@contexts/OrgsContext";

const handleLogout = async () => {
    await authAPI.logout();
    window.location.href = "/";
};

const OrgsPage = () => {
    const { orgs, loading } = useOrgs();
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        authAPI
            .me()
            .then((res) => setUser(res.data))
            .catch(() => setUser(null));
    }, []);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <p className={styles.loadingText}>Chargement de vos organisations...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* 🔝 Barre supérieure */}
            <div className={styles.topBar}>
                <div className={styles.userInfo}>
                    <span className={styles.greeting}>
                        Bonjour {user?.name || user?.login} !
                    </span>
                    {user && (
                        <img
                            className={styles.avatar}
                            src={user.avatar_url}
                            alt="avatar"
                        />
                    )}
                </div>

                <button className={styles.logoutButton} onClick={handleLogout}>
                    Se déconnecter
                </button>
            </div>

            {/* 🏢 Liste des organisations */}
            <div className={styles.orgSection}>
                <h2 className={styles.orgTitle}>🏢 Vos organisations</h2>

                <ul className={styles.orgList}>
                    {orgs.length === 0 ? (
                        <li className={styles.emptyMsg}>Aucune organisation trouvée.</li>
                    ) : (
                        orgs.map((org) => (
                            <li
                                key={org.id}
                                className={styles.orgCard}
                                onClick={() => navigate(`/orgs/${org.name}`)}
                            >
                                <img
                                    className={styles.orgAvatar}
                                    src={org.avatar_url}
                                    alt={org.name}
                                />

                                <div className={styles.orgInfo}>
                                    <span className={styles.orgName}>
                                        {org.name || org.login}
                                    </span>
                                    <span className={styles.repoCount}>
                                        {org.repoCount === 0
                                            ? "Aucun repository"
                                            : org.repoCount === 1
                                                ? "1 repository"
                                                : `${org.repoCount} repositories`}
                                    </span>
                                </div>

                                {/* Bouton création projet */}
                                <div className={styles.actionWrapper}>
                                    <button
                                        className={styles.addButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/orgs/${org.name}/project`);
                                        }}
                                    >
                                        +
                                    </button>
                                    <span className={styles.createLabel}>
                                        Créer un projet
                                    </span>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};

export default OrgsPage;
