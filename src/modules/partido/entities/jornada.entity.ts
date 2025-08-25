import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Liga } from "../../liga/entities/liga.entity";
import { Usuario } from "../../user/entities/usuario.entity";
import { Partido } from "../../partido/entities/partido.entity";

export enum JornadaStatusEnum {
  PROGRAMADA = 'PROGRAMADA',
  EN_CURSO = 'EN_CURSO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA'
}

export enum TipoJornadaEnum {
  AUTOMATICA = 'AUTOMATICA',      // Generada por round-robin
  PERSONALIZADA = 'PERSONALIZADA'  // Creada manualmente por admin
}

@Entity('jornada')
export class Jornada {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    numero: number; // Número secuencial de jornada

    @Column({ type: 'varchar', length: 200 })
    nombre: string; // Ej: "Jornada 5", "Fecha de recuperación"

    @Column({ type: 'text', nullable: true })
    descripcion?: string; // Descripción opcional

    @Column({ type: 'enum', enum: TipoJornadaEnum, default: TipoJornadaEnum.AUTOMATICA })
    tipo: TipoJornadaEnum;

    @Column({ type: 'enum', enum: JornadaStatusEnum, default: JornadaStatusEnum.PROGRAMADA })
    status: JornadaStatusEnum;

    @Column({ type: 'date', nullable: true })
    fechaProgramada: Date; // Fecha sugerida para la jornada

    @Column({ type: 'time', nullable: true })
    horaProgramada: string; // Hora sugerida (HH:MM)

    @Column({ type: 'int', default: 0 })
    partidosCompletados: number; // Contador de partidos finalizados

    @Column({ type: 'int', default: 0 })
    partidosTotales: number; // Total de partidos en esta jornada

    @Column({ type: 'boolean', default: true })
    active: boolean;

    // Relaciones
    @ManyToOne(() => Liga)
    @JoinColumn({ name: 'ligaId' })
    liga: Liga;

    @ManyToOne(() => Usuario, { nullable: true })
    @JoinColumn({ name: 'creadoPorId' })
    creadoPor: Usuario; // Quién creó la jornada personalizada

    @OneToMany(() => Partido, (partido) => partido.jornadaPersonalizada)
    partidos: Partido[];

    @CreateDateColumn()
    createdAt: Date;
}
