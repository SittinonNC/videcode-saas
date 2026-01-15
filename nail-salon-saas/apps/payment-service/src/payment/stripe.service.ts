import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured. Payment features will not work.');
    }

    this.stripe = new Stripe(secretKey || 'sk_test_placeholder', {
      apiVersion: '2025-12-15.clover',
    });
  }

  /**
   * Create PromptPay payment (QR Code for Thai bank transfers)
   */
  async createPromptPayPayment(referenceNo: string, amount: number) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to smallest currency unit (satang)
        currency: 'thb',
        payment_method_types: ['promptpay'],
        metadata: {
          referenceNo,
        },
      });

      this.logger.log(`PromptPay payment created: ${paymentIntent.id}`);

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: amount,
        status: paymentIntent.status,
      };
    } catch (error) {
      this.logger.error(`PromptPay payment creation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Create credit card payment with Payment Intent
   */
  async createCardPayment(referenceNo: string, amount: number) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'thb',
        payment_method_types: ['card'],
        metadata: {
          referenceNo,
        },
      });

      this.logger.log(`Card payment created: ${paymentIntent.id}`);

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: amount,
        status: paymentIntent.status,
      };
    } catch (error) {
      this.logger.error(`Card payment creation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Create subscription for tenant (B2B)
   */
  async createSubscription(tenantId: string, priceId: string, customerId?: string) {
    try {
      // If no customer exists, create one
      let stripeCustomerId = customerId;
      if (!stripeCustomerId) {
        const customer = await this.stripe.customers.create({
          metadata: { tenantId },
        });
        stripeCustomerId = customer.id;
      }

      const subscription = await this.stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        metadata: { tenantId },
      });

      this.logger.log(`Subscription created: ${subscription.id} for tenant: ${tenantId}`);

      return {
        subscriptionId: subscription.id,
        customerId: stripeCustomerId,
        status: subscription.status,
        currentPeriodEnd: new Date(),
      };
    } catch (error) {
      this.logger.error(`Subscription creation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Create checkout session for subscription (easier for front-end)
   */
  async createCheckoutSession(
    tenantId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { tenantId },
      });

      this.logger.log(`Checkout session created: ${session.id}`);

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Checkout session creation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Create checkout session for one-time payment (Prepaid Subscription)
   */
  async createPaymentCheckoutSession(
    tenantId: string,
    referenceNo: string,
    amount: number,
    productName: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card', 'promptpay'],
        line_items: [
          {
            price_data: {
              currency: 'thb',
              product_data: {
                name: productName,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: referenceNo,
        metadata: { tenantId, referenceNo },
      });

      this.logger.log(`Payment checkout session created: ${session.id}`);

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Payment checkout session creation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentIntentId: string, amount?: number) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
      });

      this.logger.log(`Refund processed: ${refund.id} for payment: ${paymentIntentId}`);

      return {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      };
    } catch (error) {
      this.logger.error(`Refund failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Construct and verify webhook event
   */
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Retrieve payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Retrieve subscription
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Retrieve checkout session
   */
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }
}
