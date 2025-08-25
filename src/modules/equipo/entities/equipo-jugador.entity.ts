import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Usuario } from "../../user/entities/usuario.entity";
import { Equipo } from "./equipo.entity";

@Entity('equipo_jugador')
export class EquipoJugador {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 10, nullable: true })
    numeroJugador: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    posicion: string;

    @Column({ type: 'boolean', default: true })
    active: boolean;

    // Relaciones
    @ManyToOne(() => Equipo, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'equipoId' })
    equipo: Equipo;

    @ManyToOne(() => Usuario, { eager: true })
    @JoinColumn({ name: 'jugadorId' })
    jugador: Usuario;

    @CreateDateColumn()
    createdAt: Date;
}
