import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'; // NestJS core decorators
import { ConfigModule, ConfigService } from '@nestjs/config';            // จัดการ environment variables
import { TypeOrmModule } from '@nestjs/typeorm';                         // เชื่อมต่อ database
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';     // จำกัด request rate
import { APP_FILTER, APP_GUARD } from '@nestjs/core';                    // Global providers
import { envValidationSchema } from './config/env.validation';           // Validate .env file
import { AuthModule } from './auth/auth.module';                         // Module การ login/JWT
import { EquipmentsModule } from './equipments/equipments.module';       // Module อุปกรณ์
import { RentalsModule } from './rentals/rentals.module';                // Module การยืม
import { AuditLogsModule } from './audit-logs/audit-logs.module';        // Module บันทึกกิจกรรม
import { User } from './users/entities/user.entity';                     // Entity ผู้ใช้
import { Equipment } from './equipments/entities/equipment.entity';      // Entity อุปกรณ์
import { EquipmentItem } from './equipments/entities/equipment-item.entity'; // Entity ชิ้นงาน
import { Rental } from './rentals/entities/rental.entity';               // Entity การยืม
import { AuditLog } from './audit-logs/entities/audit-log.entity';       // Entity log
import { LoggerMiddleware } from './common/middleware/logger.middleware';// Log ทุก request
import { HttpExceptionFilter } from './common/filters/http-exception.filter'; // จัดการ error response
import { AppController } from './app.controller';                        // Controller หลัก
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';            // Guard ตรวจ JWT token
import { RoleGuard } from './auth/guards/role.guard';                   // Guard ตรวจ role (ADMIN/USER)
import { SeedsModule } from './database/seeds/seeds.module';            // Seed ข้อมูลเริ่มต้น

@Module({
    imports: [
        // ConfigModule - โหลดค่าจาก .env file และทำให้ใช้ได้ทั้งแอป
        ConfigModule.forRoot({
            isGlobal: true,                                              // ใช้ได้ทุก module โดยไม่ต้อง import
            validationSchema: envValidationSchema,                       // ตรวจสอบว่า .env มีครบ
            validationOptions: { abortEarly: true },                     // หยุดเมื่อเจอ error แรก
        }),

        // ThrottlerModule - ป้องกัน DDoS/Brute Force (100 req/นาที/IP)
        ThrottlerModule.forRoot([{
            ttl: 60000,                                                  // ช่วงเวลา 60 วินาที
            limit: 100,                                                  // สูงสุด 100 requests
        }]),

        // TypeOrmModule - เชื่อมต่อ PostgreSQL database
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({            // ดึงค่าจาก .env
                type: 'postgres',
                host: configService.get<string>('DB_HOST'),              // เช่น localhost
                port: configService.get<number>('DB_PORT'),              // เช่น 5432
                username: configService.get<string>('DB_USERNAME'),      // ชื่อผู้ใช้ DB
                password: configService.get<string>('DB_PASSWORD'),      // รหัสผ่าน DB
                database: configService.get<string>('DB_DATABASE'),      // ชื่อ database
                entities: [User, Equipment, EquipmentItem, Rental, AuditLog], // ตารางทั้งหมด
                autoLoadEntities: true,                                  // โหลด entity อัตโนมัติ
                synchronize: true,                                       // สร้างตารางอัตโนมัติ (dev only!)
            }),
        }),

        // Feature Modules - แต่ละ module จัดการ feature แยกกัน
        AuthModule,                                                      // Login, JWT, Guards
        EquipmentsModule,                                                // CRUD อุปกรณ์
        RentalsModule,                                                   // คำขอยืม-คืน
        AuditLogsModule,                                                 // บันทึกประวัติ
        SeedsModule,                                                     // สร้างข้อมูลเริ่มต้น
    ],
    controllers: [AppController],                                        // Controller ของ root path
    providers: [
        // Global Exception Filter - จัดรูปแบบ error response ให้เหมือนกันทุก endpoint
        { provide: APP_FILTER, useClass: HttpExceptionFilter },

        // Global Guards - ตรวจสอบทุก request ตามลำดับ:
        { provide: APP_GUARD, useClass: ThrottlerGuard },               // 1. ตรวจ rate limit
        { provide: APP_GUARD, useClass: JwtAuthGuard },                 // 2. ตรวจ JWT token
        { provide: APP_GUARD, useClass: RoleGuard },                    // 3. ตรวจ role permission
    ],
})
export class AppModule implements NestModule {
    // Middleware - รันก่อน Guards ทุก request
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*path');            // Log ทุก route
    }
}