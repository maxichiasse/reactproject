//backend/src/entity/Prof.ts
import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import { Organization } from "./Organization";
import { Project } from "./Project";

@Entity("profs")
export class Prof {
    @PrimaryColumn()
    id!: number;

    @Column({ nullable: true })
    login!: string;

    @Column({ nullable: true })
    name!: string;

    @Column({ nullable: true })
    avatar_url!: string;

    @Column({ nullable: true })
    encryptedToken!: string;

    // Inverse de Organization.owner
    @OneToMany(() => Organization, (org) => org.owner)
    organizations!: Organization[];

    // Inverse de Project.owner
    @OneToMany(() => Project, (project) => project.owner)
    projects!: Project[];
}
