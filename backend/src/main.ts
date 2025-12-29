import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable CORS (สำคัญมาก: อนุญาตให้ Frontend ยิงเข้ามาได้)
  app.enableCors();

  // 2. Set Global Prefix (ทุก Route จะเป็น /api/xxx)
  app.setGlobalPrefix('api');

  // 3. Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Club Gear Rental API')
    .setDescription('The API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // เข้าผ่าน /api ได้เลย

  // 4. Validation Pipe (ตัวช่วยตรวจสอบข้อมูล)
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.API_PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}/api`);
}
bootstrap();