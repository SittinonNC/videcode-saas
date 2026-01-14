import { Controller, Get, Post, Body, Param, Inject, HttpCode, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import {
  Public,
  CurrentTenant,
  Roles,
  PAYMENT_PATTERNS,
  SERVICES,
  CreateBookingPaymentDto,
  CreatePlatformPaymentDto,
  StripeWebhookDto,
  RefundPaymentDto,
  PaymentResponseDto,
  QRCodePaymentResponseDto,
  UserRole,
} from '@app/common';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentController {
  constructor(@Inject(SERVICES.PAYMENT) private readonly paymentClient: ClientProxy) {}

  @Post('booking')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Create payment for booking' })
  @ApiResponse({
    status: 201,
    description: 'Payment created',
    type: PaymentResponseDto,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bookingId: { type: 'string', example: 'uuid' },
        paymentMethod: {
          type: 'string',
          enum: ['PROMPTPAY', 'CREDIT_CARD'],
          example: 'PROMPTPAY',
        },
      },
      required: ['bookingId', 'paymentMethod'],
    },
  })
  async createBookingPayment(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateBookingPaymentDto,
  ) {
    return firstValueFrom(
      this.paymentClient.send(PAYMENT_PATTERNS.CREATE_BOOKING_PAYMENT, {
        tenantId,
        data: dto,
      }),
    );
  }

  @Post('subscription')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Create platform subscription payment' })
  @ApiBody({ type: CreatePlatformPaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Subscription payment initiated',
    type: PaymentResponseDto,
  })
  async createPlatformPayment(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreatePlatformPaymentDto,
  ) {
    return firstValueFrom(
      this.paymentClient.send(PAYMENT_PATTERNS.CREATE_PLATFORM_PAYMENT, {
        tenantId,
        data: createDto,
      }),
    );
  }

  @Get('booking/:referenceNo/status')
  @ApiOperation({ summary: 'Get payment status by reference number' })
  @ApiParam({ name: 'referenceNo', description: 'Payment reference number' })
  @ApiResponse({ status: 200, description: 'Payment status', type: PaymentResponseDto })
  async getPaymentStatus(
    @CurrentTenant() tenantId: string,
    @Param('referenceNo') referenceNo: string,
  ) {
    return firstValueFrom(
      this.paymentClient.send(PAYMENT_PATTERNS.GET_PAYMENT_STATUS, {
        tenantId,
        referenceNo,
      }),
    );
  }

  @Post('booking/:referenceNo/qr')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Generate QR code for payment' })
  @ApiParam({ name: 'referenceNo', description: 'Payment reference number' })
  @ApiResponse({ status: 200, description: 'QR code generated', type: QRCodePaymentResponseDto })
  async generateQRCode(
    @CurrentTenant() tenantId: string,
    @Param('referenceNo') referenceNo: string,
  ) {
    return firstValueFrom(
      this.paymentClient.send(PAYMENT_PATTERNS.GENERATE_QR, {
        tenantId,
        referenceNo,
      }),
    );
  }

  @Post('booking/:referenceNo/refund')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Process refund for a payment' })
  @ApiParam({ name: 'referenceNo', description: 'Payment reference number' })
  @ApiBody({ type: RefundPaymentDto })
  @ApiResponse({ status: 200, description: 'Refund processed' })
  async processRefund(
    @CurrentTenant() tenantId: string,
    @Param('referenceNo') referenceNo: string,
    @Body() refundDto: RefundPaymentDto,
  ) {
    return firstValueFrom(
      this.paymentClient.send(PAYMENT_PATTERNS.PROCESS_REFUND, {
        tenantId,
        referenceNo,
        ...refundDto,
      }),
    );
  }

  /**
   * Stripe Webhook endpoint
   * This endpoint is called by Stripe to notify about payment status
   */
  @Public()
  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook receiver' })
  @ApiBody({ type: StripeWebhookDto })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(@Body() webhookDto: StripeWebhookDto) {
    return firstValueFrom(this.paymentClient.send(PAYMENT_PATTERNS.HANDLE_WEBHOOK, webhookDto));
  }
}
