import {
    Controller,
    Get,
    Delete,
    Param,
    Body,
    UseGuards,
    ParseUUIDPipe,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditLogsController {
    constructor(
        private readonly auditLogsService: AuditLogsService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

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

    /**
     * Delete audit logs with admin password verification
     * Requires admin role and correct admin password
     */
    @Delete('clear')
    @UseGuards(RoleGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Clear audit logs (Admin only, requires password)' })
    @ApiResponse({ status: 200, description: 'Logs deleted successfully' })
    async clearLogs(
        @Body() body: { adminPassword: string; days?: number }
    ): Promise<{ deleted: number; message: string }> {
        const { adminPassword, days } = body;

        // Validate password is provided
        if (!adminPassword) {
            throw new BadRequestException('Admin password is required');
        }

        // Find any admin user and verify password
        const admin = await this.userRepository.findOne({
            where: { role: UserRole.ADMIN }
        });

        if (!admin) {
            throw new UnauthorizedException('No admin user found');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(adminPassword, admin.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid admin password');
        }

        // Delete logs based on days parameter
        let deleted: number;
        let message: string;

        if (days && days > 0) {
            // Delete logs older than X days
            deleted = await this.auditLogsService.deleteOlderThan(days);
            message = `Deleted ${deleted} logs older than ${days} days`;
        } else {
            // Delete all logs
            deleted = await this.auditLogsService.deleteAll();
            message = `Deleted all ${deleted} logs`;
        }

        return { deleted, message };
    }
}

