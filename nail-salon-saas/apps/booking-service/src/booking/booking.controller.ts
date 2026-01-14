import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { BOOKING_PATTERNS } from '@app/common';
import { BookingService } from './booking.service';

@Controller()
export class BookingController {
  private readonly logger = new Logger(BookingController.name);

  constructor(private readonly bookingService: BookingService) {}

  @MessagePattern(BOOKING_PATTERNS.CREATE)
  async createBooking(@Payload() payload: { tenantId: string; userId: string; data: any }) {
    try {
      this.logger.log(`Creating booking for tenant: ${payload.tenantId}`);
      return await this.bookingService.createBooking(
        payload.tenantId,
        payload.userId,
        payload.data,
      );
    } catch (error) {
      this.logger.error(`Booking creation failed: ${error.message}`);
      throw new RpcException({
        code: error.code || 'CREATE_BOOKING_FAILED',
        message: error.message,
      });
    }
  }

  @MessagePattern(BOOKING_PATTERNS.LIST)
  async listBookings(
    @Payload()
    payload: {
      tenantId: string;
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      staffId?: string;
      status?: string;
    },
  ) {
    try {
      return await this.bookingService.listBookings(payload.tenantId, payload);
    } catch (error) {
      throw new RpcException({ code: 'LIST_BOOKINGS_FAILED', message: error.message });
    }
  }

  @MessagePattern(BOOKING_PATTERNS.GET_BY_ID)
  async getBookingById(@Payload() payload: { tenantId: string; bookingId: string }) {
    try {
      return await this.bookingService.getBookingById(payload.tenantId, payload.bookingId);
    } catch (error) {
      throw new RpcException({ code: 'BOOKING_NOT_FOUND', message: error.message });
    }
  }

  @MessagePattern(BOOKING_PATTERNS.UPDATE)
  async updateBooking(@Payload() payload: { tenantId: string; bookingId: string; data: any }) {
    try {
      return await this.bookingService.updateBooking(
        payload.tenantId,
        payload.bookingId,
        payload.data,
      );
    } catch (error) {
      throw new RpcException({ code: 'UPDATE_BOOKING_FAILED', message: error.message });
    }
  }

  @MessagePattern(BOOKING_PATTERNS.CANCEL)
  async cancelBooking(
    @Payload() payload: { tenantId: string; bookingId: string; cancelReason: string },
  ) {
    try {
      this.logger.log(`Cancelling booking: ${payload.bookingId}`);
      return await this.bookingService.cancelBooking(
        payload.tenantId,
        payload.bookingId,
        payload.cancelReason,
      );
    } catch (error) {
      throw new RpcException({ code: 'CANCEL_BOOKING_FAILED', message: error.message });
    }
  }

  @MessagePattern(BOOKING_PATTERNS.CHECK_AVAILABILITY)
  async checkAvailability(
    @Payload()
    payload: {
      tenantId: string;
      staffId: string;
      date: string;
      durationMinutes?: number;
    },
  ) {
    try {
      return await this.bookingService.checkAvailability(
        payload.tenantId,
        payload.staffId,
        payload.date,
        payload.durationMinutes,
      );
    } catch (error) {
      throw new RpcException({ code: 'CHECK_AVAILABILITY_FAILED', message: error.message });
    }
  }

  @MessagePattern(BOOKING_PATTERNS.GET_BY_STAFF)
  async getByStaff(
    @Payload() payload: { tenantId: string; staffId: string; startDate: string; endDate: string },
  ) {
    try {
      return await this.bookingService.getBookingsByStaff(
        payload.tenantId,
        payload.staffId,
        payload.startDate,
        payload.endDate,
      );
    } catch (error) {
      throw new RpcException({ code: 'GET_STAFF_BOOKINGS_FAILED', message: error.message });
    }
  }

  @MessagePattern(BOOKING_PATTERNS.GET_BY_CUSTOMER)
  async getByCustomer(
    @Payload() payload: { tenantId: string; customerId: string; page?: number; limit?: number },
  ) {
    try {
      return await this.bookingService.getBookingsByCustomer(
        payload.tenantId,
        payload.customerId,
        payload.page,
        payload.limit,
      );
    } catch (error) {
      throw new RpcException({ code: 'GET_CUSTOMER_BOOKINGS_FAILED', message: error.message });
    }
  }
}
