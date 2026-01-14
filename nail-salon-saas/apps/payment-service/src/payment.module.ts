import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/common';

import { PaymentController } from './payment/payment.controller';
import { PaymentService } from './payment/payment.service';
import { GBPrimePayService } from './payment/gbprimepay.service';
import { WebhookController } from './webhook/webhook.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
  ],
  controllers: [PaymentController, WebhookController],
  providers: [PaymentService, GBPrimePayService],
})
export class PaymentModule {}
