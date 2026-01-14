import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/common';

interface CreateStaffDto {
  firstName: string;
  lastName: string;
  nickname?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
}

interface UpdateStaffDto extends Partial<CreateStaffDto> {
  avatarUrl?: string;
  isActive?: boolean;
}

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all staff for a tenant with pagination
   * IMPORTANT: Always filter by tenantId for multi-tenancy
   */
  async listStaff(tenantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [staff, total] = await Promise.all([
      this.prisma.staff.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { firstName: 'asc' },
      }),
      this.prisma.staff.count({ where: { tenantId } }),
    ]);

    return {
      data: staff,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get staff by ID
   * IMPORTANT: Always validate tenantId
   */
  async getStaffById(tenantId: string, staffId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        tenantId, // Crucial: Filter by tenant
      },
    });

    if (!staff) {
      throw new Error('Staff member not found');
    }

    return staff;
  }

  /**
   * Create a new staff member
   */
  async createStaff(tenantId: string, data: CreateStaffDto) {
    const staff = await this.prisma.staff.create({
      data: {
        tenantId,
        ...data,
      },
    });

    this.logger.log(`Staff created: ${staff.firstName} ${staff.lastName} for tenant: ${tenantId}`);
    return staff;
  }

  /**
   * Update staff member
   */
  async updateStaff(tenantId: string, staffId: string, data: UpdateStaffDto) {
    // First verify the staff belongs to the tenant
    await this.getStaffById(tenantId, staffId);

    return this.prisma.staff.update({
      where: { id: staffId },
      data,
    });
  }

  /**
   * Soft delete staff member
   */
  async deleteStaff(tenantId: string, staffId: string) {
    await this.getStaffById(tenantId, staffId);

    await this.prisma.staff.update({
      where: { id: staffId },
      data: { isActive: false },
    });

    return { success: true, message: 'Staff member deleted' };
  }

  /**
   * Get staff availability for a specific date
   * Returns available time slots
   */
  async getAvailability(tenantId: string, staffId: string, date: string) {
    await this.getStaffById(tenantId, staffId);

    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);

    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    // Get all bookings for this staff on the date
    const bookings = await this.prisma.booking.findMany({
      where: {
        tenantId,
        staffId,
        startTime: {
          gte: dateStart,
          lte: dateEnd,
        },
        status: {
          notIn: ['CANCELLED'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
        status: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Generate available time slots (9 AM to 8 PM, 30-minute intervals)
    const slots = [];
    const workStart = 9; // 9 AM
    const workEnd = 20; // 8 PM

    for (let hour = workStart; hour < workEnd; hour++) {
      for (const minute of [0, 30]) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + 30);

        // Check if slot conflicts with any booking
        const isBooked = bookings.some((booking) => {
          const bookingStart = new Date(booking.startTime);
          const bookingEnd = new Date(booking.endTime);
          return slotStart < bookingEnd && slotEnd > bookingStart;
        });

        slots.push({
          startTime: slotStart.toTimeString().slice(0, 5),
          endTime: slotEnd.toTimeString().slice(0, 5),
          available: !isBooked,
        });
      }
    }

    return {
      staffId,
      date,
      slots,
    };
  }
}
