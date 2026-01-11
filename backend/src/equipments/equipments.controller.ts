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
    UseInterceptors,
    UploadedFile,
    Res,
    BadRequestException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { EquipmentsService } from './equipments.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateItemStatusDto } from './dto/update-item-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { existsSync, mkdirSync } from 'fs';

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
}

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

    // IMPORTANT: This route MUST come BEFORE @Get(':id') to avoid 'images' being treated as an ID
    @Get('images/:filename')
    @Public()
    @SkipThrottle()
    @ApiOperation({ summary: 'Get equipment image by filename' })
    getImage(@Param('filename') filename: string, @Res() res: Response) {
        const filePath = join(uploadsDir, filename);
        if (!existsSync(filePath)) {
            return res.status(404).json({ message: 'Image not found' });
        }
        return res.sendFile(filePath);
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

    @Post(':id/upload-image')
    @UseGuards(JwtAuthGuard)
    @Roles(UserRole.ADMIN)
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
                image: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiOperation({ summary: 'Upload image for equipment (Admin only)' })
    @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
    @ApiResponse({ status: 404, description: 'Equipment not found' })
    async uploadImage(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        const imageUrl = `/api/equipments/images/${file.filename}`;
        return this.equipmentsService.update(id, { imageUrl }, user.id, user.name);
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

    @Patch('items/:itemId/status')
    @UseGuards(JwtAuthGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update individual item status (Admin only)' })
    @ApiResponse({ status: 200, description: 'Item status updated' })
    @ApiResponse({ status: 404, description: 'Item not found' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    updateItemStatus(
        @CurrentUser() user: User,
        @Param('itemId', ParseUUIDPipe) itemId: string,
        @Body() updateItemStatusDto: UpdateItemStatusDto,
    ) {
        return this.equipmentsService.updateItemStatus(itemId, updateItemStatusDto.status, user.id, user.name);
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
