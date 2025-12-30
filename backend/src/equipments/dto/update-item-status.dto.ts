import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EquipmentItemStatus } from '../../common/enums';

export class UpdateItemStatusDto {
    @ApiProperty({ enum: EquipmentItemStatus, example: EquipmentItemStatus.AVAILABLE })
    @IsEnum(EquipmentItemStatus)
    status: EquipmentItemStatus;
}
