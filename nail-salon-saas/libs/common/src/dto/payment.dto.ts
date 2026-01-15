import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, Min, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus, SubscriptionPlan } from '../enums';

// ============================================
// PAYMENT DTOs
// ============================================

// Booking Payment (Customer paying for services)
export class CreateBookingPaymentDto {
  @ApiProperty({ description: 'Booking ID to pay for' })
  @IsUUID()
  bookingId: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

// Platform Payment (Shop subscription)
export class CreatePlatformPaymentDto {
  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 12, description: 'Number of months' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  months?: number;
}

// Stripe Webhook payload (simplified - Stripe event object is complex)
export class StripeWebhookDto {
  @ApiProperty()
  @IsString()
  id: string; // Event ID

  @ApiProperty()
  @IsString()
  type: string; // Event type (e.g., 'payment_intent.succeeded')

  @ApiProperty()
  @IsObject()
  data: {
    object: Record<string, unknown>; // Payment Intent or Subscription object
  };
}

export class PaymentStatusDto {
  @ApiProperty()
  @IsString()
  referenceNo: string;
}

export class RefundPaymentDto {
  @ApiPropertyOptional({ description: 'Partial refund amount. Omit for full refund.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount?: number;

  @ApiProperty({ example: 'Customer requested refund' })
  @IsString()
  reason: string;
}

// Response DTOs
export class QRCodePaymentResponseDto {
  @ApiProperty()
  referenceNo: string;

  @ApiProperty()
  qrCodeUrl: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  expiresAt: Date;
}

export class CreditCardPaymentResponseDto {
  @ApiProperty()
  referenceNo: string;

  @ApiProperty({ description: 'Redirect URL for 3D Secure' })
  redirectUrl: string;

  @ApiProperty()
  amount: number;
}

export class PaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  referenceNo: string;

  @ApiPropertyOptional({ description: 'Stripe Payment Intent ID' })
  paymentIntentId?: string;

  @ApiPropertyOptional({ description: 'Stripe client secret for front-end' })
  clientSecret?: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiPropertyOptional()
  qrCodeUrl?: string;

  @ApiPropertyOptional()
  paidAt?: Date;
}

// Subscription pricing (for reference)
export const SUBSCRIPTION_PRICING: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.TRIAL]: 0,
  [SubscriptionPlan.BASIC]: 299,
  [SubscriptionPlan.PROFESSIONAL]: 599,
  [SubscriptionPlan.ENTERPRISE]: 1299,
};
