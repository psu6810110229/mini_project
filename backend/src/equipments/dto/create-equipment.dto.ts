import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipmentStatus } from '../../common/enums';

export class CreateEquipmentDto {
    @ApiProperty({ example: 'Canon EOS R5' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'Camera' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ example: 1, default: 1 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    stockQty?: number;

    @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @ApiPropertyOptional({ enum: EquipmentStatus, default: EquipmentStatus.AVAILABLE })
    @IsOptional()
    @IsEnum(EquipmentStatus)
    status?: EquipmentStatus;
}
