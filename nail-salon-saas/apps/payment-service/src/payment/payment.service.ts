import { Injectable, Logger } from '@nestjs/common';
import {
  PrismaService,
  SUBSCRIPTION_PRICING,
  PaymentMethod,
  PaymentStatus,
  SubscriptionPlan,
  BookingStatus,
} from '@app/common';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';
import { StripeService } from './stripe.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Create payment for a booking (B2C)
   */
  async createBookingPayment(tenantId: string, bookingId: string, paymentMethod: string) {
    // Get booking
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
      include: { payment: true },
    });

    if (!booking) {
      throw { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' };
    }

    if (booking.payment) {
      throw { code: 'PAYMENT_EXISTS', message: 'Payment already exists for this booking' };
    }

    const referenceNo = this.generateReferenceNo('BP');
    const amount = Number(booking.totalAmount);
    const method = paymentMethod as PaymentMethod;

    // Create payment record
    const payment = await this.prisma.bookingPayment.create({
      data: {
        bookingId,
        amount: new Decimal(amount),
        currency: 'THB',
        referenceNo,
        paymentMethod: method,
        status: PaymentStatus.PENDING,
      },
    });

    // Generate payment URL/QR based on method
    let paymentDetails: {
      referenceNo: string;
      amount: number;
      qrCodeUrl?: string;
      redirectUrl?: string;
      paymentIntentId?: string;
      clientSecret?: string | null;
    } = { referenceNo, amount };

    if (method === PaymentMethod.PROMPTPAY || method === PaymentMethod.QR_CODE) {
      const stripeResult = await this.stripeService.createPromptPayPayment(referenceNo, amount);
      await this.prisma.bookingPayment.update({
        where: { id: payment.id },
        data: {
          paymentIntentId: stripeResult.paymentIntentId,
          clientSecret: stripeResult.clientSecret,
        },
      });
      paymentDetails = {
        ...paymentDetails,
        paymentIntentId: stripeResult.paymentIntentId,
        clientSecret: stripeResult.clientSecret,
      };
    } else if (method === PaymentMethod.CREDIT_CARD) {
      const stripeResult = await this.stripeService.createCardPayment(referenceNo, amount);
      paymentDetails = {
        ...paymentDetails,
        paymentIntentId: stripeResult.paymentIntentId,
        clientSecret: stripeResult.clientSecret,
      };
    }

    this.logger.log(`Booking payment created: ${referenceNo}`);

    return {
      id: payment.id,
      ...paymentDetails,
      status: PaymentStatus.PENDING,
    };
  }

  /**
   * Create platform subscription payment (B2B)
   */
  async createPlatformPayment(tenantId: string, plan: string, paymentMethod: string, months = 1) {
    const subscriptionPlan = plan as SubscriptionPlan;
    const monthlyPrice = SUBSCRIPTION_PRICING[subscriptionPlan];
    const amount = monthlyPrice * months;

    if (amount === 0) {
      throw { code: 'INVALID_PLAN', message: 'Cannot create payment for free plan' };
    }

    const referenceNo = this.generateReferenceNo('PP');
    const method = paymentMethod as PaymentMethod;

    // Calculate subscription period
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + months);

    const payment = await this.prisma.platformPayment.create({
      data: {
        tenantId,
        amount: new Decimal(amount),
        currency: 'THB',
        referenceNo,
        paymentMethod: method,
        status: PaymentStatus.PENDING,
        periodStart,
        periodEnd,
        metadata: { plan: subscriptionPlan, months },
      },
    });

    let paymentDetails: {
      referenceNo: string;
      amount: number;
      qrCodeUrl?: string;
      redirectUrl?: string;
      paymentIntentId?: string;
      clientSecret?: string | null;
    } = { referenceNo, amount };

    if (method === PaymentMethod.PROMPTPAY || method === PaymentMethod.QR_CODE) {
      const stripeResult = await this.stripeService.createPromptPayPayment(referenceNo, amount);
      paymentDetails = {
        ...paymentDetails,
        paymentIntentId: stripeResult.paymentIntentId,
        clientSecret: stripeResult.clientSecret,
      };
    } else if (method === PaymentMethod.CREDIT_CARD) {
      const stripeResult = await this.stripeService.createCardPayment(referenceNo, amount);
      paymentDetails = {
        ...paymentDetails,
        paymentIntentId: stripeResult.paymentIntentId,
        clientSecret: stripeResult.clientSecret,
      };
    }

    this.logger.log(`Platform payment created: ${referenceNo} for ${plan} x ${months} months`);

    return {
      id: payment.id,
      ...paymentDetails,
      status: PaymentStatus.PENDING,
      periodStart,
      periodEnd,
    };
  }

  /**
   * Get payment status by reference number
   */
  async getPaymentStatus(referenceNo: string) {
    // Check booking payments first
    type PaymentRecord = {
      id: string;
      referenceNo: string;
      amount: unknown;
      currency: string;
      paymentMethod: string;
      status: string;
      paidAt: Date | null;
      bookingId?: string;
    };
    let payment: PaymentRecord | null = await this.prisma.bookingPayment.findUnique({
      where: { referenceNo },
    });

    if (!payment) {
      // Then check platform payments
      payment = await this.prisma.platformPayment.findUnique({
        where: { referenceNo },
      });
    }

    if (!payment) {
      throw new Error('Payment not found');
    }

    return {
      id: payment.id,
      referenceNo: payment.referenceNo,
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      paidAt: payment.paidAt,
    };
  }

  /**
   * Generate QR code for existing payment
   */
  async generateQRCode(referenceNo: string) {
    const payment = await this.prisma.bookingPayment.findUnique({
      where: { referenceNo },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw { code: 'INVALID_STATUS', message: 'Payment is no longer pending' };
    }

    const stripeResult = await this.stripeService.createPromptPayPayment(
      referenceNo,
      Number(payment.amount),
    );

    await this.prisma.bookingPayment.update({
      where: { id: payment.id },
      data: {
        paymentIntentId: stripeResult.paymentIntentId,
        clientSecret: stripeResult.clientSecret,
      },
    });

    return {
      paymentIntentId: stripeResult.paymentIntentId,
      clientSecret: stripeResult.clientSecret,
      amount: Number(payment.amount),
    };
  }

  /**
   * Process refund
   */
  async processRefund(referenceNo: string, reason: string, amount?: number) {
    const payment = await this.prisma.bookingPayment.findUnique({
      where: { referenceNo },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw { code: 'INVALID_STATUS', message: 'Can only refund completed payments' };
    }

    const refundAmount = amount || Number(payment.amount);

    // Call Stripe refund API
    if (!payment.paymentIntentId) {
      throw { code: 'PAYMENT_INTENT_MISSING', message: 'Payment Intent ID not found' };
    }

    await this.stripeService.processRefund(payment.paymentIntentId, refundAmount);

    // Update payment status
    await this.prisma.bookingPayment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
        metadata: { refundReason: reason, refundAmount },
      },
    });

    this.logger.log(`Refund processed: ${referenceNo} for ${refundAmount} THB`);

    return { success: true, refundAmount };
  }

  /**
   * Handle webhook from GB Prime Pay
   */
  async handleWebhook(data: {
    referenceNo: string;
    resultCode: string;
    transactionId?: string;
    amount: string;
  }) {
    this.logger.log(`Webhook received for: ${data.referenceNo}`);

    const isSuccess = data.resultCode === '00';
    const status = isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;

    // Try booking payment first
    const payment = await this.prisma.bookingPayment.findUnique({
      where: { referenceNo: data.referenceNo },
    });

    if (payment) {
      await this.prisma.bookingPayment.update({
        where: { id: payment.id },
        data: {
          status,
          transactionId: data.transactionId,
          paidAt: isSuccess ? new Date() : null,
        },
      });

      // Update booking status if payment successful
      if (isSuccess) {
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: BookingStatus.CONFIRMED },
        });
      }

      return { success: true };
    }

    // Try platform payment
    const platformPayment = await this.prisma.platformPayment.findUnique({
      where: { referenceNo: data.referenceNo },
    });

    if (platformPayment) {
      await this.prisma.platformPayment.update({
        where: { id: platformPayment.id },
        data: {
          status,
          transactionId: data.transactionId,
          paidAt: isSuccess ? new Date() : null,
        },
      });

      // Update tenant subscription if payment successful
      if (isSuccess && platformPayment.metadata) {
        const meta = platformPayment.metadata as { plan: SubscriptionPlan };
        await this.prisma.tenant.update({
          where: { id: platformPayment.tenantId },
          data: {
            subscriptionPlan: meta.plan,
            subscriptionStartAt: platformPayment.periodStart,
            subscriptionEndAt: platformPayment.periodEnd,
          },
        });
      }

      return { success: true };
    }

    throw new Error('Payment not found');
  }

  /**
   * Generate unique reference number
   */
  private generateReferenceNo(prefix: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = uuidv4().slice(0, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }
}
