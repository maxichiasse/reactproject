// src/pages/CreateGroupPage/index.tsx
import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@contexts/ToastContext";
import { projectsAPI } from "@api/projects";
import { ENV } from "@config/env";
import { useDebounce } from "@hooks/useDebounce";
import { X } from "lucide-react";
import styles from "./CreateGroup.module.scss";

interface Student {
    id: number;
    login: string;
    avatar_url: string;
}

interface Project {
    id: number;
    name: string;
    minStudents: number;
    maxStudents: number;
}

const CreateGroupPage = () => {
    const { projectId, key } = useParams<{ projectId: string; key: string }>();
    const [searchParams] = useSearchParams();
    const [project, setProject] = useState<Project | null>(null);
    const [students, setStudents] = useState<Array<Student | null>>([]);
    const [loading, setLoading] = useState(true);
    const [validLink, setValidLink] = useState<boolean | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Student[]>([]);
    const [activeInput, setActiveInput] = useState<number | null>(null);
    const [creating, setCreating] = useState(false);
    const alreadyFetched = useRef(false);
    const { showToast } = useToast();

    const debouncedSearch = useDebounce(searchQuery, 800);
    const code = searchParams.get("code");

    // 🧩 Vérifie la validité du lien + charge le projet
    useEffect(() => {
        projectsAPI
            .getBySecret(projectId!, key!)
            .then((res) => {
                setProject(res.data);
                setStudents([]);
                setValidLink(true);
            })
            .catch(() => {
                showToast("❌ Lien invalide ou expiré.", "error");
                setValidLink(false);
            })
            .finally(() => setLoading(false));
    }, [projectId, key]);

    // 👤 Charger l’étudiant connecté (après OAuth GitHub)
    useEffect(() => {
        if (code && projectId && validLink && !alreadyFetched.current) {
            alreadyFetched.current = true;
            projectsAPI
                .getStudentByCode(projectId, code)
                .then((res) => {
                    const user = res.data;
                    setStudents([user, null]);
                })
                .catch(() =>
                    showToast("⚠️ Erreur lors de la récupération du profil GitHub.", "error")
                );
        }
    }, [code, projectId, validLink]);

    // 🔍 Recherche d’un utilisateur GitHub
    useEffect(() => {
        const query = debouncedSearch.trim().replace("@", "");
        if (query.length < 2 || !projectId) {
            setSearchResults([]);
            return;
        }

        projectsAPI
            .searchGithubUsers(projectId, query)
            .then((res) => setSearchResults(res.data))
            .catch(() => setSearchResults([]));
    }, [debouncedSearch, projectId]);

    // ✅ Sélection d’un utilisateur
    const handleSelectUser = (index: number, user: Student) => {
        setStudents((prev) => {
            const updated = [...prev];
            updated[index] = user;

            // Ajoute un champ vide si le dernier est rempli
            if (
                updated[updated.length - 1] !== null &&
                project &&
                updated.length < project.maxStudents
            ) {
                updated.push(null);
            }
            return updated;
        });

        setSearchResults([]);
        setSearchQuery("");
        setActiveInput(null);
    };

    // ❌ Supprimer un utilisateur (sauf le premier)
    const handleRemoveUser = (index: number) => {
        setStudents((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            if (
                updated[updated.length - 1] !== null &&
                project &&
                updated.length < project.maxStudents
            ) {
                updated.push(null);
            }
            return updated;
        });
    };

    // 🔐 OAuth GitHub
    const handleAuthorize = () => {
        const redirectUri = encodeURIComponent(`${ENV.FRONT_URL}/callback`);
        const state = encodeURIComponent(`createGroup|${projectId}|${key}`);
        window.location.href =
            `https://github.com/login/oauth/authorize` +
            `?client_id=${ENV.GITHUB_CLIENT_ID}` +
            `&scope=read:user` +
            `&redirect_uri=${redirectUri}` +
            `&state=${state}`;
    };

    // 🚀 Créer le groupe
    const handleCreateGroup = async () => {
        if (!project) return;
        const selected = students.filter((s) => s !== null) as Student[];
        if (selected.length < project.minStudents) {
            showToast(
                `⚠️ Il faut au moins ${project.minStudents} étudiants pour créer un groupe.`,
                "info"
            );
            return;
        }

        try {
            setCreating(true);
            const res = await projectsAPI.createGroup(projectId!, {
                secretKey: key!,
                students: selected,
            });
            showToast(`✅ Groupe créé avec succès : ${res.data.groupName}`, "success");
            const repoUrl = res.data.repoUrl || res.data.html_url || null;
            if (repoUrl) window.location.href = repoUrl;
        } catch (err: any) {
            showToast(
                `❌ Erreur lors de la création du groupe : ${
                    err.response?.data?.error || err.message
                }`,
                "error"
            );
        } finally {
            setCreating(false);
        }
    };

    // 🌀 Affichage en fonction de l’état
    if (loading) return <p className={styles.loading}>Chargement...</p>;

    if (validLink === false) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.container}>
                    <h1>❌ Lien invalide ou expiré</h1>
                    <p className={styles.errorText}>
                        Ce lien n’est plus valide ou a été mal copié.
                        <br />
                        Veuillez vérifier le lien fourni par votre professeur.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <h1>Créer / Rejoindre un groupe</h1>

                {project && (
                    <>
                        <p>
                            Projet : <b>{project.name}</b>
                        </p>
                        <p>
                            Étudiants : {project.minStudents} à {project.maxStudents}
                        </p>
                    </>
                )}

                {!students[0] ? (
                    <button
                        className={styles.authButton}
                        onClick={handleAuthorize}
                        disabled={!validLink}
                    >
                        Autoriser GitHub
                    </button>
                ) : (
                    <div className={styles.form}>
                        {students.map((s: Student | null, i: number) => (
                            <div key={i} className={styles.labelRow}>
                                {s ? (
                                    <div className={styles.userBox}>
                                        <img src={s.avatar_url} alt="avatar" />
                                        <span>@{s.login}</span>
                                        {i > 0 && (
                                            <button
                                                className={styles.removeBtn}
                                                onClick={() => handleRemoveUser(i)}
                                                title="Retirer cet étudiant"
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className={styles.searchContainer}>
                                        <input
                                            type="text"
                                            placeholder={`@Étudiant ${i + 1}`}
                                            value={
                                                activeInput === i
                                                    ? searchQuery
                                                    : s?.login || ""
                                            }
                                            onFocus={() => setActiveInput(i)}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            className={styles.input}
                                        />
                                        {activeInput === i &&
                                            searchResults.length > 0 && (
                                                <ul className={styles.dropdown}>
                                                    {searchResults.map((user) => (
                                                        <li
                                                            key={user.id}
                                                            onClick={() =>
                                                                handleSelectUser(i, user)
                                                            }
                                                        >
                                                            <img
                                                                src={user.avatar_url}
                                                                alt="avatar"
                                                            />
                                                            <span>@{user.login}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                    </div>
                                )}
                            </div>
                        ))}

                        <button
                            className={styles.createButton}
                            onClick={handleCreateGroup}
                            disabled={creating}
                        >
                            {creating ? "Création en cours..." : "Créer le groupe"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateGroupPage;
