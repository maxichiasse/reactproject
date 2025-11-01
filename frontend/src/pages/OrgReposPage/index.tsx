//frontend/src/pages/OrgReposPage/index.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { orgsAPI } from "@api/orgs";
import type { Project } from "types/Project";
import type { Repository } from "types/Repository";
import styles from "./OrgReposPage.module.scss";

const OrgReposPage = () => {
    const { orgName } = useParams<{ orgName: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);
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
                    <p><b>Lien d’inscription :</b> {project.joinUrl} </p>
                    <p><b>Étudiants :</b> {project.minStudents} - {project.maxStudents}</p>
                    <p><b>Groupes max :</b> {project.maxGroups}</p>
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
                            <a href={repo.html_url} target="_blank" rel="noreferrer">
                                <h3>{repo.name}</h3>
                            </a>
                            <p>{repo.description || "Pas de description"}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrgReposPage;
