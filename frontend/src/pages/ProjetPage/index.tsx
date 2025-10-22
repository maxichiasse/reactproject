//frontend/src/pages/ProjetPage/index.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { projectsAPI } from "@api/projects";
import { useToast } from "@hooks/useToast";
import styles from "./ProjetPage.module.scss";
import type { AxiosError } from "axios";

const ProjetPage = () => {
    const { orgName } = useParams<{ orgName: string }>();
    const navigate = useNavigate();
    const { showToast, ToastContainer } = useToast();

    const [form, setForm] = useState({
        minStudents: 1,
        maxStudents: 5,
        maxGroups: 1,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: Number(value) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await projectsAPI.create(orgName!, form);
            const { joinUrl, secretKey } = res.data;

            showToast("✅ Projet créé avec succès !", "success");
            showToast(`🔑 Clé : ${secretKey}`, "info");
            showToast(`🔗 Lien : ${joinUrl}`, "info");

            navigate(`/orgs/${orgName}`);
        } catch (err) {
            const error = err as AxiosError<{ error?: string }>;
            const errorMsg = error.response?.data?.error || "Erreur inconnue";
            showToast(`❌ Erreur lors de la création du projet : ${errorMsg}`, "error");
        }
    };

    return (
        <div className={styles.pageWrapper}>
            {/* 🔙 Bouton retour */}
            <button className={styles.backButton} onClick={() => navigate("/orgs")}>
                ⬅ Retour
            </button>

            {/* 🧱 Bloc central blanc */}
            <div className={styles.container}>
                <h1>Créer un projet pour {orgName}</h1>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <label>
                        Nom du projet (lié à l’organisation) :
                        <input type="text" value={orgName} disabled className={styles.readonlyInput} />
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
                        Créer le projet
                    </button>
                </form>
            </div>

            {/* ✅ Zone d’affichage des toasts */}
            <ToastContainer />
        </div>
    );
};

export default ProjetPage;
