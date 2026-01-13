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

@Entity('equipment_items')                                               // ตาราง: equipment_items (ชิ้นงานแต่ละตัว)
export class EquipmentItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    equipmentId: string;                                                 // FK ไปยัง Equipment

    // ความสัมพันธ์ N:1 กับ Equipment (ประเภทอุปกรณ์)
    @ManyToOne(() => Equipment, (equipment) => equipment.items, {
        onDelete: 'CASCADE'                                              // ลบ Equipment → ลบ Items ด้วย
    })
    @JoinColumn({ name: 'equipmentId' })
    equipment: Equipment;

    @Column()
    itemCode: string;                                                    // รหัสชิ้นงาน เช่น "001", "002"

    @Column({
        type: 'enum',
        enum: EquipmentItemStatus,
        default: EquipmentItemStatus.AVAILABLE,                          // ค่าเริ่มต้น = พร้อมยืม
    })
    status: EquipmentItemStatus;                                         // AVAILABLE, RENTED, MAINTENANCE

    @CreateDateColumn()
    createdAt: Date;
}
