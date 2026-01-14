import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/common';

interface CreateServiceDto {
  name: string;
  description?: string;
  category: string;
  durationMinutes: number;
  price: number;
  imageUrl?: string;
  displayOrder?: number;
}

interface UpdateServiceDto extends Partial<CreateServiceDto> {
  isActive?: boolean;
}

interface ServiceRecord {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  category: string;
  durationMinutes: number;
  price: unknown;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ServiceService {
  private readonly logger = new Logger(ServiceService.name);

  constructor(private readonly prisma: PrismaService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get serviceModel(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.prisma as any).service;
  }

  /**
   * List all services for a tenant with optional category filter
   */
  async listServices(tenantId: string, category?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { tenantId, isActive: true };
    if (category) {
      where.category = category;
    }

    const [services, total] = await Promise.all([
      this.serviceModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }],
      }) as Promise<ServiceRecord[]>,
      this.serviceModel.count({ where }) as Promise<number>,
    ]);

    // Convert Decimal to number for JSON serialization
    const formattedServices = services.map((s: ServiceRecord) => ({
      ...s,
      price: Number(s.price),
    }));

    return {
      data: formattedServices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get service by ID
   */
  async getServiceById(tenantId: string, serviceId: string) {
    const service = (await this.serviceModel.findFirst({
      where: {
        id: serviceId,
        tenantId,
      },
    })) as ServiceRecord | null;

    if (!service) {
      throw new Error('Service not found');
    }

    return {
      ...service,
      price: Number(service.price),
    };
  }

  /**
   * Get list of unique categories for a tenant
   */
  async getCategories(tenantId: string) {
    const services = (await this.serviceModel.findMany({
      where: { tenantId, isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })) as Array<{ category: string }>;

    return services.map((s: { category: string }) => s.category);
  }

  /**
   * Create a new service
   */
  async createService(tenantId: string, data: CreateServiceDto) {
    const service = (await this.serviceModel.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        category: data.category,
        durationMinutes: data.durationMinutes,
        price: data.price, // Prisma will handle the conversion
        imageUrl: data.imageUrl,
        displayOrder: data.displayOrder || 0,
      },
    })) as ServiceRecord;

    this.logger.log(`Service created: ${service.name} for tenant: ${tenantId}`);

    return {
      ...service,
      price: Number(service.price),
    };
  }

  /**
   * Update service
   */
  async updateService(tenantId: string, serviceId: string, data: UpdateServiceDto) {
    await this.getServiceById(tenantId, serviceId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { ...data };

    const service = (await this.serviceModel.update({
      where: { id: serviceId },
      data: updateData,
    })) as ServiceRecord;

    return {
      ...service,
      price: Number(service.price),
    };
  }

  /**
   * Soft delete service
   */
  async deleteService(tenantId: string, serviceId: string) {
    await this.getServiceById(tenantId, serviceId);

    await this.serviceModel.update({
      where: { id: serviceId },
      data: { isActive: false },
    });

    return { success: true, message: 'Service deleted' };
  }
}
