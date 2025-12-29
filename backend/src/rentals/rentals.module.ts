import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { Rental } from './entities/rental.entity';
import { Equipment } from '../equipments/entities/equipment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Rental, Equipment])],
    controllers: [RentalsController],
    providers: [RentalsService],
    exports: [RentalsService],
})
export class RentalsModule { }
