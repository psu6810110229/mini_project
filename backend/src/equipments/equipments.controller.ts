import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EquipmentsService } from './equipments.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Equipments')
@Controller('equipments')
export class EquipmentsController {
    constructor(private readonly equipmentsService: EquipmentsService) { }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get all equipments' })
    @ApiResponse({ status: 200, description: 'List of all equipments' })
    findAll() {
        return this.equipmentsService.findAll();
    }

    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Get equipment by ID' })
    @ApiResponse({ status: 200, description: 'Equipment details' })
    @ApiResponse({ status: 404, description: 'Equipment not found' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.equipmentsService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create new equipment (Admin only)' })
    @ApiResponse({ status: 201, description: 'Equipment created' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    create(@CurrentUser() user: User, @Body() createEquipmentDto: CreateEquipmentDto) {
        return this.equipmentsService.create(createEquipmentDto, user.id, user.name);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update equipment (Admin only)' })
    @ApiResponse({ status: 200, description: 'Equipment updated' })
    @ApiResponse({ status: 404, description: 'Equipment not found' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    update(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateEquipmentDto: UpdateEquipmentDto,
    ) {
        return this.equipmentsService.update(id, updateEquipmentDto, user.id, user.name);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete equipment (Admin only)' })
    @ApiResponse({ status: 200, description: 'Equipment deleted' })
    @ApiResponse({ status: 404, description: 'Equipment not found' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
        return this.equipmentsService.remove(id, user.id, user.name);
    }
}
