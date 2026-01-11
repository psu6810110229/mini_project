import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rental } from './entities/rental.entity';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalStatusDto } from './dto/update-rental-status.dto';
import { RentalStatus, EquipmentItemStatus } from '../common/enums';
import { EquipmentItem } from '../equipments/entities/equipment-item.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RentalValidationService } from './rental-validation.service';
import { RentalStockService } from './rental-stock.service';

@Injectable()
export class RentalsService {
    constructor(
        @InjectRepository(Rental) private rentalRepository: Repository<Rental>,
        @InjectRepository(EquipmentItem) private equipmentItemRepository: Repository<EquipmentItem>,
        private auditLogsService: AuditLogsService,
        private validationService: RentalValidationService,
        private stockService: RentalStockService,
    ) { }

    async create(userId: string, createRentalDto: CreateRentalDto): Promise<Rental> {
        const { equipmentId, equipmentItemId, startDate, endDate, requestDetails, attachmentUrl, allowOverlap } = createRentalDto;
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) throw new BadRequestException('End date must be after start date');
        if (start < new Date()) throw new BadRequestException('Start date cannot be in the past');

        if (equipmentItemId) {
            const item = await this.equipmentItemRepository.findOne({ where: { id: equipmentItemId } });
            if (!item) throw new NotFoundException('Equipment item not found');
            if (item.status !== EquipmentItemStatus.AVAILABLE) throw new BadRequestException('This item is not available for rental');
        }

        await this.handleDuplicateRequests(userId, equipmentId, start, end, equipmentItemId);

        if (!allowOverlap) {
            const hasOverlap = await this.validationService.checkOverlapExcludingUser(equipmentId, start, end, userId, equipmentItemId);
            if (hasOverlap) throw new BadRequestException('Equipment is already booked for this period');
        }

        const rental = await this.rentalRepository.save(this.rentalRepository.create({
            userId, equipmentId, equipmentItemId, startDate: start, endDate: end, requestDetails, attachmentUrl, status: RentalStatus.PENDING,
        }));

        await this.auditLogsService.log(userId, 'User', 'RENTAL_CREATE', rental.id, JSON.stringify({ equipmentId, equipmentItemId, startDate, endDate }));
        return rental;
    }

    private async handleDuplicateRequests(userId: string, equipmentId: string, start: Date, end: Date, equipmentItemId?: string) {
        const query = this.rentalRepository.createQueryBuilder('rental')
            .where('rental.userId = :userId', { userId })
            .andWhere('rental.equipmentId = :equipmentId', { equipmentId })
            .andWhere('rental.status = :status', { status: RentalStatus.PENDING })
            .andWhere('rental.startDate < :endDate', { endDate: end })
            .andWhere('rental.endDate > :startDate', { startDate: start });

        if (equipmentItemId) query.andWhere('rental.equipmentItemId = :equipmentItemId', { equipmentItemId });

        const duplicates = await query.getMany();
        for (const dup of duplicates) {
            dup.status = RentalStatus.CANCELLED;
            await this.rentalRepository.save(dup);
            await this.auditLogsService.log(userId, 'User', 'RENTAL_AUTO_CANCELLED', dup.id, JSON.stringify({ reason: 'Replaced by new request', newDates: { start, end } }));
        }
    }

    async updateStatus(id: string, updateStatusDto: UpdateRentalStatusDto): Promise<Rental & { autoRejectedRentals?: string[] }> {
        const rental = await this.findOne(id);
        const { status: newStatus } = updateStatusDto;

        this.validationService.validateStatusTransition(rental.status, newStatus);

        let autoRejectedRentals: string[] = [];
        if (newStatus === RentalStatus.APPROVED && rental.status === RentalStatus.PENDING) {
            autoRejectedRentals = await this.handleAutoRejection(rental);
        }

        await this.stockService.handleStockUpdate(rental, newStatus);

        const previousStatus = rental.status;
        rental.status = newStatus;
        if (newStatus === RentalStatus.REJECTED && updateStatusDto.rejectReason) rental.rejectReason = updateStatusDto.rejectReason;
        if (newStatus === RentalStatus.CANCELLED && updateStatusDto.cancelReason) rental.cancelReason = updateStatusDto.cancelReason;

        const savedRental = await this.rentalRepository.save(rental);
        await this.auditLogsService.log(rental.userId, rental.user?.name || 'Unknown', `RENTAL_STATUS_${newStatus}`, rental.id, JSON.stringify({ previousStatus, newStatus }));

        return { ...savedRental, autoRejectedRentals: autoRejectedRentals.length > 0 ? autoRejectedRentals : undefined };
    }

    private async handleAutoRejection(rental: Rental): Promise<string[]> {
        const overlappingRentals = await this.validationService.getOverlappingRentals(rental.equipmentId, rental.startDate, rental.endDate, rental.equipmentItemId);
        const rejectedNames: string[] = [];

        for (const other of overlappingRentals) {
            if (other.id === rental.id || other.status !== RentalStatus.PENDING) continue;

            other.status = RentalStatus.REJECTED;
            await this.rentalRepository.save(other);
            rejectedNames.push(`${other.user?.name || 'Unknown'} (${other.user?.studentId || 'N/A'})`);

            await this.auditLogsService.log(other.userId, other.user?.name || 'Unknown', 'RENTAL_AUTO_REJECTED', other.id, JSON.stringify({ reason: 'Overlapping rental approved', approvedRentalId: rental.id }));
        }
        return rejectedNames;
    }

    async getOverlappingRentals(equipmentId: string, startDate: Date, endDate: Date, equipmentItemId?: string): Promise<Rental[]> {
        return this.validationService.getOverlappingRentals(equipmentId, startDate, endDate, equipmentItemId);
    }

    async findAll(): Promise<Rental[]> {
        return this.rentalRepository.find({ relations: ['user', 'equipment', 'equipmentItem'], order: { createdAt: 'DESC' } });
    }

    async findByUser(userId: string): Promise<Rental[]> {
        return this.rentalRepository.find({ where: { userId }, relations: ['equipment', 'equipmentItem'], order: { createdAt: 'DESC' } });
    }

    async findActiveByEquipment(equipmentId: string): Promise<Rental[]> {
        return this.rentalRepository.createQueryBuilder('rental')
            .leftJoinAndSelect('rental.equipmentItem', 'equipmentItem').leftJoinAndSelect('rental.user', 'user')
            .where('rental.equipmentId = :equipmentId', { equipmentId })
            .andWhere('rental.status IN (:...statuses)', { statuses: [RentalStatus.PENDING, RentalStatus.APPROVED, RentalStatus.CHECKED_OUT] })
            .orderBy('rental.startDate', 'ASC').getMany();
    }

    async findOne(id: string): Promise<Rental> {
        const rental = await this.rentalRepository.findOne({ where: { id }, relations: ['user', 'equipment', 'equipmentItem'] });
        if (!rental) throw new NotFoundException(`Rental with ID ${id} not found`);
        return rental;
    }

    async uploadImage(id: string, imageType: 'checkout' | 'return', imageUrl: string, note?: string): Promise<Rental> {
        const rental = await this.findOne(id);
        if (imageType === 'checkout') { rental.checkoutImageUrl = imageUrl; if (note) rental.checkoutNote = note; }
        else { rental.returnImageUrl = imageUrl; if (note) rental.returnNote = note; }
        return this.rentalRepository.save(rental);
    }

    async updateCancelReason(id: string, cancelReason: string): Promise<Rental> {
        const rental = await this.findOne(id);
        rental.cancelReason = cancelReason;
        return this.rentalRepository.save(rental);
    }
}
