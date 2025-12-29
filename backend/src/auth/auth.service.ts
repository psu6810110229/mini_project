import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>, // Inject Repository มาแทน PrismaService
    private jwtService: JwtService,
  ) {}

  async register(data: any) {
    const existing = await this.userRepository.findOne({ where: { studentId: data.studentId } });
    if (existing) throw new ConflictException('Student ID already exists');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = this.userRepository.create({
      studentId: data.studentId,
      name: data.name,
      password: hashedPassword,
      role: 'USER',
    });
    return this.userRepository.save(newUser);
  }

  async login(data: any) {
    const user = await this.userRepository.findOne({ where: { studentId: data.studentId } });
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        studentId: user.studentId,
        role: user.role,
      },
    };
  }
}