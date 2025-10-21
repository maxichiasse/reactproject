//backend/src/server.ts
import "reflect-metadata";
import * as dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { app } from "./app";

dotenv.config();

const PORT = process.env.PORT || 4000;

AppDataSource.initialize()
    .then(() => {
        console.log("📦 Base de données initialisée !");
        app.listen(PORT, () => {
            console.log(`🚀 Backend lancé sur http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("❌ Erreur DB détaillée:");
        console.error(error);
        process.exit(1);
    });
