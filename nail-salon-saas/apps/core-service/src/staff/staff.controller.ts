import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { STAFF_PATTERNS } from '@app/common';
import { StaffService } from './staff.service';

@Controller()
export class StaffController {
  private readonly logger = new Logger(StaffController.name);

  constructor(private readonly staffService: StaffService) {}

  @MessagePattern(STAFF_PATTERNS.LIST)
  async listStaff(@Payload() payload: { tenantId: string; page?: number; limit?: number }) {
    try {
      return await this.staffService.listStaff(payload.tenantId, payload.page, payload.limit);
    } catch (error) {
      throw new RpcException({ code: 'LIST_STAFF_FAILED', message: error.message });
    }
  }

  @MessagePattern(STAFF_PATTERNS.GET_BY_ID)
  async getStaffById(@Payload() payload: { tenantId: string; staffId: string }) {
    try {
      return await this.staffService.getStaffById(payload.tenantId, payload.staffId);
    } catch (error) {
      throw new RpcException({ code: 'STAFF_NOT_FOUND', message: error.message });
    }
  }

  @MessagePattern(STAFF_PATTERNS.CREATE)
  async createStaff(@Payload() payload: { tenantId: string; data: any }) {
    try {
      this.logger.log(`Creating staff for tenant: ${payload.tenantId}`);
      return await this.staffService.createStaff(payload.tenantId, payload.data);
    } catch (error) {
      throw new RpcException({ code: 'CREATE_STAFF_FAILED', message: error.message });
    }
  }

  @MessagePattern(STAFF_PATTERNS.UPDATE)
  async updateStaff(@Payload() payload: { tenantId: string; staffId: string; data: any }) {
    try {
      return await this.staffService.updateStaff(payload.tenantId, payload.staffId, payload.data);
    } catch (error) {
      throw new RpcException({ code: 'UPDATE_STAFF_FAILED', message: error.message });
    }
  }

  @MessagePattern(STAFF_PATTERNS.DELETE)
  async deleteStaff(@Payload() payload: { tenantId: string; staffId: string }) {
    try {
      return await this.staffService.deleteStaff(payload.tenantId, payload.staffId);
    } catch (error) {
      throw new RpcException({ code: 'DELETE_STAFF_FAILED', message: error.message });
    }
  }

  @MessagePattern(STAFF_PATTERNS.GET_AVAILABILITY)
  async getAvailability(@Payload() payload: { tenantId: string; staffId: string; date: string }) {
    try {
      return await this.staffService.getAvailability(
        payload.tenantId,
        payload.staffId,
        payload.date,
      );
    } catch (error) {
      throw new RpcException({ code: 'GET_AVAILABILITY_FAILED', message: error.message });
    }
  }
}
