import { Module } from '@nestjs/common';                                 // NestJS module decorator
import { JwtModule } from '@nestjs/jwt';                                 // สร้าง/verify JWT token
import { ConfigModule, ConfigService } from '@nestjs/config';            // อ่านค่า .env
import { PassportModule } from '@nestjs/passport';                       // Authentication framework
import { TypeOrmModule } from '@nestjs/typeorm';                         // เข้าถึง database
import { UsersModule } from '../users/users.module';                     // ใช้ UsersService
import { AuthService } from './auth.service';                            // Business logic
import { AuthController } from './auth.controller';                      // HTTP endpoints
import { JwtStrategy } from './jwt.strategy';                            // Validate JWT
import { User } from '../users/entities/user.entity';                    // User entity

@Module({
  imports: [
    UsersModule,                                                         // ใช้สำหรับหา user จาก studentId
    ConfigModule,                                                        // อ่าน JWT_SECRET
    PassportModule.register({ defaultStrategy: 'jwt' }),                 // ใช้ JWT เป็น default strategy

    // JwtModule - ตั้งค่า JWT token generation
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');          // ดึง secret จาก .env
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is not set'); // Error ถ้าไม่มี secret
        }
        return {
          secret,                                                        // Secret key สำหรับ sign token
          signOptions: { expiresIn: '1d' },                             // Token หมดอายุใน 1 วัน
        };
      },
    }),
    TypeOrmModule.forFeature([User]),                                   // Repository สำหรับ User
  ],
  controllers: [AuthController],                                        // /auth/login, /auth/register
  providers: [AuthService, JwtStrategy],                                // Services
  exports: [AuthService, JwtStrategy, PassportModule],                  // ให้ module อื่นใช้ได้
})
export class AuthModule { }