import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(studentId: string, pass: string): Promise<any> {
    // 1. Check what is coming in
    console.log(`--- Login Attempt ---`);
    console.log(`Input StudentID: "${studentId}"`);
    console.log(`Input Password: "${pass}"`);

    const user = await this.usersService.findOneByStudentId(studentId);

    // 2. Check if user exists in DB
    if (!user) {
      console.log('❌ User not found in Database');
      return null;
    }
    console.log('✅ User found in Database:', user.studentId);
    console.log('Stored Hashed Password:', user.password);

    // 3. Check password match
    const isMatch = await bcrypt.compare(pass, user.password);
    console.log(`Password Match Result: ${isMatch}`);

    if (isMatch) {
      const { password, ...result } = user;
      return result;
    }
    
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id, studentId: user.studentId, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}