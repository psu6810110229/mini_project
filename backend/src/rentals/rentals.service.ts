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

        // ============================================================
        // DUPLICATE REQUEST REPLACEMENT LOGIC
        // If same user has a PENDING request for the same equipment (or item)
        // with overlapping dates, cancel the old one and replace with new
        // ============================================================
        const existingDuplicateQuery = this.rentalRepository
            .createQueryBuilder('rental')
            .where('rental.userId = :userId', { userId })
            .andWhere('rental.equipmentId = :equipmentId', { equipmentId })
            .andWhere('rental.status = :status', { status: RentalStatus.PENDING })
            .andWhere('rental.startDate < :endDate', { endDate: end })
            .andWhere('rental.endDate > :startDate', { startDate: start });

        // If a specific item is requested, also match by item
        if (equipmentItemId) {
            existingDuplicateQuery.andWhere('rental.equipmentItemId = :equipmentItemId', { equipmentItemId });
        }

        const existingDuplicates = await existingDuplicateQuery.getMany();

        // Cancel all existing duplicate PENDING requests from this user
        if (existingDuplicates.length > 0) {
            for (const duplicate of existingDuplicates) {
                duplicate.status = RentalStatus.CANCELLED;
                await this.rentalRepository.save(duplicate);

                // Log the auto-cancellation
                await this.auditLogsService.log(
                    userId,
                    'User',
                    'RENTAL_AUTO_CANCELLED',
                    duplicate.id,
                    JSON.stringify({
                        reason: 'Replaced by new request with same/overlapping dates',
                        equipmentId,
                        equipmentItemId,
                        originalDates: { start: duplicate.startDate, end: duplicate.endDate },
                        newDates: { start, end },
                    }),
                );
            }
            console.log(`Auto-cancelled ${existingDuplicates.length} duplicate PENDING request(s) from user ${userId}`);
        }
        // ============================================================

        // Check for overlapping rentals from OTHER users (skip if user explicitly allows overlap)
        if (!allowOverlap) {
            const hasOverlap = await this.checkOverlapExcludingUser(equipmentId, start, end, userId, equipmentItemId);
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
            JSON.stringify({
                equipmentId,
                equipmentItemId,
                startDate,
                endDate,
                replacedPreviousRequests: existingDuplicates.length > 0 ? existingDuplicates.length : undefined,
            }),
        );

        return savedRental;
    }

    // New helper method: Check overlap excluding requests from the same user
    async checkOverlapExcludingUser(equipmentId: string, startDate: Date, endDate: Date, excludeUserId: string, equipmentItemId?: string): Promise<boolean> {
        const queryBuilder = this.rentalRepository
            .createQueryBuilder('rental')
            .where('rental.equipmentId = :equipmentId', { equipmentId })
            .andWhere('rental.userId != :excludeUserId', { excludeUserId })
            .andWhere('rental.status NOT IN (:...excludedStatuses)', {
                excludedStatuses: [RentalStatus.RETURNED, RentalStatus.REJECTED, RentalStatus.CANCELLED],
            })
            .andWhere('rental.startDate < :endDate', { endDate })
            .andWhere('rental.endDate > :startDate', { startDate });

        // If checking a specific item, only check overlaps for that item
        if (equipmentItemId) {
            queryBuilder.andWhere('rental.equipmentItemId = :equipmentItemId', { equipmentItemId });
        }

        const count = await queryBuilder.getCount();
        return count > 0;
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

    async findActiveByEquipment(equipmentId: string): Promise<Rental[]> {
        return this.rentalRepository
            .createQueryBuilder('rental')
            .leftJoinAndSelect('rental.equipmentItem', 'equipmentItem')
            .leftJoinAndSelect('rental.user', 'user')
            .where('rental.equipmentId = :equipmentId', { equipmentId })
            .andWhere('rental.status IN (:...activeStatuses)', {
                activeStatuses: [RentalStatus.PENDING, RentalStatus.APPROVED, RentalStatus.CHECKED_OUT],
            })
            .orderBy('rental.startDate', 'ASC')
            .getMany();
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

    async updateStatus(id: string, updateStatusDto: UpdateRentalStatusDto): Promise<Rental & { autoRejectedRentals?: string[] }> {
        console.log('--- UPDATE STATUS CALLED ---');
        console.log('Rental ID:', id);
        console.log('New Status:', updateStatusDto.status);

        const rental = await this.findOne(id);
        const { status: newStatus } = updateStatusDto;

        console.log('Current Rental Status:', rental.status);
        console.log('Equipment ID:', rental.equipmentId);

        this.validateStatusTransition(rental.status, newStatus);

        // When approving, auto-reject overlapping PENDING rentals for the same equipment item
        let autoRejectedRentals: string[] = [];
        if (newStatus === RentalStatus.APPROVED && rental.status === RentalStatus.PENDING) {
            // Find overlapping PENDING rentals
            const overlappingRentals = await this.rentalRepository
                .createQueryBuilder('r')
                .leftJoinAndSelect('r.user', 'user')
                .where('r.id != :rentalId', { rentalId: id })
                .andWhere('r.equipmentItemId = :itemId', { itemId: rental.equipmentItemId })
                .andWhere('r.status = :status', { status: RentalStatus.PENDING })
                .andWhere('r.startDate < :endDate', { endDate: rental.endDate })
                .andWhere('r.endDate > :startDate', { startDate: rental.startDate })
                .getMany();

            // Auto-reject overlapping rentals
            for (const overlapping of overlappingRentals) {
                overlapping.status = RentalStatus.REJECTED;
                await this.rentalRepository.save(overlapping);
                autoRejectedRentals.push(`${overlapping.user?.name || 'Unknown'} (${overlapping.user?.studentId || 'N/A'})`);

                // Log the auto-rejection
                await this.auditLogsService.log(
                    overlapping.userId,
                    overlapping.user?.name || 'Unknown',
                    'RENTAL_AUTO_REJECTED',
                    overlapping.id,
                    JSON.stringify({
                        reason: 'Overlapping rental was approved',
                        approvedRentalId: id,
                        equipmentItemId: rental.equipmentItemId,
                    }),
                );
            }

            if (autoRejectedRentals.length > 0) {
                console.log(`Auto-rejected ${autoRejectedRentals.length} overlapping rentals`);
            }
        }

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

        // Save reject reason if provided and status is REJECTED
        if (newStatus === RentalStatus.REJECTED && updateStatusDto.rejectReason) {
            rental.rejectReason = updateStatusDto.rejectReason;
        }

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
        // Return with auto-rejected info
        return {
            ...savedRental,
            autoRejectedRentals: autoRejectedRentals.length > 0 ? autoRejectedRentals : undefined,
        };
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
