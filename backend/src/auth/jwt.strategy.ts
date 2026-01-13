import { ExtractJwt, Strategy } from 'passport-jwt';                    // JWT Strategy จาก passport
import { PassportStrategy } from '@nestjs/passport';                     // Base class สำหรับ strategy
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';                          // อ่าน JWT_SECRET
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {           // สืบทอดจาก PassportStrategy
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,                            // เข้าถึง users table
  ) {
    const secret = configService.get<string>('JWT_SECRET');              // ดึง secret จาก .env
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),          // ดึง token จาก Authorization header
      ignoreExpiration: false,                                            // ไม่อนุญาต token หมดอายุ
      secretOrKey: secret,                                                // Secret สำหรับ verify token
    });
  }

  // validate() ถูกเรียกหลังจาก JWT ถูก verify สำเร็จ
  async validate(payload: any) {
    const { sub } = payload;                                             // sub = user.id ที่ใส่ตอน sign

    const user = await this.userRepository.findOne({
      where: { id: sub }                                                 // หา user จาก id
    });

    if (!user) {
      throw new UnauthorizedException();                                 // User ไม่พบ (อาจถูกลบ)
    }

    return user;                                                         // ส่ง user ไปใส่ใน req.user
  }
}