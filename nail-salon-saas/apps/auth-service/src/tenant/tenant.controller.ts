import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { TENANT_PATTERNS } from '@app/common';
import { TenantService } from './tenant.service';

interface CreateTenantPayload {
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

interface UpdateTenantPayload {
  tenantId: string;
  userId: string;
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    logoUrl?: string;
  };
}

@Controller()
export class TenantController {
  private readonly logger = new Logger(TenantController.name);

  constructor(private readonly tenantService: TenantService) {}

  @MessagePattern(TENANT_PATTERNS.CREATE)
  async createTenant(@Payload() payload: CreateTenantPayload) {
    try {
      this.logger.log(`Creating tenant: ${payload.subdomain}`);
      return await this.tenantService.createTenant(payload);
    } catch (error) {
      this.logger.error(`Tenant creation failed: ${error.message}`);
      throw new RpcException({
        code: error.code || 'TENANT_CREATION_FAILED',
        message: error.message,
      });
    }
  }

  @MessagePattern(TENANT_PATTERNS.GET_BY_ID)
  async getTenantById(@Payload() payload: { tenantId: string }) {
    try {
      return await this.tenantService.getTenantById(payload.tenantId);
    } catch (error) {
      throw new RpcException({
        code: 'TENANT_NOT_FOUND',
        message: error.message,
      });
    }
  }

  @MessagePattern(TENANT_PATTERNS.GET_BY_SUBDOMAIN)
  async getTenantBySubdomain(@Payload() payload: { subdomain: string }) {
    try {
      return await this.tenantService.getTenantBySubdomain(payload.subdomain);
    } catch (error) {
      throw new RpcException({
        code: 'TENANT_NOT_FOUND',
        message: error.message,
      });
    }
  }

  @MessagePattern(TENANT_PATTERNS.UPDATE)
  async updateTenant(@Payload() payload: UpdateTenantPayload) {
    try {
      this.logger.log(`Updating tenant: ${payload.tenantId}`);
      return await this.tenantService.updateTenant(payload.tenantId, payload.data);
    } catch (error) {
      throw new RpcException({
        code: 'TENANT_UPDATE_FAILED',
        message: error.message,
      });
    }
  }

  @MessagePattern(TENANT_PATTERNS.UPDATE_SUBSCRIPTION)
  async updateSubscription(@Payload() payload: { tenantId: string; data: { plan: string } }) {
    try {
      this.logger.log(`Updating subscription for tenant: ${payload.tenantId}`);
      return await this.tenantService.updateSubscription(payload.tenantId, payload.data.plan);
    } catch (error) {
      throw new RpcException({
        code: 'SUBSCRIPTION_UPDATE_FAILED',
        message: error.message,
      });
    }
  }
}
