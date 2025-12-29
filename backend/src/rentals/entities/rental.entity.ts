import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { RentalStatus } from '../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Equipment } from '../../equipments/entities/equipment.entity';

@Entity('rentals')
export class Rental {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    equipmentId: string;

    @ManyToOne(() => Equipment)
    @JoinColumn({ name: 'equipmentId' })
    equipment: Equipment;

    @Column({ type: 'timestamp' })
    startDate: Date;

    @Column({ type: 'timestamp' })
    endDate: Date;

    @Column({
        type: 'enum',
        enum: RentalStatus,
        default: RentalStatus.PENDING,
    })
    status: RentalStatus;

    @Column({ type: 'text', nullable: true })
    requestDetails: string;

    @Column({ nullable: true })
    attachmentUrl: string;

    @CreateDateColumn()
    createdAt: Date;
}
