import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { PAYMENT_PATTERNS } from '@app/common';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern(PAYMENT_PATTERNS.CREATE_BOOKING_PAYMENT)
  async createBookingPayment(
    @Payload() payload: { tenantId: string; data: { bookingId: string; paymentMethod: string } },
  ) {
    try {
      this.logger.log(`Creating booking payment for: ${payload.data.bookingId}`);
      return await this.paymentService.createBookingPayment(
        payload.tenantId,
        payload.data.bookingId,
        payload.data.paymentMethod,
      );
    } catch (error) {
      throw new RpcException({
        code: error.code || 'CREATE_PAYMENT_FAILED',
        message: error.message,
      });
    }
  }

  @MessagePattern(PAYMENT_PATTERNS.CREATE_PLATFORM_PAYMENT)
  async createPlatformPayment(
    @Payload()
    payload: {
      tenantId: string;
      data: { plan: string; paymentMethod: string; months?: number };
    },
  ) {
    try {
      this.logger.log(`Creating platform payment for tenant: ${payload.tenantId}`);
      return await this.paymentService.createPlatformPayment(
        payload.tenantId,
        payload.data.plan,
        payload.data.paymentMethod,
        payload.data.months,
      );
    } catch (error) {
      throw new RpcException({
        code: error.code || 'CREATE_PLATFORM_PAYMENT_FAILED',
        message: error.message,
      });
    }
  }

  @MessagePattern(PAYMENT_PATTERNS.GET_PAYMENT_STATUS)
  async getPaymentStatus(@Payload() payload: { tenantId: string; referenceNo: string }) {
    try {
      return await this.paymentService.getPaymentStatus(payload.referenceNo);
    } catch (error) {
      throw new RpcException({ code: 'PAYMENT_NOT_FOUND', message: error.message });
    }
  }

  @MessagePattern(PAYMENT_PATTERNS.GENERATE_QR)
  async generateQR(@Payload() payload: { tenantId: string; referenceNo: string }) {
    try {
      return await this.paymentService.generateQRCode(payload.referenceNo);
    } catch (error) {
      throw new RpcException({ code: 'GENERATE_QR_FAILED', message: error.message });
    }
  }

  @MessagePattern(PAYMENT_PATTERNS.PROCESS_REFUND)
  async processRefund(
    @Payload() payload: { tenantId: string; referenceNo: string; amount?: number; reason: string },
  ) {
    try {
      this.logger.log(`Processing refund for: ${payload.referenceNo}`);
      return await this.paymentService.processRefund(
        payload.referenceNo,
        payload.reason,
        payload.amount,
      );
    } catch (error) {
      throw new RpcException({ code: 'REFUND_FAILED', message: error.message });
    }
  }
}
