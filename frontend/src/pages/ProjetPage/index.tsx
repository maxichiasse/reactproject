//frontend/src/pages/ProjetPage/index.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { projectsAPI } from "@api/projects";
import { useOrgs } from "@contexts/OrgsContext";
import { useToast } from "@contexts/ToastContext";
import styles from "./ProjetPage.module.scss";
import type { AxiosError } from "axios";

const ProjetPage = () => {
    const { orgName } = useParams<{ orgName: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { refreshOrgs } = useOrgs();

    const [form, setForm] = useState({
        id: null as number | null,
        minStudents: 1,
        maxStudents: 5,
        maxGroups: 1,
    });

    const [loading, setLoading] = useState(true);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: Number(value) });
    };

    // 🧩 Vérifie si un projet existe déjà pour cette organisation
    useEffect(() => {
        const fetchExistingProject = async () => {
            try {
                const res = await projectsAPI.get(orgName!);
                if (res.data) {
                    setForm({
                        id: res.data.id,
                        minStudents: res.data.minStudents,
                        maxStudents: res.data.maxStudents,
                        maxGroups: res.data.maxGroups,
                    });
                }
            } catch {
                console.log("ℹ️ Aucun projet existant pour cette organisation (mode création).");
            } finally {
                setLoading(false);
            }
        };

        fetchExistingProject();
    }, [orgName]);

    // 🚀 Créer ou mettre à jour un projet
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await projectsAPI.create(orgName!, {
                minStudents: form.minStudents,
                maxStudents: form.maxStudents,
                maxGroups: form.maxGroups,
            });

            const { joinUrl, secretKey } = res.data;

            if (form.id) {
                showToast("✏️ Projet modifié avec succès !", "success");
            } else {
                showToast("✅ Projet créé avec succès !", "success");
            }

            showToast(`🔑 Clé : ${secretKey}`, "info");
            showToast(`🔗 Lien : ${joinUrl}`, "info");

            await refreshOrgs();

            navigate(`/orgs/${orgName}`);
        } catch (err) {
            const error = err as AxiosError<{ error?: string }>;
            const errorMsg = error.response?.data?.error || "Erreur inconnue";
            showToast(`❌ Erreur lors de la création du projet : ${errorMsg}`, "error");
        }
    };

    if (loading) return <p className={styles.loading}>Chargement du projet...</p>;

    return (
        <>
            {/* 🔙 Bouton retour global */}
            <button className={styles.backButton} onClick={() => navigate("/orgs")}>
                ⬅ Retour
            </button>

            <div className={styles.pageWrapper}>
                <div className={styles.container}>
                    <h1>
                        {form.id ? "Modifier le projet" : "Créer un projet"} pour {orgName}
                    </h1>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <label>
                        Nom du projet (lié à l’organisation) :
                        <input
                            type="text"
                            value={orgName}
                            disabled
                            className={styles.readonlyInput}
                        />
                    </label>

                    <label>
                        Nombre minimum d’étudiants :
                        <input
                            type="number"
                            name="minStudents"
                            min={1}
                            value={form.minStudents}
                            onChange={handleChange}
                        />
                    </label>

                    <label>
                        Nombre maximum d’étudiants :
                        <input
                            type="number"
                            name="maxStudents"
                            min={1}
                            value={form.maxStudents}
                            onChange={handleChange}
                        />
                    </label>

                    <label>
                        Nombre maximum de groupes :
                        <input
                            type="number"
                            name="maxGroups"
                            min={1}
                            value={form.maxGroups}
                            onChange={handleChange}
                        />
                    </label>

                    <button type="submit" className={styles.submitButton}>
                        {form.id ? "Mettre à jour le projet" : "Créer le projet"}
                    </button>
                </form>
            </div>
        </div>
        </>

    );
};

export default ProjetPage;
