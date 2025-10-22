//src/pages/CreateGroupPage/index.tsx
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@hooks/useToast";
import { projectsAPI } from "@api/projects";
import styles from "./CreateGroup.module.scss";

const CLIENT_ID = "Ov23lidkKtTsD46iYG6F";

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
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Student[]>([]);
    const [activeInput, setActiveInput] = useState<number | null>(null);
    const [creating, setCreating] = useState(false);
    const alreadyFetched = useRef(false);
    const { showToast, ToastContainer } = useToast();
    const navigate = useNavigate();

    const code = searchParams.get("code");

    // 🧩 Charger les infos du projet
    useEffect(() => {
        projectsAPI
            .getBySecret(projectId!, key!)
            .then((res) => {
                setProject(res.data);
                setStudents(Array(res.data.maxStudents).fill(null) as (Student | null)[]);
            })
            .catch(() => showToast("❌ Lien invalide ou expiré.", "error"))
            .finally(() => setLoading(false));
    }, [projectId, key]);

    // 👤 Charger l’étudiant connecté via OAuth
    useEffect(() => {
        if (code && projectId && !alreadyFetched.current) {
            alreadyFetched.current = true;
            projectsAPI
                .getStudentByCode(projectId, code)
                .then((res) => {
                    const user = res.data;
                    setStudents((prev) => {
                        const updated = [...prev];
                        updated[0] = user;
                        return updated;
                    });
                })
                .catch(() => showToast("⚠️ Erreur lors de la récupération du profil GitHub.", "error"));
        }
    }, [code, projectId]);

    // 🔍 Recherche d’utilisateurs GitHub
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(() => {
            projectsAPI
                .searchGithubUsers(projectId!, searchQuery)
                .then((res) => setSearchResults(res.data))
                .catch(() => setSearchResults([]));
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // 🧠 Sélection d’un utilisateur
    const handleSelectUser = (index: number, user: Student) => {
        setStudents((prev) => {
            const updated = [...prev];
            updated[index] = user;
            return updated;
        });
        setSearchResults([]);
        setSearchQuery("");
        setActiveInput(null);
    };

    // 🔐 Autoriser via OAuth GitHub
    const handleAuthorize = () => {
        const redirectUri = encodeURIComponent("http://localhost:5173/callback");
        const state = encodeURIComponent(`createGroup|${projectId}|${key}`);
        window.location.href =
            `https://github.com/login/oauth/authorize` +
            `?client_id=${CLIENT_ID}` +
            `&scope=read:user` +
            `&redirect_uri=${redirectUri}` +
            `&state=${state}`;
    };

    // 🚀 Créer un groupe d’étudiants
    const handleCreateGroup = async () => {
        if (!project) return;
        const selected = students.filter((s) => s !== null) as Student[];
        if (selected.length < project.minStudents) {
            showToast(`⚠️ Il faut au moins ${project.minStudents} étudiants pour créer un groupe.`, "info");
            return;
        }

        try {
            setCreating(true);
            const res = await projectsAPI.createGroup(projectId!, {
                secretKey: key!,
                students: selected,
            });
            showToast(`✅ Groupe créé avec succès : ${res.data.groupName}`, "success");
            navigate(0);
        } catch (err: any) {
            showToast(`❌ Erreur lors de la création du groupe : ${err.response?.data?.error || err.message}`, "error");
        } finally {
            setCreating(false);
        }
    };

    if (loading) return <p className={styles.loading}>Chargement...</p>;

    return (
        <div className={styles.container}>
            <h1>Créer / Rejoindre un groupe</h1>

            {project && (
                <>
                    <p>Projet : <b>{project.name}</b></p>
                    <p>Étudiants : {project.minStudents} à {project.maxStudents}</p>
                </>
            )}

            {!students[0] ? (
                <button className={styles.authButton} onClick={handleAuthorize}>
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
                                </div>
                            ) : (
                                <div className={styles.searchContainer}>
                                    <input
                                        type="text"
                                        placeholder={`@Étudiant ${i + 1}`}
                                        value={activeInput === i ? searchQuery : s?.login || ""}
                                        onFocus={() => setActiveInput(i)}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={styles.input}
                                    />
                                    {activeInput === i && searchResults.length > 0 && (
                                        <ul className={styles.dropdown}>
                                            {searchResults.map((user) => (
                                                <li key={user.id} onClick={() => handleSelectUser(i, user)}>
                                                    <img src={user.avatar_url} alt="avatar" />
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

            <ToastContainer />
        </div>
    );
};

export default CreateGroupPage;
