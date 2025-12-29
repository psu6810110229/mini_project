import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from './entities/equipment.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentsService {
    constructor(
        @InjectRepository(Equipment)
        private equipmentRepository: Repository<Equipment>,
    ) { }

    async create(createEquipmentDto: CreateEquipmentDto): Promise<Equipment> {
        const equipment = this.equipmentRepository.create(createEquipmentDto);
        return this.equipmentRepository.save(equipment);
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

    async update(id: string, updateEquipmentDto: UpdateEquipmentDto): Promise<Equipment> {
        const equipment = await this.findOne(id);
        Object.assign(equipment, updateEquipmentDto);
        return this.equipmentRepository.save(equipment);
    }

    async remove(id: string): Promise<void> {
        const equipment = await this.findOne(id);
        await this.equipmentRepository.remove(equipment);
    }
}
