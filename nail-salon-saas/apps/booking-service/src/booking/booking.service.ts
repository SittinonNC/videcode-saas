import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, BookingStatus } from '@app/common';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';

interface BookingServiceItem {
  serviceId: string;
}

interface CreateBookingDto {
  customerId: string;
  staffId: string;
  startTime: string;
  services: BookingServiceItem[];
  notes?: string;
  discount?: number;
}

interface UpdateBookingDto {
  staffId?: string;
  startTime?: string;
  notes?: string;
  status?: BookingStatus;
  discount?: number;
}

interface ListBookingsParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  staffId?: string;
  status?: string;
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new booking with conflict detection
   */
  async createBooking(tenantId: string, userId: string, data: CreateBookingDto) {
    // 1. Get all services to calculate duration and total
    const services = await this.prisma.service.findMany({
      where: {
        id: { in: data.services.map((s) => s.serviceId) },
        tenantId,
        isActive: true,
      },
    });

    if (services.length !== data.services.length) {
      throw { code: 'INVALID_SERVICES', message: 'One or more services not found' };
    }

    // 2. Calculate total duration and price
    const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);
    const subtotal = services.reduce((sum, s) => sum + Number(s.price), 0);
    const discount = data.discount || 0;
    const totalAmount = subtotal - discount;

    // 3. Calculate end time
    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000);

    // 4. CHECK FOR CONFLICTS - Critical for preventing double booking
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        tenantId,
        staffId: data.staffId,
        status: { notIn: [BookingStatus.CANCELLED] },
        OR: [
          // New booking starts during existing booking
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          // New booking ends during existing booking
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          // New booking completely contains existing booking
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    });

    if (conflictingBooking) {
      throw {
        code: 'BOOKING_CONFLICT',
        message: `Time slot conflicts with existing booking #${conflictingBooking.bookingNumber}`,
      };
    }

    // 5. Generate booking number
    const bookingNumber = this.generateBookingNumber();

    // 6. Create booking with services in transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          tenantId,
          customerId: data.customerId,
          staffId: data.staffId,
          bookingNumber,
          startTime,
          endTime,
          totalDuration,
          subtotal: new Decimal(subtotal),
          discount: new Decimal(discount),
          totalAmount: new Decimal(totalAmount),
          status: BookingStatus.PENDING,
          notes: data.notes,
        },
      });

      // Create booking services
      await tx.bookingService.createMany({
        data: services.map((service) => ({
          bookingId: newBooking.id,
          serviceId: service.id,
          serviceName: service.name,
          price: service.price,
          duration: service.durationMinutes,
        })),
      });

      return newBooking;
    });

    this.logger.log(`Booking created: ${bookingNumber} for tenant: ${tenantId}`);

    return this.getBookingById(tenantId, booking.id);
  }

  /**
   * List bookings with filters
   */
  async listBookings(tenantId: string, params: ListBookingsParams) {
    const { page = 1, limit = 20, startDate, endDate, staffId, status } = params;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (staffId) {
      where.staffId = staffId;
    }

    if (status) {
      where.status = status as BookingStatus;
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          staff: {
            select: { id: true, firstName: true, lastName: true, nickname: true },
          },
          services: true,
        },
        skip,
        take: limit,
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings.map(this.formatBooking),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get booking by ID
   */
  async getBookingById(tenantId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId,
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
        staff: {
          select: { id: true, firstName: true, lastName: true, nickname: true },
        },
        services: true,
        payment: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    return this.formatBooking(booking);
  }

  /**
   * Update booking
   */
  async updateBooking(tenantId: string, bookingId: string, data: UpdateBookingDto) {
    const existing = await this.getBookingById(tenantId, bookingId);

    if (['COMPLETED', 'CANCELLED'].includes(existing.status)) {
      throw { code: 'BOOKING_LOCKED', message: 'Cannot modify completed or cancelled bookings' };
    }

    // If changing time or staff, check for conflicts
    if (data.startTime || data.staffId) {
      const startTime = data.startTime ? new Date(data.startTime) : new Date(existing.startTime);
      const endTime = new Date(startTime.getTime() + existing.totalDuration * 60 * 1000);
      const staffId = data.staffId || existing.staffId;

      const conflict = await this.prisma.booking.findFirst({
        where: {
          tenantId,
          staffId,
          id: { not: bookingId },
          status: { notIn: [BookingStatus.CANCELLED] },
          OR: [
            { startTime: { lte: startTime }, endTime: { gt: startTime } },
            { startTime: { lt: endTime }, endTime: { gte: endTime } },
            { startTime: { gte: startTime }, endTime: { lte: endTime } },
          ],
        },
      });

      if (conflict) {
        throw { code: 'BOOKING_CONFLICT', message: 'New time slot has conflicts' };
      }
    }

    const updateData: any = {};
    if (data.staffId) updateData.staffId = data.staffId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status) updateData.status = data.status;
    if (data.discount !== undefined) {
      updateData.discount = new Decimal(data.discount);
      updateData.totalAmount = new Decimal(Number(existing.subtotal) - data.discount);
    }
    if (data.startTime) {
      updateData.startTime = new Date(data.startTime);
      updateData.endTime = new Date(
        new Date(data.startTime).getTime() + existing.totalDuration * 60 * 1000,
      );
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    return this.getBookingById(tenantId, bookingId);
  }

  /**
   * Cancel booking
   */
  async cancelBooking(tenantId: string, bookingId: string, cancelReason: string) {
    const booking = await this.getBookingById(tenantId, bookingId);

    if (booking.status === BookingStatus.CANCELLED) {
      throw { code: 'ALREADY_CANCELLED', message: 'Booking is already cancelled' };
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw { code: 'CANNOT_CANCEL', message: 'Cannot cancel completed bookings' };
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason,
      },
    });

    this.logger.log(`Booking cancelled: ${booking.bookingNumber}`);

    return { success: true, message: 'Booking cancelled' };
  }

  /**
   * Check staff availability
   */
  async checkAvailability(tenantId: string, staffId: string, date: string, durationMinutes = 60) {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);

    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const bookings = await this.prisma.booking.findMany({
      where: {
        tenantId,
        staffId,
        status: { notIn: [BookingStatus.CANCELLED] },
        startTime: { gte: dateStart, lte: dateEnd },
      },
      select: { startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
    });

    // Generate slots from 9 AM to 8 PM
    const slots = [];
    const workStart = 9;
    const workEnd = 20;

    for (let hour = workStart; hour < workEnd; hour++) {
      for (const minute of [0, 30]) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

        // Check if this duration fits before end of day
        if (
          slotEnd.getHours() > workEnd ||
          (slotEnd.getHours() === workEnd && slotEnd.getMinutes() > 0)
        ) {
          continue;
        }

        const isBooked = bookings.some((b) => {
          const bStart = new Date(b.startTime);
          const bEnd = new Date(b.endTime);
          return slotStart < bEnd && slotEnd > bStart;
        });

        slots.push({
          startTime: slotStart.toTimeString().slice(0, 5),
          endTime: slotEnd.toTimeString().slice(0, 5),
          available: !isBooked,
        });
      }
    }

    return { staffId, date, durationMinutes, slots };
  }

  /**
   * Get bookings by staff
   */
  async getBookingsByStaff(tenantId: string, staffId: string, startDate: string, endDate: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        tenantId,
        staffId,
        startTime: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        services: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return bookings.map(this.formatBooking);
  }

  /**
   * Get bookings by customer
   */
  async getBookingsByCustomer(tenantId: string, customerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: { tenantId, customerId },
        include: {
          staff: { select: { firstName: true, lastName: true } },
          services: true,
        },
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.booking.count({ where: { tenantId, customerId } }),
    ]);

    return {
      data: bookings.map(this.formatBooking),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Generate human-readable booking number
   */
  private generateBookingNumber(): string {
    const date = new Date();
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = uuidv4().slice(0, 4).toUpperCase();
    return `BK${datePart}-${randomPart}`;
  }

  /**
   * Format booking for response (convert Decimals to numbers)
   */
  private formatBooking(booking: any) {
    return {
      ...booking,
      subtotal: Number(booking.subtotal),
      discount: Number(booking.discount),
      totalAmount: Number(booking.totalAmount),
      services: booking.services?.map((s: any) => ({
        ...s,
        price: Number(s.price),
      })),
    };
  }
}
