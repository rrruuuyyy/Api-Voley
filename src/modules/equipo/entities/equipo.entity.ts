import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Usuario } from "../../user/entities/usuario.entity";
import { Liga } from "../../liga/entities/liga.entity";

@Entity('equipo')
export class Equipo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 200 })
    nombre: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    color: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ type: 'int', default: 0 })
    grupoNumero: number; // En qué grupo está el equipo

    @Column({ type: 'boolean', default: true })
    active: boolean;

    // Relaciones
    @ManyToOne(() => Usuario, { eager: true })
    @JoinColumn({ name: 'capitanId' })
    capitan: Usuario;

    @ManyToOne(() => Liga)
    @JoinColumn({ name: 'ligaId' })
    liga: Liga;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
