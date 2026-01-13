import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

/**
 * AuditLogsService - บันทึกกิจกรรมทั้งหมดในระบบ
 * 
 * ใช้สำหรับ:
 * - ติดตามว่าใครทำอะไร เมื่อไหร่ (Accountability)
 * - Debug ปัญหาที่เกิดขึ้น
 * - ตรวจสอบประวัติย้อนหลัง
 */
@Injectable()
export class AuditLogsService {
    constructor(
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,                                // ตาราง audit_logs
    ) { }

    // ===== สร้าง log ใหม่ (จาก DTO) =====
    async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
        const auditLog = this.auditLogRepository.create(createAuditLogDto);
        return this.auditLogRepository.save(auditLog);
    }

    // ===== Shorthand สำหรับบันทึก log (เรียกจาก services อื่น) =====
    async log(
        userId: string,                                                                   // ID ผู้ทำรายการ
        username: string,                                                                 // ชื่อผู้ทำรายการ
        actionType: string,                                                               // ประเภท เช่น RENTAL_CREATE
        rentalId?: string,                                                                // ID rental (ถ้าเกี่ยวข้อง)
        details?: string,                                                                 // JSON รายละเอียด
    ): Promise<AuditLog> {
        return this.create({ userId, username, actionType, rentalId, details });
    }

    // ===== ดึง log ทั้งหมด (Admin) =====
    async findAll(): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            relations: ['user', 'rental'],                                                // รวมข้อมูล user และ rental
            order: { createdAt: 'DESC' },                                                 // ล่าสุดก่อน
        });
    }

    // ===== ดึง log ของ rental หนึ่งรายการ (Audit Trail) =====
    async findByRental(rentalId: string): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            where: { rentalId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    // ===== ดึง log ของ user คนหนึ่ง =====
    async findByUser(userId: string): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            where: { userId },
            relations: ['rental'],
            order: { createdAt: 'DESC' },
        });
    }

    // ===== ลบ log เก่ากว่า N วัน (Log Retention Policy) =====
    async deleteOlderThan(days: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);                                  // วันที่ N วันก่อน

        const result = await this.auditLogRepository
            .createQueryBuilder()
            .delete()
            .where('createdAt < :cutoffDate', { cutoffDate })                             // เก่ากว่า cutoff
            .execute();

        return result.affected || 0;                                                      // จำนวนที่ลบ
    }

    // ===== ลบ log ทั้งหมด (ระวัง!) =====
    async deleteAll(): Promise<number> {
        const result = await this.auditLogRepository
            .createQueryBuilder()
            .delete()
            .execute();

        return result.affected || 0;
    }
}
