import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('sede')
export class Sede {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 200 })
    nombre: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    direccion: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    telefono: string;

    @Column({ type: 'int', default: 1 })
    numeroCancha: number;

    @Column({ type: 'boolean', default: true })
    active: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
