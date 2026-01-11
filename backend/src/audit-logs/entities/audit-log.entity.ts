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

    /**
     * Foreign key to the Rental table
     * onDelete: 'SET NULL' means when a rental is deleted, 
     * the audit log keeps the record but sets rentalId to null
     * This prevents FK constraint errors when deleting rentals
     */
    @ManyToOne(() => Rental, { nullable: true, onDelete: 'SET NULL' })
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
