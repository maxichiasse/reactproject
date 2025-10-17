//backend/src/entity/Project.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from "typeorm";
import { Organization } from "./Organization";
import { Prof } from "./Prof";
import { Group } from "./Group";

@Entity("projects")
export class Project {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    secretKey!: string;

    @Column()
    minStudents!: number;

    @Column()
    maxStudents!: number;

    @Column()
    maxGroups!: number;

    @Column({ default: false })
    locked!: boolean;


    @ManyToOne(() => Organization, (org) => org.projects, { onDelete: "CASCADE" })
    organization!: Organization;

    @ManyToOne(() => Prof, (prof) => prof.projects)
    owner!: Prof;

    @OneToMany(() => Group, (group) => group.project)
    groups!: Group[];

    @CreateDateColumn()
    createdAt!: Date;
}
