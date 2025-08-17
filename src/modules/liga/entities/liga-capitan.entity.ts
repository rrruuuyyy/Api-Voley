import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Column } from 'typeorm';
import { Liga } from './liga.entity';
import { Usuario } from '../../user/entities/usuario.entity';

@Entity('liga_capitan')
export class LigaCapitan {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Liga)
  @JoinColumn({ name: 'ligaId' })
  liga: Liga;

  @ManyToOne(() => Usuario, { eager: true })
  @JoinColumn({ name: 'capitanId' })
  capitan: Usuario;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  fechaAsignacion: Date;
}
