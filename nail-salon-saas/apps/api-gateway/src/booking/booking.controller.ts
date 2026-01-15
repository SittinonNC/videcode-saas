import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UserRole } from '@app/common';
import { firstValueFrom } from 'rxjs';
import {
  CurrentTenant,
  CurrentUser,
  Roles,
  Public,
  BOOKING_PATTERNS,
  CUSTOMER_PATTERNS,
  SERVICES,
  ICurrentUser,
  CreateBookingDto,
  CreatePublicBookingDto,
  UpdateBookingDto,
  CancelBookingDto,
  CheckAvailabilityDto,
  GetBookingsByDateRangeDto,
  BookingResponseDto,
  AvailabilityResponseDto,
  PaginationDto,
} from '@app/common';

@ApiTags('Bookings')
@ApiBearerAuth('JWT-auth')
@Controller('bookings')
export class BookingController {
  constructor(
    @Inject(SERVICES.BOOKING) private readonly bookingClient: ClientProxy,
    @Inject(SERVICES.CORE) private readonly coreClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List bookings' })
  @ApiResponse({ status: 200, description: 'List of bookings', type: [BookingResponseDto] })
  async listBookings(
    @CurrentTenant() tenantId: string,
    @Query() pagination: PaginationDto,
    @Query() dateRange?: GetBookingsByDateRangeDto,
  ) {
    return firstValueFrom(
      this.bookingClient.send(BOOKING_PATTERNS.LIST, {
        tenantId,
        ...pagination,
        ...dateRange,
      }),
    );
  }

  @Get('availability')
  @ApiOperation({ summary: 'Check staff availability' })
  @ApiResponse({ status: 200, description: 'Available time slots', type: AvailabilityResponseDto })
  async checkAvailability(
    @CurrentTenant() tenantId: string,
    @Query() availabilityDto: CheckAvailabilityDto,
  ) {
    return firstValueFrom(
      this.bookingClient.send(BOOKING_PATTERNS.CHECK_AVAILABILITY, {
        tenantId,
        ...availabilityDto,
      }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking details', type: BookingResponseDto })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBooking(@CurrentTenant() tenantId: string, @Param('id') bookingId: string) {
    return firstValueFrom(
      this.bookingClient.send(BOOKING_PATTERNS.GET_BY_ID, {
        tenantId,
        bookingId,
      }),
    );
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({ status: 201, description: 'Booking created', type: BookingResponseDto })
  @ApiResponse({ status: 409, description: 'Time slot conflict' })
  async createBooking(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: ICurrentUser,
    @Body() createDto: CreateBookingDto,
  ) {
    return firstValueFrom(
      this.bookingClient.send(BOOKING_PATTERNS.CREATE, {
        tenantId,
        userId: user.id,
        data: createDto,
      }),
    );
  }

  @Post('public')
  @Public()
  @ApiOperation({ summary: 'Create a new booking (Public)' })
  @ApiBody({ type: CreatePublicBookingDto })
  @ApiResponse({ status: 201, description: 'Booking created', type: BookingResponseDto })
  @ApiResponse({ status: 409, description: 'Time slot conflict' })
  async createPublicBooking(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreatePublicBookingDto,
  ) {
    // 1. Find or Create Customer
    let customer = await firstValueFrom(
      this.coreClient.send(CUSTOMER_PATTERNS.GET_BY_PHONE, {
        tenantId,
        phone: createDto.customerPhone,
      }),
    );

    if (!customer) {
      customer = await firstValueFrom(
        this.coreClient.send(CUSTOMER_PATTERNS.CREATE, {
          tenantId,
          data: {
            firstName: createDto.customerFirstName,
            lastName: createDto.customerLastName,
            phone: createDto.customerPhone,
            email: createDto.customerEmail,
          },
        }),
      );
    }

    // 2. Create Booking
    return firstValueFrom(
      this.bookingClient.send(BOOKING_PATTERNS.CREATE, {
        tenantId,
        userId: null,
        data: {
          customerId: customer.id,
          staffId: createDto.staffId,
          startTime: createDto.startTime,
          services: createDto.services,
          notes: createDto.notes,
        },
      }),
    );
  }

  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Update booking' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiBody({ type: UpdateBookingDto })
  @ApiResponse({ status: 200, description: 'Booking updated', type: BookingResponseDto })
  async updateBooking(
    @CurrentTenant() tenantId: string,
    @Param('id') bookingId: string,
    @Body() updateDto: UpdateBookingDto,
  ) {
    return firstValueFrom(
      this.bookingClient.send(BOOKING_PATTERNS.UPDATE, {
        tenantId,
        bookingId,
        data: updateDto,
      }),
    );
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiBody({ type: CancelBookingDto })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  async cancelBooking(
    @CurrentTenant() tenantId: string,
    @Param('id') bookingId: string,
    @Body() cancelDto: CancelBookingDto,
  ) {
    return firstValueFrom(
      this.bookingClient.send(BOOKING_PATTERNS.CANCEL, {
        tenantId,
        bookingId,
        ...cancelDto,
      }),
    );
  }

  @Get('staff/:staffId')
  @ApiOperation({ summary: 'Get bookings for a specific staff member' })
  @ApiParam({ name: 'staffId', description: 'Staff ID' })
  @ApiResponse({ status: 200, description: 'Staff bookings', type: [BookingResponseDto] })
  async getBookingsByStaff(
    @CurrentTenant() tenantId: string,
    @Param('staffId') staffId: string,
    @Query() dateRange: GetBookingsByDateRangeDto,
  ) {
    return firstValueFrom(
      this.bookingClient.send(BOOKING_PATTERNS.GET_BY_STAFF, {
        tenantId,
        staffId,
        ...dateRange,
      }),
    );
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get bookings for a specific customer' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer bookings', type: [BookingResponseDto] })
  async getBookingsByCustomer(
    @CurrentTenant() tenantId: string,
    @Param('customerId') customerId: string,
    @Query() pagination: PaginationDto,
  ) {
    return firstValueFrom(
      this.bookingClient.send(BOOKING_PATTERNS.GET_BY_CUSTOMER, {
        tenantId,
        customerId,
        ...pagination,
      }),
    );
  }
}
