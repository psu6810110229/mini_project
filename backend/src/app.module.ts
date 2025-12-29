import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { EquipmentsModule } from './equipments/equipments.module';
import { RentalsModule } from './rentals/rentals.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { User } from './users/entities/user.entity';
import { Equipment } from './equipments/entities/equipment.entity';
import { Rental } from './rentals/entities/rental.entity';
import { AuditLog } from './audit-logs/entities/audit-log.entity';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppController } from './app.controller'; // <--- 1. Import this

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: envValidationSchema,
            validationOptions: {
                abortEarly: true,
            },
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('DB_HOST'),
                port: configService.get<number>('DB_PORT'),
                username: configService.get<string>('DB_USERNAME'),
                password: configService.get<string>('DB_PASSWORD'),
                database: configService.get<string>('DB_DATABASE'),
                entities: [User, Equipment, Rental, AuditLog],
                autoLoadEntities: true,
                synchronize: true,
            }),
        }),
        AuthModule,
        EquipmentsModule,
        RentalsModule,
        AuditLogsModule,
    ],
    controllers: [AppController], // <--- 2. Add this
    providers: [
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*path');
    }
}