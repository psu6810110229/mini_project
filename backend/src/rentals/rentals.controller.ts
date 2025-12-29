import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalStatusDto } from './dto/update-rental-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Rentals')
@Controller('rentals')
export class RentalsController {
    constructor(private readonly rentalsService: RentalsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create new rental request' })
    @ApiResponse({ status: 201, description: 'Rental created' })
    @ApiResponse({ status: 400, description: 'Overlap or invalid dates' })
    create(@CurrentUser() user: User, @Body() createRentalDto: CreateRentalDto) {
        return this.rentalsService.create(user.id, createRentalDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all rentals (Admin)' })
    @ApiResponse({ status: 200, description: 'List of all rentals' })
    findAll() {
        return this.rentalsService.findAll();
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my rentals' })
    @ApiResponse({ status: 200, description: 'List of user rentals' })
    findMyRentals(@CurrentUser() user: User) {
        return this.rentalsService.findByUser(user.id);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get rental by ID' })
    @ApiResponse({ status: 200, description: 'Rental details' })
    @ApiResponse({ status: 404, description: 'Rental not found' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.rentalsService.findOne(id);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update rental status' })
    @ApiResponse({ status: 200, description: 'Status updated' })
    @ApiResponse({ status: 400, description: 'Invalid status transition' })
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateStatusDto: UpdateRentalStatusDto,
    ) {
        return this.rentalsService.updateStatus(id, updateStatusDto);
    }
}
