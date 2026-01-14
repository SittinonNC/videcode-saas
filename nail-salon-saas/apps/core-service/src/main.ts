import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { CoreModule } from './core.module';
import { createRedisOptions } from '@app/common';

async function bootstrap() {
  const logger = new Logger('CoreService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CoreModule,
    createRedisOptions('core-service'),
  );

  await app.listen();
  logger.log('📋 Core Service is listening on Redis transport');
}

bootstrap();
