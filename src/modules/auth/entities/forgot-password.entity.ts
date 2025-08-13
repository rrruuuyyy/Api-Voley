
import { Usuario } from "src/modules/user/entities/usuario.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ForgotPassword {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Usuario, (user) => user.id, { onDelete: 'SET NULL' })
    @JoinColumn()
    user: Usuario;

    @Column({ type: 'varchar' })
    uuid: string;


    @CreateDateColumn({
        type: 'timestamp',
        nullable: true,
        default: () => 'CURRENT_TIMESTAMP',
    })
    public createdAt: Date;
}
