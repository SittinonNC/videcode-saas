import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { CUSTOMER_PATTERNS } from '@app/common';
import { CustomerService } from './customer.service';

@Controller()
export class CustomerController {
  private readonly logger = new Logger(CustomerController.name);

  constructor(private readonly customerService: CustomerService) {}

  @MessagePattern(CUSTOMER_PATTERNS.LIST)
  async listCustomers(@Payload() payload: { tenantId: string; page?: number; limit?: number }) {
    try {
      return await this.customerService.listCustomers(
        payload.tenantId,
        payload.page,
        payload.limit,
      );
    } catch (error) {
      throw new RpcException({ code: 'LIST_CUSTOMERS_FAILED', message: error.message });
    }
  }

  @MessagePattern(CUSTOMER_PATTERNS.SEARCH)
  async searchCustomers(
    @Payload() payload: { tenantId: string; name?: string; phone?: string; email?: string },
  ) {
    try {
      return await this.customerService.searchCustomers(payload.tenantId, payload);
    } catch (error) {
      throw new RpcException({ code: 'SEARCH_CUSTOMERS_FAILED', message: error.message });
    }
  }

  @MessagePattern(CUSTOMER_PATTERNS.GET_BY_ID)
  async getCustomerById(@Payload() payload: { tenantId: string; customerId: string }) {
    try {
      return await this.customerService.getCustomerById(payload.tenantId, payload.customerId);
    } catch (error) {
      throw new RpcException({ code: 'CUSTOMER_NOT_FOUND', message: error.message });
    }
  }

  @MessagePattern(CUSTOMER_PATTERNS.CREATE)
  async createCustomer(@Payload() payload: { tenantId: string; data: any }) {
    try {
      this.logger.log(`Creating customer for tenant: ${payload.tenantId}`);
      return await this.customerService.createCustomer(payload.tenantId, payload.data);
    } catch (error) {
      throw new RpcException({ code: 'CREATE_CUSTOMER_FAILED', message: error.message });
    }
  }

  @MessagePattern(CUSTOMER_PATTERNS.UPDATE)
  async updateCustomer(@Payload() payload: { tenantId: string; customerId: string; data: any }) {
    try {
      return await this.customerService.updateCustomer(
        payload.tenantId,
        payload.customerId,
        payload.data,
      );
    } catch (error) {
      throw new RpcException({ code: 'UPDATE_CUSTOMER_FAILED', message: error.message });
    }
  }

  @MessagePattern(CUSTOMER_PATTERNS.DELETE)
  async deleteCustomer(@Payload() payload: { tenantId: string; customerId: string }) {
    try {
      return await this.customerService.deleteCustomer(payload.tenantId, payload.customerId);
    } catch (error) {
      throw new RpcException({ code: 'DELETE_CUSTOMER_FAILED', message: error.message });
    }
  }
}
