//frontend/src/pages/OrgReposPage/index.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { orgsAPI } from "@api/orgs";
import type { Project } from "types/Project";
import type { Repository } from "types/Repository";
import { ENV } from "@config/env";
import { Clipboard } from "lucide-react";
import { useToast } from "@contexts/ToastContext";
import styles from "./OrgReposPage.module.scss";

const OrgReposPage = () => {
    const { orgName } = useParams<{ orgName: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await orgsAPI.getDetails(orgName!);
                setProject(data.project);
                setRepos(data.repositories);
            } catch (err) {
                console.error("❌ Erreur lors du chargement des détails:", err);
                setProject(null);
                setRepos([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [orgName]);

    const handleCopy = (text: string) => {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                setCopied(true);
                showToast("📋 Lien copié !", "success");
                setTimeout(() => setCopied(false), 1500);
            })
            .catch(() => {
                showToast("❌ Erreur lors de la copie du lien", "error");
            });
    };

    if (loading) return <p>Chargement...</p>;

    return (
        <div className={styles.pageWrapper}>
            {/* 🔙 Bouton retour */}
            <button className={styles.backButton} onClick={() => navigate("/orgs")}>
                ⬅ Retour
            </button>

            <h1>Organisation : {orgName}</h1>

            {project ? (
                <div className={styles.projectCard}>
                    <h2>📑 Projet</h2>
                    <p>
                        <b>Clé secrète :</b> {project.secretKey}
                    </p>

                    {/* ✅ Lien d’inscription affiché proprement avec icône de copie */}
                    {(() => {
                        const joinUrl =
                            project.joinUrl ||
                            `${ENV.FRONT_URL}/CreateGroup/${project.id}/${project.secretKey}`;

                        return (
                            <p className={styles.copyLine}>
                                <b>Lien :</b>{" "}
                                <a
                                    href={joinUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.linkText}
                                >
                                    {joinUrl}
                                </a>
                                <Clipboard
                                    className={`${styles.copyIcon} ${copied ? styles.copied : ""}`}
                                    size={18}
                                    onClick={() => handleCopy(joinUrl)}
                                    title="Copier le lien"
                                />
                            </p>
                        );
                    })()}

                    <p>
                        <b>Étudiants :</b> {project.minStudents} - {project.maxStudents}
                    </p>
                    <p>
                        <b>Groupes max :</b> {project.maxGroups}
                    </p>
                </div>
            ) : (
                <p style={{ color: "gray" }}>
                    Aucun projet n’est associé à cette organisation.
                </p>
            )}

            <h2>📂 Repositories</h2>

            {repos.length === 0 ? (
                <p>Aucun repository trouvé.</p>
            ) : (
                <div className={styles.repoGrid}>
                    {repos.map((repo) => (
                        <div key={repo.id} className={styles.repoBox}>
                            <a href={repo.html_url} target="_blank" rel="noreferrer">
                                <h3>{repo.name}</h3>
                            </a>
                            <p>{repo.description || "Pas de description"}</p>

                            {/* 👥 Membres */}
                            {repo.members && repo.members.length > 0 && (
                                <div className={styles.membersSection}>
                                    <span className={styles.membersLabel}>👥 Membres :</span>
                                    <div className={styles.membersList}>
                                        {repo.members.map((m) => (
                                            <a
                                                key={m.login}
                                                href={m.html_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={styles.member}
                                                title={m.login}
                                            >
                                                <img src={m.avatar_url} alt={m.login} />
                                                <span>{m.login}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrgReposPage;
