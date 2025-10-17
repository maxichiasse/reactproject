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
    host: "localhost",
    port: 1220,
    username: "maximutd",
    password: "wBjs1AWCXDVGArjb6wxX",
    database: "githelper",
    synchronize: true,          // OK en dev
    //dropSchema: true,         // (optionnel) pour repartir de zéro en dev
    logging: ["error", "warn"],
    entities: [Prof, Organization, Project, Group, Student],
    migrations: [],
    subscribers: [],
});

