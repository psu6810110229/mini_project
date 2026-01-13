import { Injectable, UnauthorizedException } from '@nestjs/common';     // Decorators & exceptions
import { UsersService } from '../users/users.service';                   // หา user จาก DB
import { JwtService } from '@nestjs/jwt';                                // สร้าง JWT token
import * as bcrypt from 'bcrypt';                                        // เปรียบเทียบ password hash

@Injectable()                                                            // ให้ NestJS จัดการ instance
export class AuthService {
  constructor(
    private usersService: UsersService,                                  // Inject UsersService
    private jwtService: JwtService,                                      // Inject JwtService
  ) { }

  // ตรวจสอบ studentId และ password ว่าถูกต้องหรือไม่
  async validateUser(studentId: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByStudentId(studentId); // หา user จาก studentId

    if (!user) {
      return null;                                                       // ไม่พบ user → return null
    }

    const isMatch = await bcrypt.compare(pass, user.password);          // เปรียบเทียบ password กับ hash

    if (isMatch) {
      const { password, ...result } = user;                             // ลบ password ออกจาก result
      return result;                                                    // return user ไม่มี password
    }

    return null;                                                        // password ไม่ตรง → return null
  }

  // สร้าง JWT token สำหรับ user ที่ login สำเร็จ
  async login(user: any) {
    // Payload ที่จะใส่ใน JWT token (ข้อมูลที่จำเป็นสำหรับ authorize)
    const payload = { sub: user.id, studentId: user.studentId, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),                       // Sign JWT token
      user: {                                                           // ข้อมูล user ส่งกลับ frontend
        id: user.id,
        studentId: user.studentId,
        name: user.name,
        role: user.role,
      },
    };
  }
}