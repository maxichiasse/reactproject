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
    // selectedRepo === "__PROJECT__" => suppression du projet
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

    // 🗑 Ouvre la modale (repo)
    const askDeleteRepo = (repoName: string) => {
        setSelectedRepo(repoName);
        setShowConfirm(true);
    };

    // 🗑 Ouvre la modale (projet)
    const askDeleteProject = () => {
        setSelectedRepo("__PROJECT__");
        setShowConfirm(true);
    };

    // utilitaire parse safe
    const safeParse = async (res: Response) => {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
            try { return await res.json(); } catch { return null; }
        }
        try { return { message: await res.text() }; } catch { return null; }
    };

    // 🧠 Confirmation réelle
    const confirmDelete = async () => {
        if (!selectedRepo || !orgName) {
            setShowConfirm(false);
            return;
        }

        try {
            let res: Response;

            if (selectedRepo === "__PROJECT__") {
                // ❌ SUPPRESSION PROJET
                res = await fetch(`${apiBase}/api/projects/${encodeURIComponent(orgName)}`, {
                    method: "DELETE",
                    credentials: "include",
                });
            } else {
                // ❌ SUPPRESSION REPO
                res = await fetch(`${apiBase}/api/groups/${encodeURIComponent(selectedRepo)}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orgName }),
                    credentials: "include",
                });
            }

            const data: any = await safeParse(res);

            if (res.ok) {
                showToast(data?.message || "Supprimé avec succès", "success");
                // 🔄 Rafraîchir orgs + détails pour garder l’UI cohérente
                await refreshOrgs();
                await fetchData();

                if (selectedRepo === "__PROJECT__") {
                    // retour à la liste si le projet n’existe plus
                    navigate("/orgs");
                }
            } else if (res.status === 409) {
                // Projet contenant encore des groupes
                showToast(data?.error ?? "Ce projet contient encore des groupes.", "warning");
            } else {
                showToast(`❌ ${data?.error ?? "Erreur lors de la suppression"}`, "error");
            }
        } catch (err) {
            console.error("Erreur suppression:", err);
            showToast("❌ Impossible de supprimer", "error");
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
                    <p><b>Clé secrète :</b> {project.secretKey}</p>

                    {(() => {
                        const joinUrl =
                            project.joinUrl ||
                            `${ENV.FRONT_URL}/CreateGroup/${project.id}/${project.secretKey}`;
                        return (
                            <p className={styles.copyLine}>
                                <b>Lien :</b>{" "}
                                <a href={joinUrl} target="_blank" rel="noreferrer" className={styles.linkText}>
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

                    <p><b>Étudiants :</b> {project.minStudents} - {project.maxStudents}</p>
                    <p><b>Groupes max :</b> {project.maxGroups}</p>

                    {/* 🗑 Supprimer le projet */}
                    <button className={styles.deleteProjectButton} onClick={askDeleteProject}>
                        Supprimer le projet
                    </button>
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
                                <a href={repo.html_url} target="_blank" rel="noreferrer" className={styles.repoLink}>
                                    <h3>{repo.name}</h3>
                                </a>

                                <button
                                    className={styles.deleteButton}
                                    onClick={() => askDeleteRepo(repo.name)}
                                    title="Supprimer le repository"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <p>{repo.description || "Pas de description"}</p>

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

            {/* 🌟 Modale – message/titre dynamiques */}
            <ConfirmModal
                open={showConfirm}
                title={selectedRepo === "__PROJECT__" ? "Supprimer le projet" : "Supprimer le repository"}
                message={
                    selectedRepo === "__PROJECT__"
                        ? "Voulez-vous vraiment supprimer ce projet ? Cette action est irréversible."
                        : `Voulez-vous vraiment supprimer « ${selectedRepo ?? ""} » ? Cette action est irréversible.`
                }
                confirmText="Supprimer"
                cancelText="Annuler"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
};

export default OrgReposPage;
