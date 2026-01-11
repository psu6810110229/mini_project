import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { RentalValidationService } from './rental-validation.service';
import { RentalStockService } from './rental-stock.service';
import { Rental } from './entities/rental.entity';
import { Equipment } from '../equipments/entities/equipment.entity';
import { EquipmentItem } from '../equipments/entities/equipment-item.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
    imports: [TypeOrmModule.forFeature([Rental, Equipment, EquipmentItem]), AuditLogsModule],
    controllers: [RentalsController],
    providers: [RentalsService, RentalValidationService, RentalStockService],
    exports: [RentalsService],
})
export class RentalsModule { }

