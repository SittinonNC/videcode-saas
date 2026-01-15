import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Inject,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiConsumes,
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

  @HttpCode(HttpStatus.OK)
  @Post('subscription/:referenceNo/verify')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Verify platform subscription payment' })
  @ApiParam({ name: 'referenceNo', description: 'Payment reference number' })
  @ApiResponse({
    status: 200,
    description: 'Payment verification result',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        status: { type: 'string' },
      },
    },
  })
  async verifyPlatformPayment(
    @CurrentTenant() tenantId: string,
    @Param('referenceNo') referenceNo: string,
  ) {
    return firstValueFrom(
      this.paymentClient.send(PAYMENT_PATTERNS.VERIFY_PLATFORM_PAYMENT, {
        tenantId,
        referenceNo,
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

  @Get('booking/:bookingId/bank-info')
  @Public()
  @ApiOperation({ summary: 'Get bank info for a booking (for customer to transfer)' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Bank info for transfer',
    schema: {
      type: 'object',
      properties: {
        bankName: { type: 'string', example: 'กสิกรไทย' },
        accountNo: { type: 'string', example: '123-4-56789-0' },
        accountName: { type: 'string', example: 'ร้านทำเล็บ ABC' },
        amount: { type: 'number', example: 500 },
        bookingNumber: { type: 'string', example: 'BK123456' },
      },
    },
  })
  async getBankInfo(@CurrentTenant() tenantId: string, @Param('bookingId') bookingId: string) {
    return firstValueFrom(
      this.paymentClient.send(PAYMENT_PATTERNS.GET_BANK_INFO, {
        tenantId,
        bookingId,
      }),
    );
  }

  @Post('booking/:bookingId/verify-slip')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('slipImage'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Verify slip payment for a booking' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        slipImage: {
          type: 'string',
          format: 'binary',
          description: 'Slip image file (JPG/PNG)',
        },
      },
      required: ['slipImage'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Slip verification result',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' },
        paymentId: { type: 'string' },
        amount: { type: 'number' },
        transRef: { type: 'string' },
      },
    },
  })
  async verifySlip(
    @CurrentTenant() tenantId: string,
    @Param('bookingId') bookingId: string,
    @UploadedFile() slipImage: Express.Multer.File,
  ) {
    // Convert file buffer to base64 for transport over Redis
    const slipImageBuffer = slipImage.buffer.toString('base64');
    return firstValueFrom(
      this.paymentClient.send(PAYMENT_PATTERNS.VERIFY_SLIP, {
        tenantId,
        bookingId,
        slipImageBuffer,
        slipImageUrl: '',
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
