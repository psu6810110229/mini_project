import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rental } from './entities/rental.entity';
import { RentalStatus } from '../common/enums';

/**
 * =====================================================================
 * RentalValidationService - ตรวจสอบความถูกต้องของการจอง
 * =====================================================================
 * 
 * หน้าที่หลัก:
 * 1. ตรวจสอบการจองซ้อนทับ (Overlap Detection)
 * 2. ตรวจสอบการเปลี่ยนสถานะว่าถูกต้องหรือไม่ (State Machine)
 * 
 * =====================================================================
 * 🔥 OVERLAP ALGORITHM (สำคัญมาก!)
 * =====================================================================
 * 
 * สูตร: ช่วงเวลา A กับ B ซ้อนกัน ถ้า:
 *   A.start < B.end AND A.end > B.start
 * 
 * ตัวอย่าง:
 *   Rental A: 10-15 มกราคม
 *   Rental B: 12-18 มกราคม
 *   
 *   A.start(10) < B.end(18) ✓
 *   A.end(15) > B.start(12) ✓
 *   → ซ้อนกัน! ห้ามจอง
 * 
 * =====================================================================
 */

@Injectable()
export class RentalValidationService {
    constructor(
        @InjectRepository(Rental)
        private rentalRepository: Repository<Rental>,                                     // ตาราง rentals
    ) { }

    /**
     * ตรวจสอบว่ามีการจองซ้อนทับหรือไม่
     * 
     * @param equipmentId - ID อุปกรณ์ที่ต้องการเช็ค
     * @param startDate - วันเริ่มจอง
     * @param endDate - วันสิ้นสุดจอง
     * @returns true = มีซ้อน, false = ว่างอยู่
     */
    async checkOverlap(equipmentId: string, startDate: Date, endDate: Date, excludeRentalId?: string, equipmentItemId?: string): Promise<boolean> {
        const queryBuilder = this.rentalRepository
            .createQueryBuilder('rental')
            .where('rental.equipmentId = :equipmentId', { equipmentId })
            // ไม่นับ Rental ที่จบไปแล้ว (RETURNED, REJECTED, CANCELLED)
            .andWhere('rental.status NOT IN (:...excludedStatuses)', {
                excludedStatuses: [RentalStatus.RETURNED, RentalStatus.REJECTED, RentalStatus.CANCELLED],
            })
            // 🔥 OVERLAP LOGIC: A.start < B.end AND A.end > B.start
            .andWhere('rental.startDate < :endDate', { endDate })
            .andWhere('rental.endDate > :startDate', { startDate });

        if (equipmentItemId) {
            queryBuilder.andWhere('rental.equipmentItemId = :equipmentItemId', { equipmentItemId });
        }

        if (excludeRentalId) {
            queryBuilder.andWhere('rental.id != :excludeRentalId', { excludeRentalId });  // ไม่รวมตัวเอง
        }

        const count = await queryBuilder.getCount();
        return count > 0;                                                                  // มี overlap ถ้า count > 0
    }

    // ===== ตรวจ overlap โดยไม่รวม user คนเดียวกัน =====
    async checkOverlapExcludingUser(equipmentId: string, startDate: Date, endDate: Date, excludeUserId: string, equipmentItemId?: string): Promise<boolean> {
        const queryBuilder = this.rentalRepository
            .createQueryBuilder('rental')
            .where('rental.equipmentId = :equipmentId', { equipmentId })
            .andWhere('rental.userId != :excludeUserId', { excludeUserId })               // ไม่รวม user ตัวเอง
            .andWhere('rental.status NOT IN (:...excludedStatuses)', {
                excludedStatuses: [RentalStatus.RETURNED, RentalStatus.REJECTED, RentalStatus.CANCELLED],
            })
            .andWhere('rental.startDate < :endDate', { endDate })
            .andWhere('rental.endDate > :startDate', { startDate });

        if (equipmentItemId) {
            queryBuilder.andWhere('rental.equipmentItemId = :equipmentItemId', { equipmentItemId });
        }

        const count = await queryBuilder.getCount();
        return count > 0;
    }

    /**
     * =====================================================================
     * STATE MACHINE - ควบคุมการเปลี่ยนสถานะ
     * =====================================================================
     * 
     * กฎ: แต่ละสถานะจะเปลี่ยนไปได้เฉพาะบางสถานะเท่านั้น
     * 
     * PENDING     → APPROVED, REJECTED, CANCELLED  (รอพิจารณา)
     * APPROVED    → CHECKED_OUT, CANCELLED         (อนุมัติแล้ว)
     * CHECKED_OUT → RETURNED                       (รับไปแล้ว)
     * RETURNED    → (จบ)                           (คืนแล้ว)
     * REJECTED    → (จบ)                           (ปฏิเสธ)
     * CANCELLED   → (จบ)                           (ยกเลิก)
     * 
     * =====================================================================
     */
    validateStatusTransition(currentStatus: RentalStatus, newStatus: RentalStatus): void {
        // Map: สถานะปัจจุบัน → สถานะที่อนุญาตให้เปลี่ยนไปได้
        const allowedTransitions: Record<RentalStatus, RentalStatus[]> = {
            [RentalStatus.PENDING]: [RentalStatus.APPROVED, RentalStatus.REJECTED, RentalStatus.CANCELLED],
            [RentalStatus.APPROVED]: [RentalStatus.CHECKED_OUT, RentalStatus.CANCELLED],
            [RentalStatus.CHECKED_OUT]: [RentalStatus.RETURNED],                           // ยืมแล้วต้องคืน ห้ามยกเลิก
            [RentalStatus.RETURNED]: [],                                                    // สถานะสุดท้าย
            [RentalStatus.REJECTED]: [],                                                    // สถานะสุดท้าย
            [RentalStatus.CANCELLED]: [],                                                   // สถานะสุดท้าย
        };

        if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
            throw new BadRequestException(
                `Cannot transition from ${currentStatus} to ${newStatus}`,
            );
        }
    }

    // ===== ดึง rentals ที่ซ้อนทับ (สำหรับ auto-reject) =====
    async getOverlappingRentals(equipmentId: string, startDate: Date, endDate: Date, equipmentItemId?: string): Promise<Rental[]> {
        const queryBuilder = this.rentalRepository
            .createQueryBuilder('rental')
            .leftJoinAndSelect('rental.user', 'user')                                      // รวมข้อมูล user
            .leftJoinAndSelect('rental.equipment', 'equipment')
            .where('rental.equipmentId = :equipmentId', { equipmentId })
            .andWhere('rental.status IN (:...activeStatuses)', {
                activeStatuses: [RentalStatus.PENDING, RentalStatus.APPROVED, RentalStatus.CHECKED_OUT],
            })
            .andWhere('rental.startDate < :endDate', { endDate })
            .andWhere('rental.endDate > :startDate', { startDate });

        if (equipmentItemId) {
            queryBuilder.andWhere('rental.equipmentItemId = :equipmentItemId', { equipmentItemId });
        }

        return queryBuilder.orderBy('rental.startDate', 'ASC').getMany();                  // เรียงตามวันเริ่ม
    }
}
