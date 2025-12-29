import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditLogDto {
    @ApiPropertyOptional({ example: 'uuid-of-rental' })
    @IsOptional()
    @IsUUID()
    rentalId?: string;

    @ApiProperty({ example: 'uuid-of-user' })
    @IsUUID()
    userId: string;

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    username: string;

    @ApiProperty({ example: 'CREATE_REQUEST' })
    @IsString()
    actionType: string;

    @ApiPropertyOptional({ example: 'Created rental request for Canon EOS R5' })
    @IsOptional()
    @IsString()
    details?: string;
}
