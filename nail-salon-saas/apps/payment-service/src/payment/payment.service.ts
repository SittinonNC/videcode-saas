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
import { SlipOkService } from './slipok.service';
import { LineMessagingService } from './line-notify.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly slipOkService: SlipOkService,
    private readonly lineMessagingService: LineMessagingService,
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

    // Generate Checkout Session (Redirect Flow)
    // This supports both Card and PromptPay via the hosted payment page

    // Determine Frontend URL (assume generic if not set)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${frontendUrl}/dashboard/settings?tab=subscription&success=true&ref=${referenceNo}`;
    const cancelUrl = `${frontendUrl}/dashboard/settings?tab=subscription&canceled=true`;

    const session = await this.stripeService.createPaymentCheckoutSession(
      tenantId,
      referenceNo,
      amount,
      `Subscription: ${plan} (${months} months)`,
      successUrl,
      cancelUrl,
    );

    // Update payment with session info
    const currentMetadata = (payment.metadata as Record<string, any>) || {};
    await this.prisma.platformPayment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          ...currentMetadata,
          paymentIntentId: session.sessionId,
        },
      },
    });

    this.logger.log(`Platform payment session created: ${referenceNo}`);

    return {
      id: payment.id,
      referenceNo,
      amount,
      checkoutUrl: session.url, // This matches frontend expectation
      sessionId: session.sessionId,
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
   * Handle Stripe webhook events (checkout.session.completed, etc.)
   */
  async handleStripeWebhook(event: {
    id: string;
    type: string;
    data: { object: Record<string, unknown> };
  }) {
    this.logger.log(`Stripe webhook received: ${event.type} (${event.id})`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const referenceNo = session.client_reference_id as string;
      const paymentStatus = session.payment_status as string;

      if (!referenceNo) {
        this.logger.warn('No referenceNo in Stripe checkout session');
        return { success: false, error: 'Missing reference' };
      }

      // Find platform payment by referenceNo
      const platformPayment = await this.prisma.platformPayment.findUnique({
        where: { referenceNo },
      });

      if (!platformPayment) {
        this.logger.warn(`Platform payment not found for referenceNo: ${referenceNo}`);
        return { success: false, error: 'Payment not found' };
      }

      // Update payment status
      const isSuccess = paymentStatus === 'paid';
      const status = isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;

      await this.prisma.platformPayment.update({
        where: { id: platformPayment.id },
        data: {
          status,
          transactionId: session.id as string,
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
            subscriptionStatus: 'ACTIVE',
            subscriptionStartAt: platformPayment.periodStart,
            subscriptionEndAt: platformPayment.periodEnd,
          },
        });
        this.logger.log(
          `Subscription updated for tenant: ${platformPayment.tenantId} to plan: ${meta.plan}`,
        );
      }

      return { success: true };
    }

    // Handle other event types if needed
    this.logger.log(`Unhandled Stripe event type: ${event.type}`);
    return { success: true };
  }

  /**
   * Verify and reconcile platform payment (fallback for webhook)
   */
  async verifyPlatformPayment(referenceNo: string) {
    const payment = await this.prisma.platformPayment.findUnique({
      where: { referenceNo },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return { success: true, status: payment.status };
    }

    // Get Session ID from metadata
    const meta = (payment.metadata as Record<string, any>) || {};
    const sessionId = meta.paymentIntentId; // We stored sessionId here

    if (!sessionId) {
      throw new Error('No session ID found for this payment');
    }

    try {
      // Check Stripe Session directly
      const session = await this.stripeService.getCheckoutSession(sessionId);

      if (session.payment_status === 'paid') {
        const paymentMethodType = session.payment_method_types?.[0] || 'card';
        let paymentMethod = PaymentMethod.CREDIT_CARD;

        if (paymentMethodType.includes('promptpay')) {
          paymentMethod = PaymentMethod.PROMPTPAY;
        }

        // Update Payment
        await this.prisma.platformPayment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            paidAt: new Date(),
            paymentMethod, // Determine correct method
            transactionId: session.id,
          },
        });

        // Update Tenant
        if (meta.plan) {
          await this.prisma.tenant.update({
            where: { id: payment.tenantId },
            data: {
              subscriptionPlan: meta.plan,
              subscriptionStatus: 'ACTIVE',
              subscriptionStartAt: payment.periodStart,
              subscriptionEndAt: payment.periodEnd,
            },
          });
        }

        return { success: true, status: PaymentStatus.COMPLETED };
      }

      return { success: false, status: payment.status };
    } catch (error) {
      this.logger.error(`Verification failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get bank info for a booking (to display to customer)
   */
  async getBankInfo(tenantId: string, bookingNumber: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { bookingNumber, tenantId },
      include: { tenant: true },
    });

    if (!booking) {
      throw { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' };
    }

    const tenant = booking.tenant;

    if (!tenant.bankAccountNo || !tenant.bankAccountName || !tenant.bankName) {
      throw {
        code: 'BANK_INFO_NOT_CONFIGURED',
        message: 'Shop has not configured bank account info',
      };
    }

    return {
      bankName: tenant.bankName,
      accountNo: tenant.bankAccountNo,
      accountName: tenant.bankAccountName,
      amount: Number(booking.totalAmount),
      bookingNumber: booking.bookingNumber,
    };
  }

  /**
   * Verify slip payment for a booking (B2C bank transfer)
   */
  async verifySlipPayment(
    tenantId: string,
    bookingId: string,
    slipImageBuffer: Buffer,
    slipImageUrl: string,
  ) {
    // Get booking with tenant and customer info
    const booking = await this.prisma.booking.findFirst({
      where: { bookingNumber: bookingId, tenantId },
      include: {
        tenant: true,
        customer: true,
        payment: true,
      },
    });

    if (!booking) {
      throw { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' };
    }

    const tenant = booking.tenant;
    const expectedAmount = Number(booking.totalAmount);

    // 1. Verify slip using SlipOK API
    const verifyResult = await this.slipOkService.verifySlip(slipImageBuffer);

    if (!verifyResult.success || !verifyResult.data) {
      this.logger.warn(`Slip verification failed: ${verifyResult.error}`);
      return {
        success: false,
        error: verifyResult.error || 'สลิปไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
      };
    }

    // 2. Check for duplicate slip (transRef already used)
    const existingSlip = await this.prisma.bookingPayment.findFirst({
      where: { slipTransRef: verifyResult.data.transRef },
    });

    if (existingSlip) {
      this.logger.warn(`Duplicate slip detected: ${verifyResult.data.transRef}`);
      return {
        success: false,
        error: 'สลิปนี้ถูกใช้ไปแล้ว กรุณาใช้สลิปใหม่',
      };
    }

    // 3. Validate amount and receiver
    const validation = this.slipOkService.validateSlipData(
      verifyResult.data,
      expectedAmount,
      tenant.bankAccountName || tenant.name,
    );

    if (!validation.valid) {
      this.logger.warn(`Slip validation failed: ${validation.reason}`);
      return {
        success: false,
        error: validation.reason,
      };
    }

    // 4. Create or update payment record
    let payment = booking.payment;

    if (!payment) {
      // Create new payment record for bank transfer
      payment = await this.prisma.bookingPayment.create({
        data: {
          bookingId: booking.id,
          amount: new Decimal(expectedAmount),
          currency: 'THB',
          referenceNo: this.generateReferenceNo('BS'), // BS = Bank Slip
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          status: PaymentStatus.COMPLETED,
          slipImageUrl,
          slipTransRef: verifyResult.data.transRef,
          slipVerifiedAt: new Date(),
          paidAt: new Date(),
          transactionId: verifyResult.data.transRef,
        },
      });
    } else {
      // Update existing payment
      await this.prisma.bookingPayment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          slipImageUrl,
          slipTransRef: verifyResult.data.transRef,
          slipVerifiedAt: new Date(),
          paidAt: new Date(),
          transactionId: verifyResult.data.transRef,
        },
      });
    }

    // 5. Update booking status
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CONFIRMED },
    });

    // 6. Send LINE notification to shop owner
    if (tenant.lineUserId) {
      const customerName = `${booking.customer.firstName} ${booking.customer.lastName}`;
      await this.lineMessagingService.sendPaymentNotification(
        tenant.lineUserId,
        expectedAmount,
        customerName,
        booking.bookingNumber,
      );
    }

    this.logger.log(`Slip payment verified for booking: ${bookingId}`);

    return {
      success: true,
      paymentId: payment.id,
      amount: expectedAmount,
      transRef: verifyResult.data.transRef,
    };
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
