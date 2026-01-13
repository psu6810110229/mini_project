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

@Entity('rentals')                                                       // ตาราง: rentals (การยืม-คืน)
export class Rental {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // ===== ความสัมพันธ์กับ USER =====
    @Column()
    userId: string;                                                      // FK ไปยัง User

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;                                                          // ผู้ขอยืม

    // ===== ความสัมพันธ์กับ EQUIPMENT =====
    @Column()
    equipmentId: string;                                                 // FK ไปยัง Equipment

    @ManyToOne(() => Equipment, { onDelete: 'CASCADE' })                 // ลบ Equipment → ลบ Rental
    @JoinColumn({ name: 'equipmentId' })
    equipment: Equipment;                                                // อุปกรณ์ที่ยืม

    // ===== ความสัมพันธ์กับ EQUIPMENT ITEM (Optional) =====
    @Column({ nullable: true })
    equipmentItemId: string;                                             // FK ไปยัง EquipmentItem

    @ManyToOne(() => EquipmentItem, { nullable: true, onDelete: 'SET NULL' }) // ลบ Item → SET NULL
    @JoinColumn({ name: 'equipmentItemId' })
    equipmentItem: EquipmentItem;                                        // ชิ้นงานเฉพาะที่ยืม

    // ===== ช่วงเวลายืม =====
    @Column({ type: 'timestamp' })
    startDate: Date;                                                     // วันเริ่มยืม

    @Column({ type: 'timestamp' })
    endDate: Date;                                                       // วันคืน

    // ===== สถานะการยืม (State Machine) =====
    @Column({
        type: 'enum',
        enum: RentalStatus,
        default: RentalStatus.PENDING,                                   // ค่าเริ่มต้น = รอพิจารณา
    })
    status: RentalStatus;                                                // PENDING → APPROVED → CHECKED_OUT → RETURNED

    // ===== รายละเอียดคำขอ =====
    @Column({ type: 'text', nullable: true })
    requestDetails: string;                                              // เหตุผลที่ขอยืม

    @Column({ nullable: true })
    attachmentUrl: string;                                               // ไฟล์แนบ (ถ้ามี)

    @Column({ type: 'text', nullable: true })
    rejectReason: string;                                                // เหตุผลที่ถูกปฏิเสธ

    // ===== หลักฐานการรับ-คืนอุปกรณ์ =====
    @Column({ nullable: true })
    checkoutImageUrl: string;                                            // รูปถ่ายตอนรับอุปกรณ์

    @Column({ type: 'text', nullable: true })
    checkoutNote: string;                                                // หมายเหตุตอนรับ

    @Column({ nullable: true })
    returnImageUrl: string;                                              // รูปถ่ายตอนคืนอุปกรณ์

    @Column({ type: 'text', nullable: true })
    returnNote: string;                                                  // หมายเหตุตอนคืน

    @Column({ type: 'text', nullable: true })
    cancelReason: string;                                                // เหตุผลที่ยกเลิก

    @CreateDateColumn()
    createdAt: Date;                                                     // วันที่สร้างคำขอ
}
