//backend/src/entity/Group.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Index } from "typeorm";
import { Project } from "./Project";
import { Student } from "./Student";

@Entity("groups")
@Index (["project", "name"], { unique: true })
export class Group {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @ManyToOne(() => Project, (project) => project.groups, { onDelete: "CASCADE" })
    project!: Project;

    @OneToMany(() => Student, (student) => student.group)
    students!: Student[];
}
