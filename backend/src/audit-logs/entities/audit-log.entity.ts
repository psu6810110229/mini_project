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

@Entity('audit_logs')                                                    // ตาราง: audit_logs (บันทึกกิจกรรม)
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // ===== ความสัมพันธ์กับ RENTAL =====
    @Column({ nullable: true })
    rentalId: string;                                                    // FK ไปยัง Rental (ถ้าเกี่ยวข้อง)

    @ManyToOne(() => Rental, { nullable: true, onDelete: 'SET NULL' })   // ลบ Rental → SET NULL (เก็บ log ไว้)
    @JoinColumn({ name: 'rentalId' })
    rental: Rental;

    // ===== ความสัมพันธ์กับ USER =====
    @Column()
    userId: string;                                                      // FK ไปยัง User (ผู้ทำรายการ)

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    username: string;                                                    // เก็บชื่อซ้ำ (Denormalization) เผื่อ user ถูกลบ

    // ===== รายละเอียดการกระทำ =====
    @Column()
    actionType: string;                                                  // RENTAL_CREATE, RENTAL_APPROVED, EQUIPMENT_UPDATE, etc.

    @Column({ type: 'text', nullable: true })
    details: string;                                                     // JSON รายละเอียดเพิ่มเติม

    @CreateDateColumn()
    createdAt: Date;                                                     // วันเวลาที่ทำรายการ
}
