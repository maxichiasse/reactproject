//backend/src/entity/Organization.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Prof } from "./Prof";
import { Project } from "./Project";

@Entity("organizations")
export class Organization {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ nullable: true })
    avatar_url!: string;

    @Column({ default: 0 })
    public_repos!: number;

    @Column()
    ownerId!: number;

    @ManyToOne(() => Prof, (prof) => prof.organizations, { onDelete: "CASCADE" })
    @JoinColumn({ name: "ownerId" })
    owner!: Prof;

    @OneToMany(() => Project, (project) => project.organization)
    projects!: Project[];
}
