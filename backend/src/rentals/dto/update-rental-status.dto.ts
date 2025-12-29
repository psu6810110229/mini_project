import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RentalStatus } from '../../common/enums';

export class UpdateRentalStatusDto {
    @ApiProperty({ enum: RentalStatus, example: RentalStatus.APPROVED })
    @IsEnum(RentalStatus)
    status: RentalStatus;
}
