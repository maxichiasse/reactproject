//frontend/src/pages/OrgsPage/index.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@api/auth";
import { orgsAPI } from "@api/orgs";
import type { User } from "types/User";
import type { Organization } from "types/Organization";
import styles from './OrgsPage.module.scss';

const handleLogout = async () => {
    await authAPI.logout();
    window.location.href = "/";
};

const HomePage = () => {
    const [user, setUser] = useState<User | null>(null);
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [projects, setProjects] = useState<Record<string, boolean>>({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: userData } = await authAPI.me();
                setUser(userData);
            } catch {
                console.error("Non authentifié");
            }

            try {
                const { data: orgList } = await orgsAPI.getAll();
                setOrgs(orgList);

                const checks: Record<string, boolean> = {};
                for (const org of orgList) {
                    try {
                        await orgsAPI.getProjectForOrg(org.name);
                        checks[org.name] = true;
                    } catch {
                        checks[org.name] = false;
                    }
                }
                setProjects(checks);
            } catch (err) {
                console.error("Erreur organizations:", err);
            }
        };
        fetchData();
    }, []);


    return (
        <div className={styles.container}>
            {/* Top bar */}
            <div className={styles.topBar}>
                <div className={styles.userInfo}>
                    <span className={styles.greeting}>
                        Bonjour {user?.name || user?.login} !
                    </span>
                    {user && (
                        <img className={styles.avatar} src={user.avatar_url} alt="avatar" />
                    )}
                </div>
                <button className={styles.logoutButton} onClick={handleLogout}>
                    Se déconnecter
                </button>
            </div>

            {/* Organisations */}
            <div className={styles.orgSection}>
                <h2 className={styles.orgTitle}>🏢 Vos organisations</h2>
                <ul className={styles.orgList}>
                    {orgs.length === 0 ? (
                        <li>Aucune organisation trouvée.</li>
                    ) : (
                        orgs.map((org) => (
                            <li
                                key={org.id}
                                className={styles.orgCard}
                                onClick={() => navigate(`/orgs/${org.name}`)}
                            >
                                <img className={styles.orgAvatar} src={org.avatar_url} alt={org.name} />

                                <div className={styles.orgInfo}>
                                    <span className={styles.orgName}>
                                        {org.name || org.login}
                                    </span>
                                    <span className={styles.repoCount}>
  {(!org.public_repos || org.public_repos === 0)
      ? "Aucun Repository"
      : org.public_repos === 1
          ? "1 Repository"
          : `${org.public_repos} Repositories`}
</span>
                                </div>

                                {/* ✅ Boutons selon le statut du projet */}
                                {!projects[org.name] ? (
                                    // Aucun projet → bouton +
                                    <>
                                        <button
                                            className={styles.addButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/orgs/${org.name}/project`);
                                            }}
                                        >
                                            +
                                        </button>
                                        <span className={styles.createLabel}>Créer un projet</span>
                                    </>
                                ) : (
                                    // Projet existant → vérifier si l'orga n’a aucun repo
                                    org.public_repos === 0 && (
                                        <>
                                            <button
                                                className={styles.editButton}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/orgs/${org.name}/project`);
                                                }}
                                            >
                                                ✎
                                            </button>
                                            <span className={styles.editLabel}>Modifier le projet</span>
                                        </>
                                    )
                                )}
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};

export default HomePage;