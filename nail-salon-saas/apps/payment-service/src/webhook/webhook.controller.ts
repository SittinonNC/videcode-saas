import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { PAYMENT_PATTERNS } from '@app/common';
import { PaymentService } from '../payment/payment.service';
import { GBPrimePayService } from '../payment/gbprimepay.service';

interface WebhookPayload {
  referenceNo: string;
  resultCode: string;
  amount: string;
  transactionId?: string;
  gbpReferenceNo?: string;
  currencyCode?: string;
  paymentType?: string;
  checksum: string;
}

@Controller()
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly gbPrimePayService: GBPrimePayService,
  ) {}

  @MessagePattern(PAYMENT_PATTERNS.HANDLE_WEBHOOK)
  async handleGBPrimePayWebhook(@Payload() payload: WebhookPayload) {
    try {
      this.logger.log(
        `Webhook received: ${payload.referenceNo}, resultCode: ${payload.resultCode}`,
      );

      // Verify webhook signature
      const isValid = this.gbPrimePayService.verifyWebhookSignature(payload, payload.checksum);

      if (!isValid) {
        this.logger.warn(`Invalid webhook signature for: ${payload.referenceNo}`);
        throw { code: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed' };
      }

      // Process the webhook
      const result = await this.paymentService.handleWebhook({
        referenceNo: payload.referenceNo,
        resultCode: payload.resultCode,
        transactionId: payload.transactionId || payload.gbpReferenceNo,
        amount: payload.amount,
      });

      this.logger.log(`Webhook processed successfully: ${payload.referenceNo}`);

      return result;
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      throw new RpcException({
        code: error.code || 'WEBHOOK_FAILED',
        message: error.message,
      });
    }
  }
}
