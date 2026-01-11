import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RentalStatus } from '../../common/enums';

export class UpdateRentalStatusDto {
    @ApiProperty({ enum: RentalStatus, example: RentalStatus.APPROVED })
    @IsEnum(RentalStatus)
    status: RentalStatus;

    /** Reason for rejection (required when rejecting) */
    @ApiPropertyOptional({ description: 'Reason for rejection', example: 'Equipment not available' })
    @IsOptional()
    @IsString()
    rejectReason?: string;

    /** Reason for cancellation (required when user cancels) */
    @ApiPropertyOptional({ description: 'Reason for cancellation', example: 'No longer need the equipment' })
    @IsOptional()
    @IsString()
    cancelReason?: string;
}

