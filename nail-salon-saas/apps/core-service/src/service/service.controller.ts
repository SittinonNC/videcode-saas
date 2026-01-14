import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { SERVICE_PATTERNS } from '@app/common';
import { ServiceService } from './service.service';

@Controller()
export class ServiceController {
  private readonly logger = new Logger(ServiceController.name);

  constructor(private readonly serviceService: ServiceService) {}

  @MessagePattern(SERVICE_PATTERNS.LIST)
  async listServices(
    @Payload() payload: { tenantId: string; category?: string; page?: number; limit?: number },
  ) {
    try {
      return await this.serviceService.listServices(
        payload.tenantId,
        payload.category,
        payload.page,
        payload.limit,
      );
    } catch (error) {
      throw new RpcException({ code: 'LIST_SERVICES_FAILED', message: error.message });
    }
  }

  @MessagePattern(SERVICE_PATTERNS.GET_BY_ID)
  async getServiceById(@Payload() payload: { tenantId: string; serviceId: string }) {
    try {
      return await this.serviceService.getServiceById(payload.tenantId, payload.serviceId);
    } catch (error) {
      throw new RpcException({ code: 'SERVICE_NOT_FOUND', message: error.message });
    }
  }

  @MessagePattern(SERVICE_PATTERNS.GET_BY_CATEGORY)
  async getCategories(@Payload() payload: { tenantId: string }) {
    try {
      return await this.serviceService.getCategories(payload.tenantId);
    } catch (error) {
      throw new RpcException({ code: 'GET_CATEGORIES_FAILED', message: error.message });
    }
  }

  @MessagePattern(SERVICE_PATTERNS.CREATE)
  async createService(@Payload() payload: { tenantId: string; data: any }) {
    try {
      this.logger.log(`Creating service for tenant: ${payload.tenantId}`);
      return await this.serviceService.createService(payload.tenantId, payload.data);
    } catch (error) {
      throw new RpcException({ code: 'CREATE_SERVICE_FAILED', message: error.message });
    }
  }

  @MessagePattern(SERVICE_PATTERNS.UPDATE)
  async updateService(@Payload() payload: { tenantId: string; serviceId: string; data: any }) {
    try {
      return await this.serviceService.updateService(
        payload.tenantId,
        payload.serviceId,
        payload.data,
      );
    } catch (error) {
      throw new RpcException({ code: 'UPDATE_SERVICE_FAILED', message: error.message });
    }
  }

  @MessagePattern(SERVICE_PATTERNS.DELETE)
  async deleteService(@Payload() payload: { tenantId: string; serviceId: string }) {
    try {
      return await this.serviceService.deleteService(payload.tenantId, payload.serviceId);
    } catch (error) {
      throw new RpcException({ code: 'DELETE_SERVICE_FAILED', message: error.message });
    }
  }
}
