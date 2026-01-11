import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditLogsService {
    constructor(
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) { }

    async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
        const auditLog = this.auditLogRepository.create(createAuditLogDto);
        return this.auditLogRepository.save(auditLog);
    }

    async log(
        userId: string,
        username: string,
        actionType: string,
        rentalId?: string,
        details?: string,
    ): Promise<AuditLog> {
        return this.create({
            userId,
            username,
            actionType,
            rentalId,
            details,
        });
    }

    async findAll(): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            relations: ['user', 'rental'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByRental(rentalId: string): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            where: { rentalId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByUser(userId: string): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            where: { userId },
            relations: ['rental'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Delete audit logs older than specified days
     * @param days Number of days - logs older than this will be deleted
     * @returns Number of deleted records
     */
    async deleteOlderThan(days: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const result = await this.auditLogRepository
            .createQueryBuilder()
            .delete()
            .where('createdAt < :cutoffDate', { cutoffDate })
            .execute();

        return result.affected || 0;
    }

    /**
     * Delete all audit logs
     * @returns Number of deleted records
     */
    async deleteAll(): Promise<number> {
        const result = await this.auditLogRepository
            .createQueryBuilder()
            .delete()
            .execute();

        return result.affected || 0;
    }
}
