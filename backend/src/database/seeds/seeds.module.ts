import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { UserSeeder } from './user.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserSeeder],
  exports: [UserSeeder],
})
export class SeedsModule implements OnModuleInit {
  constructor(private readonly userSeeder: UserSeeder) { }

  async onModuleInit() {
    // Auto-run seeder when app starts
    await this.userSeeder.seed();
  }
}
