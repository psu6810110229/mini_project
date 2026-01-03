import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rental } from './entities/rental.entity';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalStatusDto } from './dto/update-rental-status.dto';
import { RentalStatus, EquipmentStatus, EquipmentItemStatus } from '../common/enums';
import { Equipment } from '../equipments/entities/equipment.entity';
import { EquipmentItem } from '../equipments/entities/equipment-item.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class RentalsService {
    constructor(
        @InjectRepository(Rental)
        private rentalRepository: Repository<Rental>,
        @InjectRepository(Equipment)
        private equipmentRepository: Repository<Equipment>,
        @InjectRepository(EquipmentItem)
        private equipmentItemRepository: Repository<EquipmentItem>,
        private auditLogsService: AuditLogsService,
    ) { }

    async create(userId: string, createRentalDto: CreateRentalDto): Promise<Rental> {
        const { equipmentId, equipmentItemId, startDate, endDate, requestDetails, attachmentUrl, allowOverlap } = createRentalDto;

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate dates
        if (start >= end) {
            throw new BadRequestException('End date must be after start date');
        }

        if (start < new Date()) {
            throw new BadRequestException('Start date cannot be in the past');
        }

        // If equipmentItemId is provided, check if item is available
        if (equipmentItemId) {
            const item = await this.equipmentItemRepository.findOne({ where: { id: equipmentItemId } });
            if (!item) {
                throw new NotFoundException('Equipment item not found');
            }
            if (item.status !== EquipmentItemStatus.AVAILABLE) {
                throw new BadRequestException('This item is not available for rental');
            }
        }

        // Check for overlapping rentals (skip if user explicitly allows overlap)
        if (!allowOverlap) {
            const hasOverlap = await this.checkOverlap(equipmentId, start, end, undefined, equipmentItemId);
            if (hasOverlap) {
                throw new BadRequestException('Equipment is already booked for this period');
            }
        }

        const rental = this.rentalRepository.create({
            userId,
            equipmentId,
            equipmentItemId,
            startDate: start,
            endDate: end,
            requestDetails,
            attachmentUrl,
            status: RentalStatus.PENDING,
        });

        const savedRental = await this.rentalRepository.save(rental);

        // Log rental creation
        await this.auditLogsService.log(
            userId,
            'User',
            'RENTAL_CREATE',
            savedRental.id,
            JSON.stringify({ equipmentId, equipmentItemId, startDate, endDate }),
        );

        return savedRental;
    }

    async checkOverlap(equipmentId: string, startDate: Date, endDate: Date, excludeRentalId?: string, equipmentItemId?: string): Promise<boolean> {
        const queryBuilder = this.rentalRepository
            .createQueryBuilder('rental')
            .where('rental.equipmentId = :equipmentId', { equipmentId })
            .andWhere('rental.status NOT IN (:...excludedStatuses)', {
                excludedStatuses: [RentalStatus.RETURNED, RentalStatus.REJECTED, RentalStatus.CANCELLED],
            })
            .andWhere('rental.startDate < :endDate', { endDate })
            .andWhere('rental.endDate > :startDate', { startDate });

        // If checking a specific item, only check overlaps for that item
        if (equipmentItemId) {
            queryBuilder.andWhere('rental.equipmentItemId = :equipmentItemId', { equipmentItemId });
        }

        if (excludeRentalId) {
            queryBuilder.andWhere('rental.id != :excludeRentalId', { excludeRentalId });
        }

        const count = await queryBuilder.getCount();
        return count > 0;
    }

    async getOverlappingRentals(equipmentId: string, startDate: Date, endDate: Date, equipmentItemId?: string): Promise<Rental[]> {
        const queryBuilder = this.rentalRepository
            .createQueryBuilder('rental')
            .leftJoinAndSelect('rental.user', 'user')
            .leftJoinAndSelect('rental.equipment', 'equipment')
            .where('rental.equipmentId = :equipmentId', { equipmentId })
            .andWhere('rental.status IN (:...activeStatuses)', {
                activeStatuses: [RentalStatus.PENDING, RentalStatus.APPROVED, RentalStatus.CHECKED_OUT],
            })
            .andWhere('rental.startDate < :endDate', { endDate })
            .andWhere('rental.endDate > :startDate', { startDate });

        // If checking a specific item, only check overlaps for that item
        if (equipmentItemId) {
            queryBuilder.andWhere('rental.equipmentItemId = :equipmentItemId', { equipmentItemId });
        }

        return queryBuilder.orderBy('rental.startDate', 'ASC').getMany();
    }

    async findAll(): Promise<Rental[]> {
        return this.rentalRepository.find({
            relations: ['user', 'equipment', 'equipmentItem'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByUser(userId: string): Promise<Rental[]> {
        return this.rentalRepository.find({
            where: { userId },
            relations: ['equipment', 'equipmentItem'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Rental> {
        const rental = await this.rentalRepository.findOne({
            where: { id },
            relations: ['user', 'equipment', 'equipmentItem'],
        });
        if (!rental) {
            throw new NotFoundException(`Rental with ID ${id} not found`);
        }
        return rental;
    }

    async updateStatus(id: string, updateStatusDto: UpdateRentalStatusDto): Promise<Rental> {
        console.log('--- UPDATE STATUS CALLED ---');
        console.log('Rental ID:', id);
        console.log('New Status:', updateStatusDto.status);

        const rental = await this.findOne(id);
        const { status: newStatus } = updateStatusDto;

        console.log('Current Rental Status:', rental.status);
        console.log('Equipment ID:', rental.equipmentId);

        this.validateStatusTransition(rental.status, newStatus);

        // Handle Stock Logic and Item Status
        if (newStatus === RentalStatus.CHECKED_OUT && rental.status !== RentalStatus.CHECKED_OUT) {
            // If there's a specific item, mark it as RENTED
            if (rental.equipmentItemId) {
                const item = await this.equipmentItemRepository.findOne({ where: { id: rental.equipmentItemId } });
                if (item) {
                    item.status = EquipmentItemStatus.RENTED;
                    await this.equipmentItemRepository.save(item);
                }
            }

            const equipment = await this.equipmentRepository.findOne({ where: { id: rental.equipmentId } });
            if (equipment) {
                if (equipment.stockQty <= 0) {
                    throw new BadRequestException('Equipment is out of stock!');
                }
                equipment.stockQty -= 1;
                if (equipment.stockQty === 0) {
                    equipment.status = EquipmentStatus.UNAVAILABLE;
                }
                await this.equipmentRepository.save(equipment);
            }
        } else if (newStatus === RentalStatus.RETURNED && rental.status !== RentalStatus.RETURNED) {
            // If there's a specific item, mark it as AVAILABLE
            if (rental.equipmentItemId) {
                const item = await this.equipmentItemRepository.findOne({ where: { id: rental.equipmentItemId } });
                if (item) {
                    item.status = EquipmentItemStatus.AVAILABLE;
                    await this.equipmentItemRepository.save(item);
                }
            }

            const equipment = await this.equipmentRepository.findOne({ where: { id: rental.equipmentId } });
            if (equipment) {
                equipment.stockQty += 1;
                if (equipment.stockQty > 0 && equipment.status === EquipmentStatus.UNAVAILABLE) {
                    equipment.status = EquipmentStatus.AVAILABLE;
                }
                await this.equipmentRepository.save(equipment);
            }
        }

        rental.status = newStatus;
        const savedRental = await this.rentalRepository.save(rental);

        // Log the status change to audit logs
        await this.auditLogsService.log(
            rental.userId,
            rental.user?.name || 'Unknown',
            `RENTAL_STATUS_${newStatus}`,
            rental.id,
            JSON.stringify({
                previousStatus: rental.status,
                newStatus,
                equipmentId: rental.equipmentId,
                equipmentItemId: rental.equipmentItemId,
                equipmentName: rental.equipment?.name,
            }),
        );

        return savedRental;
    }

    private validateStatusTransition(currentStatus: RentalStatus, newStatus: RentalStatus): void {
        const allowedTransitions: Record<RentalStatus, RentalStatus[]> = {
            [RentalStatus.PENDING]: [RentalStatus.APPROVED, RentalStatus.REJECTED, RentalStatus.CANCELLED],
            [RentalStatus.APPROVED]: [RentalStatus.CHECKED_OUT, RentalStatus.CANCELLED],
            [RentalStatus.CHECKED_OUT]: [RentalStatus.RETURNED],
            [RentalStatus.RETURNED]: [],
            [RentalStatus.REJECTED]: [],
            [RentalStatus.CANCELLED]: [],
        };

        if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
            throw new BadRequestException(
                `Cannot transition from ${currentStatus} to ${newStatus}`,
            );
        }
    }
}
