import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global API prefix: /api/v1 (excluding health root and swagger endpoints)
  app.setGlobalPrefix('api/v1', {
    exclude: ['/', 'api/docs', 'api/docs-json'],
  });

  // CORS configuration for frontend origin
  const frontendUrl =
    configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global request validation pipe using class-validator and class-transformer
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Commit API')
    .setDescription(
      'Commit Backend Foundation & Authentication API for Learners and Mentors',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT Bearer token',
        in: 'header',
      },
      'bearer',
    )
    .addTag('auth', 'Authentication and profile management')
    .addTag('users', 'User profile endpoints')
    .addTag('goals', 'Goal creation and management')
    .addTag('topics', 'Topic and prerequisite management')
    .addTag('sessions', 'Study session logging')
    .addTag('progress', 'Progress summaries and analytics')
    .addTag('mentor', 'Mentor learner tracking')
    .addTag('settings', 'System settings')
    .addTag('health', 'Application health status')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`🚀 Commit Backend API is running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger documentation available at: http://localhost:${port}/api/docs`);
}

void bootstrap();
