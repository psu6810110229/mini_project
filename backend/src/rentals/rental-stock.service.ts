import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from '../equipments/entities/equipment.entity';
import { EquipmentItem } from '../equipments/entities/equipment-item.entity';
import { RentalStatus, EquipmentStatus, EquipmentItemStatus } from '../common/enums';
import { Rental } from './entities/rental.entity';

/**
 * RentalStockService - จัดการ Stock และสถานะอุปกรณ์
 * 
 * เมื่อ rental เปลี่ยนสถานะ:
 * - CHECKED_OUT → ลด stock, item = RENTED
 * - RETURNED    → เพิ่ม stock, item = AVAILABLE
 */
@Injectable()
export class RentalStockService {
    constructor(
        @InjectRepository(Equipment)
        private equipmentRepository: Repository<Equipment>,                              // ตาราง equipments
        @InjectRepository(EquipmentItem)
        private equipmentItemRepository: Repository<EquipmentItem>,                      // ตาราง equipment_items
    ) { }

    // ===== จุดเริ่มต้น: เรียกจาก RentalsService.updateStatus() =====
    async handleStockUpdate(rental: Rental, newStatus: RentalStatus): Promise<void> {
        if (newStatus === RentalStatus.CHECKED_OUT && rental.status !== RentalStatus.CHECKED_OUT) {
            await this.handleCheckout(rental);                                            // ผู้ใช้มารับอุปกรณ์
        } else if (newStatus === RentalStatus.RETURNED && rental.status !== RentalStatus.RETURNED) {
            await this.handleReturn(rental);                                              // ผู้ใช้คืนอุปกรณ์
        }
    }

    // ===== เมื่อผู้ใช้มารับอุปกรณ์ (CHECKOUT) =====
    private async handleCheckout(rental: Rental): Promise<void> {
        // 1. ถ้าระบุ item เฉพาะ → เปลี่ยนสถานะ item เป็น RENTED
        if (rental.equipmentItemId) {
            const item = await this.equipmentItemRepository.findOne({ where: { id: rental.equipmentItemId } });
            if (item) {
                item.status = EquipmentItemStatus.RENTED;                                 // item ถูกยืมไปแล้ว
                await this.equipmentItemRepository.save(item);
            }
        }

        // 2. ลด stockQty ของ Equipment (จำนวนพร้อมยืม)
        const equipment = await this.equipmentRepository.findOne({ where: { id: rental.equipmentId } });
        if (equipment) {
            if (equipment.stockQty <= 0) {
                throw new BadRequestException('Equipment is out of stock!');              // Double-check ป้องกัน race condition
            }
            equipment.stockQty -= 1;                                                      // ลด stock
            if (equipment.stockQty === 0) {
                equipment.status = EquipmentStatus.UNAVAILABLE;                           // หมด stock → UNAVAILABLE
            }
            await this.equipmentRepository.save(equipment);
        }
    }

    // ===== เมื่อผู้ใช้คืนอุปกรณ์ (RETURN) =====
    private async handleReturn(rental: Rental): Promise<void> {
        // 1. ถ้ามี item เฉพาะ → เปลี่ยนกลับเป็น AVAILABLE
        if (rental.equipmentItemId) {
            const item = await this.equipmentItemRepository.findOne({ where: { id: rental.equipmentItemId } });
            if (item) {
                item.status = EquipmentItemStatus.AVAILABLE;                              // item พร้อมยืมอีกครั้ง
                await this.equipmentItemRepository.save(item);
            }
        }

        // 2. เพิ่ม stockQty ของ Equipment กลับมา
        const equipment = await this.equipmentRepository.findOne({ where: { id: rental.equipmentId } });
        if (equipment) {
            equipment.stockQty += 1;                                                      // เพิ่ม stock
            if (equipment.stockQty > 0 && equipment.status === EquipmentStatus.UNAVAILABLE) {
                equipment.status = EquipmentStatus.AVAILABLE;                             // มี stock → AVAILABLE กลับมา
            }
            await this.equipmentRepository.save(equipment);
        }
    }
}
