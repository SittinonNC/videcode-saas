import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/common';

interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth?: string;
  notes?: string;
}

interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

interface SearchParams {
  name?: string;
  phone?: string;
  email?: string;
}

interface CustomerRecord {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  dateOfBirth: Date | null;
  notes: string | null;
  totalVisits: number;
  totalSpent: unknown;
  lastVisitAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  bookings?: unknown[];
}

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(private readonly prisma: PrismaService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get customerModel(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.prisma as any).customer;
  }

  /**
   * List all customers for a tenant with pagination
   */
  async listCustomers(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      this.customerModel.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }) as Promise<CustomerRecord[]>,
      this.customerModel.count({ where: { tenantId } }) as Promise<number>,
    ]);

    // Convert Decimal to number
    const formattedCustomers = customers.map((c: CustomerRecord) => ({
      ...c,
      totalSpent: Number(c.totalSpent),
    }));

    return {
      data: formattedCustomers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Search customers by name, phone, or email
   */
  async searchCustomers(tenantId: string, params: SearchParams) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [{ tenantId }];

    if (params.name) {
      conditions.push({
        OR: [
          { firstName: { contains: params.name, mode: 'insensitive' } },
          { lastName: { contains: params.name, mode: 'insensitive' } },
        ],
      });
    }

    if (params.phone) {
      conditions.push({ phone: { contains: params.phone } });
    }

    if (params.email) {
      conditions.push({ email: { contains: params.email, mode: 'insensitive' } });
    }

    const customers = (await this.customerModel.findMany({
      where: { AND: conditions },
      take: 20,
      orderBy: { lastName: 'asc' },
    })) as CustomerRecord[];

    return customers.map((c: CustomerRecord) => ({
      ...c,
      totalSpent: Number(c.totalSpent),
    }));
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(tenantId: string, customerId: string) {
    const customer = (await this.customerModel.findFirst({
      where: {
        id: customerId,
        tenantId,
      },
      include: {
        bookings: {
          take: 10,
          orderBy: { startTime: 'desc' },
          include: {
            services: true,
          },
        },
      },
    })) as CustomerRecord | null;

    if (!customer) {
      throw new Error('Customer not found');
    }

    return {
      ...customer,
      totalSpent: Number(customer.totalSpent),
    };
  }

  /**
   * Get customer by phone number (returns null if not found)
   */
  async getCustomerByPhone(tenantId: string, phone: string) {
    const customer = (await this.customerModel.findUnique({
      where: {
        tenantId_phone: { tenantId, phone },
      },
    })) as CustomerRecord | null;

    if (!customer) {
      return null;
    }

    return {
      ...customer,
      totalSpent: Number(customer.totalSpent),
    };
  }

  /**
   * Create a new customer
   */
  async createCustomer(tenantId: string, data: CreateCustomerDto) {
    // Check if phone already exists for this tenant
    const existing = await this.customerModel.findUnique({
      where: {
        tenantId_phone: { tenantId, phone: data.phone },
      },
    });

    if (existing) {
      throw new Error('Customer with this phone number already exists');
    }

    const customer = (await this.customerModel.create({
      data: {
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        notes: data.notes,
      },
    })) as CustomerRecord;

    this.logger.log(
      `Customer created: ${customer.firstName} ${customer.lastName} for tenant: ${tenantId}`,
    );

    return {
      ...customer,
      totalSpent: Number(customer.totalSpent),
    };
  }

  /**
   * Update customer
   */
  async updateCustomer(tenantId: string, customerId: string, data: UpdateCustomerDto) {
    await this.getCustomerById(tenantId, customerId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { ...data };
    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth);
    }

    const customer = (await this.customerModel.update({
      where: { id: customerId },
      data: updateData,
    })) as CustomerRecord;

    return {
      ...customer,
      totalSpent: Number(customer.totalSpent),
    };
  }

  /**
   * Delete customer (soft delete by anonymizing)
   */
  async deleteCustomer(tenantId: string, customerId: string) {
    await this.getCustomerById(tenantId, customerId);

    // Anonymize customer data (GDPR compliance)
    await this.customerModel.update({
      where: { id: customerId },
      data: {
        firstName: 'Deleted',
        lastName: 'Customer',
        email: null,
        phone: `deleted-${customerId.slice(0, 8)}`,
        notes: null,
      },
    });

    return { success: true, message: 'Customer deleted' };
  }
}
