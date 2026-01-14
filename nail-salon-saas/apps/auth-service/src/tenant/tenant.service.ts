import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService, SubscriptionPlan, UserRole } from '@app/common';

interface CreateTenantDto {
  name: string;
  subdomain: string;
  email: string;
  phone?: string;
  address?: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerFirstName: string;
  ownerLastName: string;
}

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new tenant with owner account
   */
  async createTenant(dto: CreateTenantDto) {
    // Check if subdomain is taken
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { subdomain: dto.subdomain },
    });

    if (existingTenant) {
      throw { code: 'SUBDOMAIN_TAKEN', message: 'This subdomain is already in use' };
    }

    // Hash owner password
    const passwordHash = await bcrypt.hash(dto.ownerPassword, this.SALT_ROUNDS);

    // Create tenant and owner in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          subdomain: dto.subdomain.toLowerCase(),
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
          subscriptionPlan: SubscriptionPlan.TRIAL,
          subscriptionStartAt: new Date(),
          // Trial ends in 14 days
          subscriptionEndAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });

      // Create owner user
      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.ownerEmail,
          passwordHash,
          firstName: dto.ownerFirstName,
          lastName: dto.ownerLastName,
          role: UserRole.OWNER,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      return { tenant, owner };
    });

    this.logger.log(`Tenant created: ${result.tenant.subdomain} with owner: ${result.owner.email}`);

    return {
      success: true,
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        subdomain: result.tenant.subdomain,
        email: result.tenant.email,
        subscriptionPlan: result.tenant.subscriptionPlan,
      },
      owner: result.owner,
    };
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        email: true,
        phone: true,
        address: true,
        logoUrl: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartAt: true,
        subscriptionEndAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!tenant) {
      throw { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' };
    }

    return tenant;
  }

  /**
   * Get tenant by subdomain
   */
  async getTenantBySubdomain(subdomain: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain: subdomain.toLowerCase() },
      select: {
        id: true,
        name: true,
        subdomain: true,
        isActive: true,
      },
    });

    if (!tenant) {
      throw { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' };
    }

    return tenant;
  }

  /**
   * Update tenant details
   */
  async updateTenant(
    tenantId: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      address: string;
      logoUrl: string;
    }>,
  ) {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data,
      select: {
        id: true,
        name: true,
        subdomain: true,
        email: true,
        phone: true,
        address: true,
        logoUrl: true,
        updatedAt: true,
      },
    });

    return tenant;
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(tenantId: string, plan: string) {
    const subscriptionPlan = plan as SubscriptionPlan;

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionPlan,
        // Set new subscription period
        subscriptionStartAt: new Date(),
        subscriptionEndAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      select: {
        id: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartAt: true,
        subscriptionEndAt: true,
      },
    });

    this.logger.log(`Subscription updated for tenant ${tenantId}: ${plan}`);

    return tenant;
  }
}
