import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UserSeeder } from './user.seeder';

async function seed() {
  const app = await NestFactory.create(AppModule);
  const userSeeder = app.get(UserSeeder);

  await userSeeder.seed();
  await app.close();

  console.log('✅ Seeding complete!');
}

seed();
