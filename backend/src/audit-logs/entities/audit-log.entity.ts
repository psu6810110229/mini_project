import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Rental } from '../../rentals/entities/rental.entity';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    rentalId: string;

    @ManyToOne(() => Rental, { nullable: true })
    @JoinColumn({ name: 'rentalId' })
    rental: Rental;

    @Column()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    username: string;

    @Column()
    actionType: string;

    @Column({ type: 'text', nullable: true })
    details: string;

    @CreateDateColumn()
    createdAt: Date;
}
