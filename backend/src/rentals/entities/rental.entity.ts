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
import { EquipmentItem } from '../../equipments/entities/equipment-item.entity';

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

    @ManyToOne(() => Equipment, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'equipmentId' })
    equipment: Equipment;

    @Column({ nullable: true })
    equipmentItemId: string;

    @ManyToOne(() => EquipmentItem, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'equipmentItemId' })
    equipmentItem: EquipmentItem;

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

    @Column({ type: 'text', nullable: true })
    rejectReason: string;

    // ===== CHECKOUT/RETURN EVIDENCE (Optional) =====
    // Users can upload images when picking up or returning equipment
    // This provides evidence for admin review

    /** URL of the image user uploads when picking up equipment */
    @Column({ nullable: true })
    checkoutImageUrl: string;

    /** Optional note from user when checking out */
    @Column({ type: 'text', nullable: true })
    checkoutNote: string;

    /** URL of the image user uploads when returning equipment */
    @Column({ nullable: true })
    returnImageUrl: string;

    /** Optional note from user when returning */
    @Column({ type: 'text', nullable: true })
    returnNote: string;

    /** Message required when user cancels the rental */
    @Column({ type: 'text', nullable: true })
    cancelReason: string;

    @CreateDateColumn()
    createdAt: Date;
}
