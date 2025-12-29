import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from './entities/equipment.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class EquipmentsService {
    constructor(
        @InjectRepository(Equipment)
        private equipmentRepository: Repository<Equipment>,
        private auditLogsService: AuditLogsService,
    ) { }

    async create(createEquipmentDto: CreateEquipmentDto, userId?: string, username?: string): Promise<Equipment> {
        const equipment = this.equipmentRepository.create(createEquipmentDto);
        const savedEquipment = await this.equipmentRepository.save(equipment);

        // Log equipment creation
        if (userId && username) {
            await this.auditLogsService.log(
                userId,
                username,
                'EQUIPMENT_CREATE',
                undefined,
                JSON.stringify({ equipmentId: savedEquipment.id, name: savedEquipment.name }),
            );
        }

        return savedEquipment;
    }

    async findAll(): Promise<Equipment[]> {
        return this.equipmentRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Equipment> {
        const equipment = await this.equipmentRepository.findOne({ where: { id } });
        if (!equipment) {
            throw new NotFoundException(`Equipment with ID ${id} not found`);
        }
        return equipment;
    }

    async update(id: string, updateEquipmentDto: UpdateEquipmentDto, userId?: string, username?: string): Promise<Equipment> {
        const equipment = await this.findOne(id);
        const oldData = { ...equipment };
        Object.assign(equipment, updateEquipmentDto);
        const savedEquipment = await this.equipmentRepository.save(equipment);

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

        return savedEquipment;
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
