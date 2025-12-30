import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { EquipmentItemStatus } from '../../common/enums';
import { Equipment } from './equipment.entity';

@Entity('equipment_items')
export class EquipmentItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    equipmentId: string;

    @ManyToOne(() => Equipment, (equipment) => equipment.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'equipmentId' })
    equipment: Equipment;

    @Column()
    itemCode: string; // e.g., "001", "002"

    @Column({
        type: 'enum',
        enum: EquipmentItemStatus,
        default: EquipmentItemStatus.AVAILABLE,
    })
    status: EquipmentItemStatus;

    @CreateDateColumn()
    createdAt: Date;
}
