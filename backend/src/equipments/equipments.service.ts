import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from './entities/equipment.entity';
import { EquipmentItem } from './entities/equipment-item.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { EquipmentItemStatus } from '../common/enums';

@Injectable()
export class EquipmentsService {
    constructor(
        @InjectRepository(Equipment)
        private equipmentRepository: Repository<Equipment>,                              // ตาราง equipments
        @InjectRepository(EquipmentItem)
        private equipmentItemRepository: Repository<EquipmentItem>,                      // ตาราง equipment_items
        private auditLogsService: AuditLogsService,                                       // บันทึก audit log
    ) { }

    // ===== สร้างอุปกรณ์ใหม่ พร้อม auto-create items =====
    async create(createEquipmentDto: CreateEquipmentDto, userId?: string, username?: string): Promise<Equipment> {
        const equipment = this.equipmentRepository.create(createEquipmentDto);
        const savedEquipment = await this.equipmentRepository.save(equipment);

        // สร้าง EquipmentItem ตามจำนวน stockQty (เช่น stockQty=5 → สร้าง 5 items)
        const stockQty = createEquipmentDto.stockQty || 1;
        const items: EquipmentItem[] = [];
        for (let i = 1; i <= stockQty; i++) {
            const item = this.equipmentItemRepository.create({
                equipmentId: savedEquipment.id,
                itemCode: String(i).padStart(3, '0'),                                     // "001", "002", "003"...
                status: EquipmentItemStatus.AVAILABLE,
            });
            items.push(item);
        }
        await this.equipmentItemRepository.save(items);

        // บันทึก audit log (ถ้ามี user info)
        if (userId && username) {
            await this.auditLogsService.log(
                userId, username, 'EQUIPMENT_CREATE', undefined,
                JSON.stringify({ equipmentId: savedEquipment.id, name: savedEquipment.name, itemsCreated: stockQty }),
            );
        }

        return this.findOne(savedEquipment.id);                                           // Return พร้อม items
    }

    // ===== ดึงอุปกรณ์ทั้งหมด =====
    async findAll(): Promise<Equipment[]> {
        return this.equipmentRepository.find({
            order: { createdAt: 'DESC' },                                                 // เรียงจากใหม่ไปเก่า
            relations: ['items'],                                                         // รวม items
        });
    }

    // ===== ดึงอุปกรณ์เดียว (by ID) =====
    async findOne(id: string): Promise<Equipment> {
        const equipment = await this.equipmentRepository.findOne({
            where: { id },
            relations: ['items'],
        });
        if (!equipment) {
            throw new NotFoundException(`Equipment with ID ${id} not found`);
        }
        return equipment;
    }

    // ===== อัปเดตอุปกรณ์ =====
    async update(id: string, updateEquipmentDto: UpdateEquipmentDto, userId?: string, username?: string): Promise<Equipment> {
        const equipment = await this.findOne(id);
        const oldStockQty = equipment.stockQty;
        const newStockQty = updateEquipmentDto.stockQty;

        Object.assign(equipment, updateEquipmentDto);                                     // อัปเดต fields
        const savedEquipment = await this.equipmentRepository.save(equipment);

        // ถ้าเพิ่ม stockQty → สร้าง items เพิ่ม
        if (newStockQty && newStockQty > oldStockQty) {
            const currentMaxCode = equipment.items.length > 0
                ? Math.max(...equipment.items.map(i => parseInt(i.itemCode)))             // หา itemCode สูงสุด
                : 0;
            const itemsToAdd: EquipmentItem[] = [];
            for (let i = currentMaxCode + 1; i <= currentMaxCode + (newStockQty - oldStockQty); i++) {
                const item = this.equipmentItemRepository.create({
                    equipmentId: savedEquipment.id,
                    itemCode: String(i).padStart(3, '0'),                                 // ต่อจากเดิม
                    status: EquipmentItemStatus.AVAILABLE,
                });
                itemsToAdd.push(item);
            }
            await this.equipmentItemRepository.save(itemsToAdd);
        }

        // บันทึก audit log
        if (userId && username) {
            await this.auditLogsService.log(
                userId, username, 'EQUIPMENT_UPDATE', undefined,
                JSON.stringify({ equipmentId: id, name: equipment.name, changes: updateEquipmentDto }),
            );
        }

        return this.findOne(savedEquipment.id);
    }

    // ===== อัปเดตสถานะ item เดี่ยว (AVAILABLE/RENTED/MAINTENANCE) =====
    async updateItemStatus(itemId: string, status: EquipmentItemStatus, userId?: string, username?: string): Promise<EquipmentItem> {
        const item = await this.equipmentItemRepository.findOne({
            where: { id: itemId },
            relations: ['equipment'],
        });
        if (!item) {
            throw new NotFoundException(`Equipment item with ID ${itemId} not found`);
        }

        item.status = status;
        const savedItem = await this.equipmentItemRepository.save(item);

        // บันทึก audit log
        if (userId && username) {
            await this.auditLogsService.log(
                userId, username, 'EQUIPMENT_ITEM_STATUS_UPDATE', undefined,
                JSON.stringify({ itemId, itemCode: item.itemCode, equipmentName: item.equipment?.name, newStatus: status }),
            );
        }

        return savedItem;
    }

    // ===== ลบอุปกรณ์ (พร้อม items ถูก CASCADE delete) =====
    async remove(id: string, userId?: string, username?: string): Promise<void> {
        const equipment = await this.findOne(id);
        const equipmentName = equipment.name;
        await this.equipmentRepository.remove(equipment);                                 // Items ถูกลบตาม CASCADE

        // บันทึก audit log
        if (userId && username) {
            await this.auditLogsService.log(
                userId, username, 'EQUIPMENT_DELETE', undefined,
                JSON.stringify({ equipmentId: id, name: equipmentName }),
            );
        }
    }
}
