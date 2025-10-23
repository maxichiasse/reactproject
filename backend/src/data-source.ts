//backend/src/data-source.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Prof } from "./entity/Prof";
import { Organization } from "./entity/Organization";
import { Project } from "./entity/Project";
import { Group } from "./entity/Group";
import { Student } from "./entity/Student";

export const AppDataSource = new DataSource({
    type: "mariadb",
    host: process.env.MYSQLHOST || "localhost",
    port: Number(process.env.MYSQLPORT) || 1220,
    username: process.env.MYSQLUSER || "maximutd",
    password: process.env.MYSQLPASSWORD || "wBjs1AWCXDVGArjb6wxX",
    database: process.env.MYSQLDATABASE || "githelper",
    synchronize: true, // garde true uniquement en dev !
    logging: ["error", "warn"],
    entities: [Prof, Organization, Project, Group, Student],
    migrations: [],
    subscribers: [],
});

