import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';                                                        // Hash password
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,                                           // ตาราง users
  ) { }

  // ===== สร้างผู้ใช้ใหม่ (Register) =====
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { studentId, name, password, role } = createUserDto;

    // Validation 1: ตรวจ studentId ซ้ำ
    const existingById = await this.usersRepository.findOne({ where: { studentId } });
    if (existingById) {
      throw new ConflictException(`Student ID "${studentId}" already exists`);
    }

    // Validation 2: ตรวจชื่อซ้ำ
    const existingByName = await this.usersRepository.findOne({ where: { name } });
    if (existingByName) {
      throw new ConflictException(`Username "${name}" already exists`);
    }

    // Hash Password ด้วย bcrypt (เก็บเฉพาะ hash ไม่เก็บ password จริง)
    const salt = await bcrypt.genSalt();                                                 // สร้าง salt
    const hashedPassword = await bcrypt.hash(password, salt);                            // Hash password

    // สร้าง User instance
    const user = this.usersRepository.create({
      studentId,
      name,
      password: hashedPassword,                                                          // เก็บ hash ไม่ใช่ password จริง!
      role,
    });

    try {
      return await this.usersRepository.save(user);                                      // บันทึกลง DB
    } catch (error) {
      if (error.code === '23505') {                                                      // PostgreSQL Unique Violation
        throw new ConflictException(`Student ID or Username already exists`);
      }
      throw new InternalServerErrorException();
    }
  }

  // ===== หา user จาก studentId (ใช้ตอน login) =====
  async findOneByStudentId(studentId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { studentId } });
  }

  // ===== หา user จาก id (ใช้ใน JWT validation) =====
  async findOneById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }
}