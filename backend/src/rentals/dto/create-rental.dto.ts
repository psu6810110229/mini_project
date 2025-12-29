import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRentalDto {
    @ApiProperty({ example: 'uuid-of-equipment' })
    @IsUUID()
    equipmentId: string;

    @ApiProperty({ example: '2024-01-15T09:00:00Z' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ example: '2024-01-17T18:00:00Z' })
    @IsDateString()
    endDate: string;

    @ApiPropertyOptional({ example: 'ต้องการใช้ถ่ายงานอีเวนต์' })
    @IsOptional()
    @IsString()
    requestDetails?: string;

    @ApiPropertyOptional({ example: 'https://example.com/attachment.jpg' })
    @IsOptional()
    @IsString()
    attachmentUrl?: string;
}
