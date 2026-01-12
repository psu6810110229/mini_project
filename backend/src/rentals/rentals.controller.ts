import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    ParseUUIDPipe,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalStatusDto } from './dto/update-rental-status.dto';
import { CheckOverlapDto } from './dto/check-overlap.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads');

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

    @Post('check-overlap')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check for overlapping rental requests' })
    @ApiResponse({ status: 200, description: 'Returns list of overlapping rentals' })
    async checkOverlap(@Body() checkOverlapDto: CheckOverlapDto) {
        const { equipmentId, equipmentItemId, startDate, endDate } = checkOverlapDto;
        const overlappingRentals = await this.rentalsService.getOverlappingRentals(
            equipmentId,
            new Date(startDate),
            new Date(endDate),
            equipmentItemId,
        );
        return {
            hasOverlap: overlappingRentals.length > 0,
            overlappingRentals: overlappingRentals.map(r => ({
                id: r.id,
                status: r.status,
                startDate: r.startDate,
                endDate: r.endDate,
                userName: r.user?.name || 'Unknown',
            })),
        };
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

    @Get('equipment/:equipmentId/active')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get active rentals for an equipment' })
    @ApiResponse({ status: 200, description: 'List of active rentals for the equipment' })
    async findActiveByEquipment(@Param('equipmentId', ParseUUIDPipe) equipmentId: string) {
        const rentals = await this.rentalsService.findActiveByEquipment(equipmentId);
        return rentals.map(r => ({
            id: r.id,
            status: r.status,
            startDate: r.startDate,
            endDate: r.endDate,
            equipmentItemId: r.equipmentItemId,
            itemCode: r.equipmentItem?.itemCode,
            userName: r.user?.name || 'Unknown',
        }));
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

    // ===== RENTAL IMAGE UPLOAD ENDPOINTS =====
    // These allow users to upload evidence images for checkout/return

    /**
     * Upload checkout or return image for a rental
     * @param imageType - 'checkout' or 'return'
     */
    @Post(':id/upload-image')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('image', {
        storage: diskStorage({
            destination: uploadsDir,
            filename: (_req: any, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
                const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
                callback(null, uniqueName);
            },
        }),
        fileFilter: (_req: any, file: Express.Multer.File, callback: any) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return callback(new BadRequestException('Only image files are allowed!'), false);
            }
            callback(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
        },
    }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: { type: 'string', format: 'binary' },
                imageType: { type: 'string', enum: ['checkout', 'return'] },
                note: { type: 'string' },
            },
        },
    })
    @ApiOperation({ summary: 'Upload checkout/return image for a rental' })
    async uploadImage(
        @Param('id', ParseUUIDPipe) id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { imageType: 'checkout' | 'return'; note?: string },
    ) {
        if (!file) throw new BadRequestException('No file uploaded');
        const imageUrl = `/api/equipments/images/${file.filename}`; // Reuse equipments image path
        return this.rentalsService.uploadImage(id, body.imageType, imageUrl, body.note);
    }
}

