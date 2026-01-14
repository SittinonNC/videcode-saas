import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { createRedisOptions } from '@app/common';

async function bootstrap() {
  const logger = new Logger('AuthService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    createRedisOptions('auth-service'),
  );

  await app.listen();
  logger.log('🔐 Auth Service is listening on Redis transport');
}

bootstrap();
