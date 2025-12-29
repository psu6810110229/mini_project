import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable CORS (Updated to explicitly allow React Frontend)
  app.enableCors({
    origin: 'http://localhost:5173', // Explicitly allow your frontend port
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2. Set Global Prefix
  // NOTE: Your API endpoint is now http://localhost:3000/api/auth/login
  app.setGlobalPrefix('api');

  // 3. Validation Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 5. Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Gear Rental API')
    .setDescription('The Gear Rental API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}/api`);
}
bootstrap();

