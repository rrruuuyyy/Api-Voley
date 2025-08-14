import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Equipo } from "../../equipo/entities/equipo.entity";
import { Liga } from "../../liga/entities/liga.entity";
import { PartidoStatusEnum } from "../partido.types";

@Entity('partido')
export class Partido {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    jornada: number;

    @Column({ type: 'int', default: 1 })
    vuelta: number; // 1 para primera vuelta, 2 para segunda vuelta, etc.

    @Column({ type: 'timestamp', nullable: true })
    fechaHora: Date;

    @Column({ type: 'enum', enum: PartidoStatusEnum, default: PartidoStatusEnum.PROGRAMADO })
    status: PartidoStatusEnum;

    // Resultados
    @Column({ type: 'int', default: 0 })
    setsEquipoLocal: number;

    @Column({ type: 'int', default: 0 })
    setsEquipoVisitante: number;

    @Column({ type: 'json', nullable: true })
    detallesSets: { local: number, visitante: number }[]; // Puntos por set

    @Column({ type: 'int', default: 0 })
    puntosEquipoLocal: number; // Puntos de liga asignados

    @Column({ type: 'int', default: 0 })
    puntosEquipoVisitante: number; // Puntos de liga asignados

    @Column({ type: 'text', nullable: true })
    observaciones?: string;

    // Relaciones
    @ManyToOne(() => Equipo, { eager: true })
    @JoinColumn({ name: 'equipoLocalId' })
    equipoLocal: Equipo;

    @ManyToOne(() => Equipo, { eager: true })
    @JoinColumn({ name: 'equipoVisitanteId' })
    equipoVisitante: Equipo;

    @ManyToOne(() => Liga)
    @JoinColumn({ name: 'ligaId' })
    liga: Liga;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
