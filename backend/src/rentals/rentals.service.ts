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
import { RentalStatus } from '../common/enums';

@Injectable()
export class RentalsService {
    constructor(
        @InjectRepository(Rental)
        private rentalRepository: Repository<Rental>,
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
        const rental = await this.findOne(id);

        this.validateStatusTransition(rental.status, updateStatusDto.status);

        rental.status = updateStatusDto.status;
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
