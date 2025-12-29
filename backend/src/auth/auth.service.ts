import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // 1. REGISTER
  async register(registerDto: any) {
    const { studentId, password, name } = registerDto;

    // Check if ID exists
    const existingUser = await this.userRepository.findOne({ 
      where: { studentId } 
    });
    
    if (existingUser) {
      throw new ConflictException('Student ID already exists');
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = this.userRepository.create({
      studentId,
      name,
      password: hashedPassword,
      // Role defaults to USER via Entity
    });

    try {
      await this.userRepository.save(user);
      return { message: 'User registered successfully' };
    } catch (error) {
      throw new ConflictException('Registration failed');
    }
  }

  // 2. VALIDATE (Used by LocalStrategy if you have one, or manual login)
  async validateUser(studentId: string, pass: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { studentId } });
    
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // 3. LOGIN
  async login(loginDto: any) {
    const { studentId, password } = loginDto;
    
    // Manual Validation
    const user = await this.validateUser(studentId, password);
    if (!user) {
      throw new UnauthorizedException('Invalid Student ID or Password');
    }

    // Generate Token
    const payload = { 
      username: user.studentId, 
      sub: user.id,
      role: user.role 
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: user, // Send user info back to frontend
    };
  }
}