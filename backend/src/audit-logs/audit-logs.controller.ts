import {
    Controller,
    Get,
    Param,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditLogsController {
    constructor(private readonly auditLogsService: AuditLogsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all audit logs (Admin)' })
    @ApiResponse({ status: 200, description: 'List of all audit logs' })
    findAll() {
        return this.auditLogsService.findAll();
    }

    @Get('rental/:rentalId')
    @ApiOperation({ summary: 'Get audit logs by rental ID' })
    @ApiResponse({ status: 200, description: 'Audit logs for rental' })
    findByRental(@Param('rentalId', ParseUUIDPipe) rentalId: string) {
        return this.auditLogsService.findByRental(rentalId);
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Get audit logs by user ID' })
    @ApiResponse({ status: 200, description: 'Audit logs for user' })
    findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
        return this.auditLogsService.findByUser(userId);
    }
}
