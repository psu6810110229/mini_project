import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rental } from './entities/rental.entity';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalStatusDto } from './dto/update-rental-status.dto';
import { RentalStatus, EquipmentItemStatus } from '../common/enums';
import { EquipmentItem } from '../equipments/entities/equipment-item.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RentalValidationService } from './rental-validation.service';
import { RentalStockService } from './rental-stock.service';

@Injectable()
export class RentalsService {
    constructor(
        @InjectRepository(Rental) private rentalRepository: Repository<Rental>,           // เข้าถึงตาราง rentals
        @InjectRepository(EquipmentItem) private equipmentItemRepository: Repository<EquipmentItem>,
        private auditLogsService: AuditLogsService,                                         // บันทึก log
        private validationService: RentalValidationService,                                 // ตรวจ overlap + state
        private stockService: RentalStockService,                                           // จัดการ stock
    ) { }

    // ===== สร้างคำขอยืมใหม่ =====
    async create(userId: string, createRentalDto: CreateRentalDto): Promise<Rental> {
        const { equipmentId, equipmentItemId, startDate, endDate, requestDetails, attachmentUrl, allowOverlap } = createRentalDto;
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validation 1: วันสิ้นสุดต้องมาหลังวันเริ่มต้น
        if (start >= end) throw new BadRequestException('End date must be after start date');
        // Validation 2: วันเริ่มต้นต้องไม่เป็นอดีต
        if (start < new Date()) throw new BadRequestException('Start date cannot be in the past');

        // Validation 3: ถ้าระบุ item เฉพาะ ต้องพร้อมใช้งาน
        if (equipmentItemId) {
            const item = await this.equipmentItemRepository.findOne({ where: { id: equipmentItemId } });
            if (!item) throw new NotFoundException('Equipment item not found');
            if (item.status !== EquipmentItemStatus.AVAILABLE) throw new BadRequestException('This item is not available for rental');
        }

        // ยกเลิกคำขอเก่าที่ซ้ำซ้อนอัตโนมัติ (แทนที่จะ error)
        await this.handleDuplicateRequests(userId, equipmentId, start, end, equipmentItemId);

        // ตรวจ overlap กับคนอื่น (ถ้าไม่อนุญาต overlap)
        if (!allowOverlap) {
            const hasOverlap = await this.validationService.checkOverlapExcludingUser(equipmentId, start, end, userId, equipmentItemId);
            if (hasOverlap) throw new BadRequestException('Equipment is already booked for this period');
        }

        // สร้าง rental ใหม่ สถานะ PENDING
        const rental = await this.rentalRepository.save(this.rentalRepository.create({
            userId, equipmentId, equipmentItemId, startDate: start, endDate: end, requestDetails, attachmentUrl, status: RentalStatus.PENDING,
        }));

        // บันทึก audit log
        await this.auditLogsService.log(userId, 'User', 'RENTAL_CREATE', rental.id, JSON.stringify({ equipmentId, equipmentItemId, startDate, endDate }));
        return rental;
    }

    // ===== ยกเลิกคำขอซ้ำซ้อนเก่าอัตโนมัติ =====
    private async handleDuplicateRequests(userId: string, equipmentId: string, start: Date, end: Date, equipmentItemId?: string) {
        const query = this.rentalRepository.createQueryBuilder('rental')
            .where('rental.userId = :userId', { userId })                                   // ของ user เดียวกัน
            .andWhere('rental.equipmentId = :equipmentId', { equipmentId })                 // equipment เดียวกัน
            .andWhere('rental.status = :status', { status: RentalStatus.PENDING })          // ยังรอพิจารณา
            .andWhere('rental.startDate < :endDate', { endDate: end })                      // ช่วงเวลาซ้อน
            .andWhere('rental.endDate > :startDate', { startDate: start });

        if (equipmentItemId) query.andWhere('rental.equipmentItemId = :equipmentItemId', { equipmentItemId });

        const duplicates = await query.getMany();
        for (const dup of duplicates) {
            dup.status = RentalStatus.CANCELLED;                                             // ยกเลิกคำขอเก่า
            await this.rentalRepository.save(dup);
            await this.auditLogsService.log(userId, 'User', 'RENTAL_AUTO_CANCELLED', dup.id, JSON.stringify({ reason: 'Replaced by new request', newDates: { start, end } }));
        }
    }

