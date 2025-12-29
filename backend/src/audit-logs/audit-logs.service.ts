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
}
