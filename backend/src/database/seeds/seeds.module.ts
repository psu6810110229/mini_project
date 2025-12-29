import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { UserSeeder } from './user.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserSeeder],
  exports: [UserSeeder],
})
export class SeedsModule {}
