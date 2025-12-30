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
        private equipmentRepository: Repository<Equipment>,
        @InjectRepository(EquipmentItem)
        private equipmentItemRepository: Repository<EquipmentItem>,
        private auditLogsService: AuditLogsService,
    ) { }

    async create(createEquipmentDto: CreateEquipmentDto, userId?: string, username?: string): Promise<Equipment> {
        const equipment = this.equipmentRepository.create(createEquipmentDto);
        const savedEquipment = await this.equipmentRepository.save(equipment);

        // Auto-create items based on stockQty
        const stockQty = createEquipmentDto.stockQty || 1;
        const items: EquipmentItem[] = [];
        for (let i = 1; i <= stockQty; i++) {
            const item = this.equipmentItemRepository.create({
                equipmentId: savedEquipment.id,
                itemCode: String(i).padStart(3, '0'),
                status: EquipmentItemStatus.AVAILABLE,
            });
            items.push(item);
        }
        await this.equipmentItemRepository.save(items);

        // Log equipment creation
        if (userId && username) {
            await this.auditLogsService.log(
                userId,
                username,
                'EQUIPMENT_CREATE',
                undefined,
                JSON.stringify({ equipmentId: savedEquipment.id, name: savedEquipment.name, itemsCreated: stockQty }),
            );
        }

        // Return with items
        return this.findOne(savedEquipment.id);
    }

    async findAll(): Promise<Equipment[]> {
        return this.equipmentRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['items'],
        });
    }

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

    async update(id: string, updateEquipmentDto: UpdateEquipmentDto, userId?: string, username?: string): Promise<Equipment> {
        const equipment = await this.findOne(id);
        const oldStockQty = equipment.stockQty;
        const newStockQty = updateEquipmentDto.stockQty;

        Object.assign(equipment, updateEquipmentDto);
        const savedEquipment = await this.equipmentRepository.save(equipment);

        // Handle stockQty changes - add more items if increased
        if (newStockQty && newStockQty > oldStockQty) {
            const currentMaxCode = equipment.items.length > 0
                ? Math.max(...equipment.items.map(i => parseInt(i.itemCode)))
                : 0;
            const itemsToAdd: EquipmentItem[] = [];
            for (let i = currentMaxCode + 1; i <= currentMaxCode + (newStockQty - oldStockQty); i++) {
                const item = this.equipmentItemRepository.create({
                    equipmentId: savedEquipment.id,
                    itemCode: String(i).padStart(3, '0'),
                    status: EquipmentItemStatus.AVAILABLE,
                });
                itemsToAdd.push(item);
            }
            await this.equipmentItemRepository.save(itemsToAdd);
        }

        // Log equipment update
        if (userId && username) {
            await this.auditLogsService.log(
                userId,
                username,
                'EQUIPMENT_UPDATE',
                undefined,
                JSON.stringify({ equipmentId: id, name: equipment.name, changes: updateEquipmentDto }),
            );
        }

        return this.findOne(savedEquipment.id);
    }

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

        // Log item status update
        if (userId && username) {
            await this.auditLogsService.log(
                userId,
                username,
                'EQUIPMENT_ITEM_STATUS_UPDATE',
                undefined,
                JSON.stringify({ itemId, itemCode: item.itemCode, equipmentName: item.equipment?.name, newStatus: status }),
            );
        }

        return savedItem;
    }

    async remove(id: string, userId?: string, username?: string): Promise<void> {
        const equipment = await this.findOne(id);
        const equipmentName = equipment.name;
        await this.equipmentRepository.remove(equipment);

        // Log equipment deletion
        if (userId && username) {
            await this.auditLogsService.log(
                userId,
                username,
                'EQUIPMENT_DELETE',
                undefined,
                JSON.stringify({ equipmentId: id, name: equipmentName }),
            );
        }
    }
}
