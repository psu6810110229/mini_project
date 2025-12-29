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
import { RentalStatus, EquipmentStatus } from '../common/enums';
import { Equipment } from '../equipments/entities/equipment.entity';

@Injectable()
export class RentalsService {
    constructor(
        @InjectRepository(Rental)
        private rentalRepository: Repository<Rental>,
        @InjectRepository(Equipment)
        private equipmentRepository: Repository<Equipment>,
    ) { }

    async create(userId: string, createRentalDto: CreateRentalDto): Promise<Rental> {
        const { equipmentId, startDate, endDate, requestDetails, attachmentUrl } = createRentalDto;

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate dates
        if (start >= end) {
            throw new BadRequestException('End date must be after start date');
        }

        if (start < new Date()) {
            throw new BadRequestException('Start date cannot be in the past');
        }

        // Check for overlapping rentals (newStart < existingEnd) AND (newEnd > existingStart)
        const hasOverlap = await this.checkOverlap(equipmentId, start, end);
        if (hasOverlap) {
            throw new BadRequestException('Equipment is already booked for this period');
        }

        const rental = this.rentalRepository.create({
            userId,
            equipmentId,
            startDate: start,
            endDate: end,
            requestDetails,
            attachmentUrl,
            status: RentalStatus.PENDING,
        });

        return this.rentalRepository.save(rental);
    }

    async checkOverlap(equipmentId: string, startDate: Date, endDate: Date, excludeRentalId?: string): Promise<boolean> {
        const queryBuilder = this.rentalRepository
            .createQueryBuilder('rental')
            .where('rental.equipmentId = :equipmentId', { equipmentId })
            .andWhere('rental.status NOT IN (:...excludedStatuses)', {
                excludedStatuses: [RentalStatus.RETURNED, RentalStatus.REJECTED, RentalStatus.CANCELLED],
            })
            .andWhere('rental.startDate < :endDate', { endDate })
            .andWhere('rental.endDate > :startDate', { startDate });

        if (excludeRentalId) {
            queryBuilder.andWhere('rental.id != :excludeRentalId', { excludeRentalId });
        }

        const count = await queryBuilder.getCount();
        return count > 0;
    }

    async findAll(): Promise<Rental[]> {
        return this.rentalRepository.find({
            relations: ['user', 'equipment'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByUser(userId: string): Promise<Rental[]> {
        return this.rentalRepository.find({
            where: { userId },
            relations: ['equipment'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Rental> {
        const rental = await this.rentalRepository.findOne({
            where: { id },
            relations: ['user', 'equipment'],
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

        // Handle Stock Logic
        if (newStatus === RentalStatus.CHECKED_OUT && rental.status !== RentalStatus.CHECKED_OUT) {
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
        return this.rentalRepository.save(rental);
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
