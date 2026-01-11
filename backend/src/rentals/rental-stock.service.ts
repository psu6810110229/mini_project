import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from '../equipments/entities/equipment.entity';
import { EquipmentItem } from '../equipments/entities/equipment-item.entity';
import { RentalStatus, EquipmentStatus, EquipmentItemStatus } from '../common/enums';
import { Rental } from './entities/rental.entity';

@Injectable()
export class RentalStockService {
    constructor(
        @InjectRepository(Equipment)
        private equipmentRepository: Repository<Equipment>,
        @InjectRepository(EquipmentItem)
        private equipmentItemRepository: Repository<EquipmentItem>,
    ) { }

    async handleStockUpdate(rental: Rental, newStatus: RentalStatus): Promise<void> {
        if (newStatus === RentalStatus.CHECKED_OUT && rental.status !== RentalStatus.CHECKED_OUT) {
            await this.handleCheckout(rental);
        } else if (newStatus === RentalStatus.RETURNED && rental.status !== RentalStatus.RETURNED) {
            await this.handleReturn(rental);
        }
    }

    private async handleCheckout(rental: Rental): Promise<void> {
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
    }

    private async handleReturn(rental: Rental): Promise<void> {
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
}
