import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RentalStatus } from '../../common/enums';

export class UpdateRentalStatusDto {
    @ApiProperty({ enum: RentalStatus, example: RentalStatus.APPROVED })
    @IsEnum(RentalStatus)
    status: RentalStatus;

    @ApiPropertyOptional({ description: 'Reason for rejection', example: 'Equipment not available' })
    @IsOptional()
    @IsString()
    rejectReason?: string;
}
