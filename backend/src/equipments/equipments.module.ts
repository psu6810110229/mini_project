import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentsService } from './equipments.service';
import { EquipmentsController } from './equipments.controller';
import { Equipment } from './entities/equipment.entity';
import { EquipmentItem } from './entities/equipment-item.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
    imports: [TypeOrmModule.forFeature([Equipment, EquipmentItem]), AuditLogsModule],
    controllers: [EquipmentsController],
    providers: [EquipmentsService],
    exports: [EquipmentsService],
})
export class EquipmentsModule { }

