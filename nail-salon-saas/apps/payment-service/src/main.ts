import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { PaymentModule } from './payment.module';
import { createRedisOptions } from '@app/common';

async function bootstrap() {
  const logger = new Logger('PaymentService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentModule,
    createRedisOptions('payment-service'),
  );

  await app.listen();
  logger.log('💳 Payment Service is listening on Redis transport');
}

bootstrap();
