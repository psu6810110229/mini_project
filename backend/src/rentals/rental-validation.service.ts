import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rental } from './entities/rental.entity';
import { RentalStatus } from '../common/enums';

@Injectable()
export class RentalValidationService {
    constructor(
        @InjectRepository(Rental)
        private rentalRepository: Repository<Rental>,
    ) { }

    async checkOverlap(equipmentId: string, startDate: Date, endDate: Date, excludeRentalId?: string, equipmentItemId?: string): Promise<boolean> {
        const queryBuilder = this.rentalRepository
            .createQueryBuilder('rental')
            .where('rental.equipmentId = :equipmentId', { equipmentId })
            .andWhere('rental.status NOT IN (:...excludedStatuses)', {
                excludedStatuses: [RentalStatus.RETURNED, RentalStatus.REJECTED, RentalStatus.CANCELLED],
            })
            .andWhere('rental.startDate < :endDate', { endDate })
            .andWhere('rental.endDate > :startDate', { startDate });

        if (equipmentItemId) {
            queryBuilder.andWhere('rental.equipmentItemId = :equipmentItemId', { equipmentItemId });
        }

        if (excludeRentalId) {
            queryBuilder.andWhere('rental.id != :excludeRentalId', { excludeRentalId });
        }

        const count = await queryBuilder.getCount();
        return count > 0;
    }

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

        if (equipmentItemId) {
            queryBuilder.andWhere('rental.equipmentItemId = :equipmentItemId', { equipmentItemId });
        }

        const count = await queryBuilder.getCount();
        return count > 0;
    }

    validateStatusTransition(currentStatus: RentalStatus, newStatus: RentalStatus): void {
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

        if (equipmentItemId) {
            queryBuilder.andWhere('rental.equipmentItemId = :equipmentItemId', { equipmentItemId });
        }

        return queryBuilder.orderBy('rental.startDate', 'ASC').getMany();
    }
}
