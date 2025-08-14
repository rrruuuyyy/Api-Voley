import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserRolesEnum } from "../usuario.types";

@Entity('usuario')
export class Usuario {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type:'varchar', length:'300' })
    nombre: string;

    @Column({ unique: true, type:'varchar', length:150 })
    correo: string;

    @Column({ type:'varchar', length:200 })
    password: string;

    @Column({ type:'varchar', length:'6', nullable: true })
    code:string

    @Column({ type:'varchar', length:'20', unique: true })
    qrCode: string

    @Column({ type:'enum', enum:UserRolesEnum })
    rol: UserRolesEnum;

    @Column({ type:'boolean', default: true })
    active: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
