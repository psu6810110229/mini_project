import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../users/entities/user.entity';

@Injectable()
export class UserSeeder {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async seed() {
    // Check if admin already exists
    const adminExists = await this.usersRepository.findOne({
      where: { role: UserRole.ADMIN },
    });

    if (adminExists) {
      console.log('Admin user already exists, skipping seed...');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('123456', salt);

    // Create admin user
    const admin = this.usersRepository.create({
      studentId: '6810110001',
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    await this.usersRepository.save(admin);
    console.log('✅ Admin user seeded: studentId=6810110001, password=123456');

    // Create regular user
    const user = this.usersRepository.create({
      studentId: '6810110223',
      name: 'Regular User',
      password: hashedPassword,
      role: UserRole.USER,
    });

    await this.usersRepository.save(user);
    console.log('✅ User created: studentId=6810110223, password=123456');
  }
}
