import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';

import { EquipmentStatus } from '../../common/enums';
import { EquipmentItem } from './equipment-item.entity';

@Entity('equipments')                                                    // ตาราง: equipments (ประเภทอุปกรณ์)
export class Equipment {
    @PrimaryGeneratedColumn('uuid')                                      // PK แบบ UUID
    id: string;

    @Column()
    name: string;                                                        // ชื่ออุปกรณ์ เช่น "กล้อง Canon"

    @Column({ nullable: true })
    category: string;                                                    // หมวดหมู่ เช่น "กล้อง", "ไฟ"

    @Column({
        type: 'enum',
        enum: EquipmentStatus,
        default: EquipmentStatus.AVAILABLE,                              // ค่าเริ่มต้น = พร้อมใช้งาน
    })
    status: EquipmentStatus;                                             // AVAILABLE, UNAVAILABLE, MAINTENANCE

    @Column({ default: 1 })
    stockQty: number;                                                    // จำนวนที่พร้อมยืม (ลดเมื่อ checkout)

    @Column({ nullable: true })
    imageUrl: string;                                                    // URL รูปภาพอุปกรณ์

    // ความสัมพันธ์ 1:N กับ EquipmentItem (ชิ้นงานแต่ละตัว)
    @OneToMany(() => EquipmentItem, (item) => item.equipment, {
        cascade: true,                                                   // Save/Delete items พร้อมกัน
        eager: true,                                                     // โหลด items อัตโนมัติ
    })
    items: EquipmentItem[];                                              // รายการชิ้นงาน เช่น item 001, 002

    @CreateDateColumn()
    createdAt: Date;
}
