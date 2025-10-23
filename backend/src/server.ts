//backend/src/server.ts
import "reflect-metadata";
import * as dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { app } from "./app";
import express from "express";
import path from "path";

dotenv.config();

const PORT = process.env.PORT || 4000;

// 📁 Récupère le dossier racine du projet
const __rootDir = path.join(__dirname, "../..");

AppDataSource.initialize()
    .then(() => {
        console.log("📦 Base de données initialisée !");

        // 🧱 Sert le frontend compilé
        app.use(express.static(path.join(__rootDir, "frontend", "dist")));

        // 🔁 Fallback React Router (Express 5)
        app.use((req, res) => {
            res.sendFile(path.join(__rootDir, "frontend", "dist", "index.html"));
        });

        // 🚀 Lance le serveur
        app.listen(PORT, () => {
            console.log(`🚀 Serveur lancé sur le port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("❌ Erreur DB détaillée:");
        console.error(error);
        process.exit(1);
    });
