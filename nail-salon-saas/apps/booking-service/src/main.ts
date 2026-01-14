import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { BookingModule } from './booking.module';
import { createRedisOptions } from '@app/common';

async function bootstrap() {
  const logger = new Logger('BookingService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    BookingModule,
    createRedisOptions('booking-service'),
  );

  await app.listen();
  logger.log('📅 Booking Service is listening on Redis transport');
}

bootstrap();