    // ===== อัปเดตสถานะคำขอยืม (PENDING → APPROVED → CHECKED_OUT → RETURNED) =====
    async updateStatus(id: string, updateStatusDto: UpdateRentalStatusDto): Promise<Rental & { autoRejectedRentals?: string[] }> {
        const rental = await this.findOne(id);
        const { status: newStatus } = updateStatusDto;

        // ตรวจสอบว่าเปลี่ยนสถานะได้หรือไม่ (State Machine)
        this.validationService.validateStatusTransition(rental.status, newStatus);

        // ถ้าอนุมัติ → auto-reject คำขออื่นที่ซ้อนทับ
        let autoRejectedRentals: string[] = [];
        if (newStatus === RentalStatus.APPROVED && rental.status === RentalStatus.PENDING) {
            autoRejectedRentals = await this.handleAutoRejection(rental);
        }

        // จัดการ stock (ลดเมื่อ checkout, เพิ่มเมื่อ return)
        await this.stockService.handleStockUpdate(rental, newStatus);

        // บันทึกสถานะใหม่
        const previousStatus = rental.status;
        rental.status = newStatus;
        if (newStatus === RentalStatus.REJECTED && updateStatusDto.rejectReason) rental.rejectReason = updateStatusDto.rejectReason;
        if (newStatus === RentalStatus.CANCELLED && updateStatusDto.cancelReason) rental.cancelReason = updateStatusDto.cancelReason;

        const savedRental = await this.rentalRepository.save(rental);
        await this.auditLogsService.log(rental.userId, rental.user?.name || 'Unknown', `RENTAL_STATUS_${newStatus}`, rental.id, JSON.stringify({ previousStatus, newStatus }));

        return { ...savedRental, autoRejectedRentals: autoRejectedRentals.length > 0 ? autoRejectedRentals : undefined };
    }

    // ===== Auto-reject คำขออื่นที่ซ้อนทับ =====
    private async handleAutoRejection(rental: Rental): Promise<string[]> {
        const overlappingRentals = await this.validationService.getOverlappingRentals(rental.equipmentId, rental.startDate, rental.endDate, rental.equipmentItemId);
        const rejectedNames: string[] = [];

        for (const other of overlappingRentals) {
            if (other.id === rental.id || other.status !== RentalStatus.PENDING) continue; // ข้ามตัวเอง และ non-PENDING

            other.status = RentalStatus.REJECTED;
            await this.rentalRepository.save(other);
            rejectedNames.push(`${other.user?.name || 'Unknown'} (${other.user?.studentId || 'N/A'})`);

            await this.auditLogsService.log(other.userId, other.user?.name || 'Unknown', 'RENTAL_AUTO_REJECTED', other.id, JSON.stringify({ reason: 'Overlapping rental approved', approvedRentalId: rental.id }));
        }
        return rejectedNames;
    }

    // ===== Query helper สำหรับ overlap =====
    async getOverlappingRentals(equipmentId: string, startDate: Date, endDate: Date, equipmentItemId?: string): Promise<Rental[]> {
        return this.validationService.getOverlappingRentals(equipmentId, startDate, endDate, equipmentItemId);
    }

    // ===== ดึงคำขอทั้งหมด (Admin) =====
    async findAll(): Promise<Rental[]> {
        return this.rentalRepository.find({ relations: ['user', 'equipment', 'equipmentItem'], order: { createdAt: 'DESC' } });
    }

    // ===== ดึงคำขอของ user คนเดียว =====
    async findByUser(userId: string): Promise<Rental[]> {
        return this.rentalRepository.find({ where: { userId }, relations: ['equipment', 'equipmentItem'], order: { createdAt: 'DESC' } });
    }

    // ===== ดึงคำขอที่ active ของอุปกรณ์หนึ่ง =====
    async findActiveByEquipment(equipmentId: string): Promise<Rental[]> {
        return this.rentalRepository.createQueryBuilder('rental')
            .leftJoinAndSelect('rental.equipmentItem', 'equipmentItem').leftJoinAndSelect('rental.user', 'user')
            .where('rental.equipmentId = :equipmentId', { equipmentId })
            .andWhere('rental.status IN (:...statuses)', { statuses: [RentalStatus.PENDING, RentalStatus.APPROVED, RentalStatus.CHECKED_OUT] })
            .orderBy('rental.startDate', 'ASC').getMany();                                  // เรียงตามวันเริ่ม
    }

    // ===== ดึงคำขอเดียว (by ID) =====
    async findOne(id: string): Promise<Rental> {
        const rental = await this.rentalRepository.findOne({ where: { id }, relations: ['user', 'equipment', 'equipmentItem'] });
        if (!rental) throw new NotFoundException(`Rental with ID ${id} not found`);
        return rental;
    }

    // ===== อัปโหลดรูปหลักฐาน (checkout/return) =====
    async uploadImage(id: string, imageType: 'checkout' | 'return', imageUrl: string, note?: string): Promise<Rental> {
        const rental = await this.findOne(id);
        if (imageType === 'checkout') { rental.checkoutImageUrl = imageUrl; if (note) rental.checkoutNote = note; }
        else { rental.returnImageUrl = imageUrl; if (note) rental.returnNote = note; }
        return this.rentalRepository.save(rental);
    }

    // ===== อัปเดตเหตุผลยกเลิก =====
    async updateCancelReason(id: string, cancelReason: string): Promise<Rental> {
        const rental = await this.findOne(id);
        rental.cancelReason = cancelReason;
        return this.rentalRepository.save(rental);
    }
}
