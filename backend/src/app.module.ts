import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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