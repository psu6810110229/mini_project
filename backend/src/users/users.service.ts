import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { studentId, name, password, role } = createUserDto;

    // Hash Password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Instance
    const user = this.usersRepository.create({
      studentId,
      name,
      password: hashedPassword,
      role,
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      if (error.code === '23505') { // Postgres Unique Violation
        throw new ConflictException(`Student ID "${studentId}" already exists`);
      }
      throw new InternalServerErrorException();
    }
  }

  async findOneByStudentId(studentId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { studentId } });
  }

  async findOneById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }
}