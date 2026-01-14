import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PAYMENT_PATTERNS, PaymentStatus, PrismaService } from '@app/common';
import { StripeService } from '../payment/stripe.service';

@Controller()
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  @MessagePattern(PAYMENT_PATTERNS.HANDLE_WEBHOOK)
  async handleStripeWebhook(@Payload() webhookData: any) {
    try {
      this.logger.log(`Stripe webhook received: ${webhookData.type}`);

      // Handle different Stripe webhook events
      switch (webhookData.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(webhookData.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(webhookData.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleSubscriptionPayment(webhookData.data.object);
          break;
        default:
          this.logger.log(`Unhandled webhook type: ${webhookData.type}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${(error as Error).message}`);
      throw error;
    }
  }

  private async handlePaymentSuccess(paymentIntent: any) {
    const referenceNo = paymentIntent.metadata?.referenceNo;
    if (!referenceNo) {
      this.logger.warn('No referenceNo in payment intent metadata');
      return;
    }

    // 1. Try Booking Payment
    const bookingPayment = await this.prisma.bookingPayment.findUnique({
      where: { referenceNo },
    });

    if (bookingPayment) {
      await this.prisma.bookingPayment.update({
        where: { referenceNo },
        data: {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
          transactionId: paymentIntent.id,
        },
      });
      this.logger.log(`Booking Payment succeeded: ${referenceNo}`);
      return;
    }

    // 2. Try Platform Payment
    const platformPayment = await this.prisma.platformPayment.findUnique({
      where: { referenceNo },
    });

    if (platformPayment) {
      await this.prisma.platformPayment.update({
        where: { referenceNo },
        data: {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
          transactionId: paymentIntent.id,
        },
      });

      // Update Tenant Subscription
      if (platformPayment.metadata) {
        const meta = platformPayment.metadata as any;
        if (meta.plan) {
          await this.prisma.tenant.update({
            where: { id: platformPayment.tenantId },
            data: {
              subscriptionPlan: meta.plan,
              subscriptionStartAt: platformPayment.periodStart,
              subscriptionEndAt: platformPayment.periodEnd,
              isActive: true,
            },
          });
          this.logger.log(
            `Tenant subscription updated: ${platformPayment.tenantId} -> ${meta.plan}`,
          );
        }
      }

      this.logger.log(`Platform Payment succeeded: ${referenceNo}`);
      return;
    }

    this.logger.warn(`Payment record not found for success webhook: ${referenceNo}`);
  }

  private async handlePaymentFailed(paymentIntent: any) {
    const referenceNo = paymentIntent.metadata?.referenceNo;
    if (!referenceNo) return;

    // 1. Try Booking Payment
    const bookingPayment = await this.prisma.bookingPayment.findUnique({
      where: { referenceNo },
    });

    if (bookingPayment) {
      await this.prisma.bookingPayment.update({
        where: { referenceNo },
        data: { status: PaymentStatus.FAILED },
      });
      this.logger.log(`Booking Payment failed: ${referenceNo}`);
      return;
    }

    // 2. Try Platform Payment
    const platformPayment = await this.prisma.platformPayment.findUnique({
      where: { referenceNo },
    });

    if (platformPayment) {
      await this.prisma.platformPayment.update({
        where: { referenceNo },
        data: { status: PaymentStatus.FAILED },
      });
      this.logger.log(`Platform Payment failed: ${referenceNo}`);
      return;
    }

    this.logger.warn(`Payment record not found for failed webhook: ${referenceNo}`);
  }

  private async handleSubscriptionPayment(invoice: any) {
    // Handle subscription payment success
    const tenantId = invoice.subscription_details?.metadata?.tenantId;
    if (tenantId) {
      this.logger.log(`Subscription payment succeeded for tenant: ${tenantId}`);
      // Could update tenant subscription status here
    }
  }
}
