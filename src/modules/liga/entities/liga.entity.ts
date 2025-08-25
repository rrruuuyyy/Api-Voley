import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Usuario } from "../../user/entities/usuario.entity";
import { Sede } from "../../sede/entities/sede.entity";
import { LigaStatusEnum, ScoringSystemEnum, TiebreakCriteriaEnum } from "../liga.types";
import { Equipo } from "src/modules/equipo/entities/equipo.entity";

@Entity('liga')
export class Liga {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 200 })
    nombre: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ type: 'enum', enum: LigaStatusEnum, default: LigaStatusEnum.PROGRAMADA })
    status: LigaStatusEnum;

    @Column({ type: 'int', default: 1 })
    vueltas: number; // k vueltas (cuántas veces se enfrenta cada par)

    @Column({ type: 'int', default: 1 })
    numeroGrupos: number; // número de grupos

    @Column({ type: 'enum', enum: ScoringSystemEnum, default: ScoringSystemEnum.FIVB })
    sistemaPuntos: ScoringSystemEnum;

    @Column({ type: 'json' })
    criteriosDesempate: TiebreakCriteriaEnum[]; // Array ordenado de criterios

    @Column({ type: 'int', default: 1 })
    maxPartidosPorDia: number;

    @Column({ type: 'int', default: 60 })
    duracionEstimadaPartido: number; // en minutos

    @Column({ type: 'int', default: 30 })
    descansoMinimo: number; // minutos entre partidos

    @Column({ type: 'date' })
    fechaInicio: Date;

    @Column({ type: 'date', nullable: true })
    fechaFin?: Date;

    @Column({ type: 'boolean', default: true })
    active: boolean;

    // Campos calculados del sistema round-robin
    @Column({ type: 'int', nullable: true })
    numeroEquipos: number; // Se calcula automáticamente

    @Column({ type: 'int', nullable: true })
    partidosPorEquipo: number; // (n-1) * k

    @Column({ type: 'int', nullable: true })
    partidosTotales: number; // n * (n-1) / 2 * k

    @Column({ type: 'int', nullable: true })
    totalJornadas: number; // k * (n-1) si n es par, k * n si n es impar

    @Column({ type: 'int', nullable: true })
    partidosPorJornada: number; // n/2 si n es par, (n-1)/2 si n es impar

    // Relaciones
    @ManyToOne(() => Usuario, { eager: true })
    @JoinColumn({ name: 'adminLigaId' })
    adminLiga: Usuario;

    @ManyToOne(() => Sede, { eager: true })
    @JoinColumn({ name: 'sedeId' })
    sede: Sede;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    @OneToMany(() => Equipo, (equipo) => equipo.liga)
    equipos: Equipo[]
}
