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

@ApiTags('Equipments')
@Controller('equipments')
export class EquipmentsController {
    constructor(private readonly equipmentsService: EquipmentsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all equipments' })
    @ApiResponse({ status: 200, description: 'List of all equipments' })
    findAll() {
        return this.equipmentsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get equipment by ID' })
    @ApiResponse({ status: 200, description: 'Equipment details' })
    @ApiResponse({ status: 404, description: 'Equipment not found' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.equipmentsService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create new equipment' })
    @ApiResponse({ status: 201, description: 'Equipment created' })
    create(@Body() createEquipmentDto: CreateEquipmentDto) {
        return this.equipmentsService.create(createEquipmentDto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update equipment' })
    @ApiResponse({ status: 200, description: 'Equipment updated' })
    @ApiResponse({ status: 404, description: 'Equipment not found' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateEquipmentDto: UpdateEquipmentDto,
    ) {
        return this.equipmentsService.update(id, updateEquipmentDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete equipment' })
    @ApiResponse({ status: 200, description: 'Equipment deleted' })
    @ApiResponse({ status: 404, description: 'Equipment not found' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.equipmentsService.remove(id);
    }
}
