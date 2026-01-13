import { NestFactory } from '@nestjs/core';                        // สร้าง NestJS application instance
import { AppModule } from './app.module';                          // Root module ของแอป
import { ValidationPipe } from '@nestjs/common';                   // Pipe สำหรับ validate DTO
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';  // สร้าง API documentation

async function bootstrap() {
  const app = await NestFactory.create(AppModule);                 // สร้างแอปจาก AppModule

  // 1. Enable CORS - อนุญาตให้ frontend (React) เข้าถึง API ได้
  app.enableCors({
    origin: true,                                                   // อนุญาตทุก origin (dev mode)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',                     // HTTP methods ที่อนุญาต
    credentials: true,                                              // อนุญาต cookies/auth headers
  });

  // 2. Set Global Prefix - ทุก route จะมี /api นำหน้า
  app.setGlobalPrefix('api');                                       // เช่น /api/auth/login

  // 3. Validation Pipes - ตรวจสอบ DTO ทุก request อัตโนมัติ
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                                              // ลบ field ที่ไม่ได้ประกาศใน DTO
      forbidNonWhitelisted: true,                                   // Error ถ้ามี field แปลกปลอม
      transform: true,                                              // แปลง type อัตโนมัติ (string→Date)
    }),
  );

  // 4. Setup Swagger - สร้างหน้า API Documentation ที่ /docs
  const config = new DocumentBuilder()
    .setTitle('Gear Rental API')                                    // ชื่อ API
    .setDescription('The Gear Rental API description')              // คำอธิบาย
    .setVersion('1.0')                                              // เวอร์ชัน
    .addBearerAuth()                                                // เพิ่มปุ่ม Authorize สำหรับ JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);      // สร้าง OpenAPI spec
  SwaggerModule.setup('docs', app, document);                      // ให้เข้าถึงที่ /docs

  await app.listen(3000);                                           // รันที่ port 3000
  console.log(`Application is running on: ${await app.getUrl()}/api`);
}
bootstrap();                                                        // เริ่มต้นแอป
