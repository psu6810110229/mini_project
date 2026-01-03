import { IsString, IsOptional, IsUUID, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRentalDto {
    @ApiProperty({ example: 'uuid-of-equipment' })
    @IsUUID()
    equipmentId: string;

    @ApiPropertyOptional({ example: 'uuid-of-equipment-item' })
    @IsOptional()
    @IsUUID()
    equipmentItemId?: string;

    @ApiProperty({ example: '2025-12-30T09:00:00+07:00' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ example: '2026-01-02T18:00:00+07:00' })
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

    @ApiPropertyOptional({ example: false, description: 'Allow submission even if overlapping requests exist' })
    @IsOptional()
    @IsBoolean()
    allowOverlap?: boolean;
}

