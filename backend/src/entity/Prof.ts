//backend/src/entity/Prof.ts
import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import { Organization } from "./Organization";
import { Project } from "./Project";

@Entity("profs") // table en DB s’appellera "profs"
export class Prof {
    @PrimaryColumn()
    id!: number; // GitHub ID du prof

    @Column({ nullable: true })
    login!: string;

    @Column({ nullable: true })
    name!: string;

    @Column({ nullable: true })
    avatar_url!: string;

    @Column({ nullable: true })
    encryptedToken!: string; // Token chiffré

    // Inverse de Organization.owner
    @OneToMany(() => Organization, (org) => org.owner)
    organizations!: Organization[];

    // Inverse de Project.owner
    @OneToMany(() => Project, (project) => project.owner)
    projects!: Project[];
}
