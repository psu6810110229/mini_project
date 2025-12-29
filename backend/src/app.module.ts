import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
<<<<<<< HEAD
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
// ห้ามมี PrismaModule ตรงนี้เด็ดขาด

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // โหลด .env
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME') || 'postgres',
        password: configService.get<string>('DB_PASSWORD') || 'postgres',
        database: configService.get<string>('DB_DATABASE') || 'mini_project',
        autoLoadEntities: true, // สำคัญ: โหลด Entity อัตโนมัติ
        synchronize: true,      // สำคัญ: สร้างตารางให้อัตโนมัติ (Dev Mode)
      }),
    }),
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
=======
import { APP_FILTER } from '@nestjs/core';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { EquipmentsModule } from './equipments/equipments.module';
import { User } from './users/entities/user.entity';
import { Equipment } from './equipments/entities/equipment.entity';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

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
                entities: [User, Equipment],
                autoLoadEntities: true,
                synchronize: true,
            }),
        }),
        AuthModule,
        EquipmentsModule,
    ],
    controllers: [],
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
>>>>>>> 78d5602b44cd74991db60cbaf81a5a74f9aab441
