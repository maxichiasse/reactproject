//frontend/src/pages/OrgReposPage/index.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { orgsAPI } from "@api/orgs";
import type { Project } from "types/Project";
import type { Repository } from "types/Repository";
import { ENV } from "@config/env";
import { Clipboard, Trash2 } from "lucide-react";
import { useToast } from "@contexts/ToastContext";
import ConfirmModal from "@components/ConfirmModal";
import { useOrgs } from "@contexts/OrgsContext";
import styles from "./OrgReposPage.module.scss";

const OrgReposPage = () => {
    const { orgName } = useParams<{ orgName: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // 🔹 Modale de confirmation
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

    const { showToast } = useToast();
    const { refreshOrgs } = useOrgs();
    const navigate = useNavigate();

    // ✅ base URL backend
    const apiBase = (ENV.API_URL ?? "").replace(/\/$/, "");

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

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // 🗑 Ouvre la modale
    const askDeleteRepo = (repoName: string) => {
        setSelectedRepo(repoName);
        setShowConfirm(true);
    };

    // 🧠 Confirmation réelle (appel backend)
    const confirmDelete = async () => {
        if (!selectedRepo || !orgName) {
            setShowConfirm(false);
            return;
        }

        try {
            const res = await fetch(`${apiBase}/api/groups/${encodeURIComponent(selectedRepo)}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orgName }),
                credentials: "include",
            });

            let data: any = null;
            const ct = res.headers.get("content-type") || "";
            if (ct.includes("application/json")) {
                try {
                    data = await res.json();
                } catch {
                    /* ignore */
                }
            } else {
                try {
                    data = { message: await res.text() };
                } catch {
                    /* ignore */
                }
            }

            if (res.ok) {
                // ✅ Message précis du backend
                showToast(data?.message || `🗑 ${selectedRepo} supprimé`, "success");

                // 🔄 Met à jour le contexte global et la liste locale
                await refreshOrgs();
                await fetchData();
            } else {
                showToast(`❌ ${data?.error ?? "Erreur lors de la suppression"}`, "error");
            }
        } catch (err) {
            console.error("Erreur suppression repo:", err);
            showToast("❌ Impossible de supprimer le repository", "error");
        } finally {
            setShowConfirm(false);
            setSelectedRepo(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirm(false);
        setSelectedRepo(null);
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

                    {/* ✅ Lien d’inscription + icône de copie */}
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
                <p style={{ color: "gray" }}>Aucun projet n’est associé à cette organisation.</p>
            )}

            <h2>📂 Repositories</h2>

            {repos.length === 0 ? (
                <p>Aucun repository trouvé.</p>
            ) : (
                <div className={styles.repoGrid}>
                    {repos.map((repo) => (
                        <div key={repo.id} className={styles.repoBox}>
                            <div className={styles.repoHeader}>
                                <a
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.repoLink}
                                >
                                    <h3>{repo.name}</h3>
                                </a>

                                {/* 🗑 Bouton Supprimer */}
                                <button
                                    className={styles.deleteButton}
                                    onClick={() => askDeleteRepo(repo.name)}
                                    title="Supprimer le repository"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

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

            {/* 🌟 Modale de confirmation */}
            <ConfirmModal
                open={showConfirm}
                title="Supprimer le repository"
                message={`Voulez-vous vraiment supprimer « ${selectedRepo ?? ""} » ? Cette action est irréversible.`}
                confirmText="Supprimer"
                cancelText="Annuler"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
};

export default OrgReposPage;
