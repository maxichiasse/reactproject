//backend/src/entity/Student.ts
import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index} from "typeorm";
import { Group } from "./Group";
import { Project } from "./Project";

@Entity("students")
@Index(["project", "githubId"], { unique: true })
export class Student {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    githubId!: string;

    @Column()
    githubLogin!: string;

    @Column()
    githubAvatar!: string;

    @ManyToOne(() => Project, { onDelete: "CASCADE" })
    project!: Project;

    @ManyToOne(() => Group, (group) => group.students, { onDelete: "CASCADE" })
    group!: Group;
}
