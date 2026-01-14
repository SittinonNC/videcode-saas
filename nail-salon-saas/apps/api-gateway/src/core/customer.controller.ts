import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UserRole } from '@app/common';
import { firstValueFrom } from 'rxjs';
import {
  CurrentTenant,
  Roles,
  CUSTOMER_PATTERNS,
  SERVICES,
  CreateCustomerDto,
  UpdateCustomerDto,
  SearchCustomerDto,
  CustomerResponseDto,
  PaginationDto,
} from '@app/common';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
export class CustomerController {
  constructor(@Inject(SERVICES.CORE) private readonly coreClient: ClientProxy) {}

  @Get()
  @ApiOperation({ summary: 'List all customers' })
  @ApiResponse({ status: 200, description: 'List of customers', type: [CustomerResponseDto] })
  async listCustomers(@CurrentTenant() tenantId: string, @Query() pagination: PaginationDto) {
    return firstValueFrom(
      this.coreClient.send(CUSTOMER_PATTERNS.LIST, {
        tenantId,
        ...pagination,
      }),
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search customers by name, phone, or email' })
  @ApiResponse({ status: 200, description: 'Search results', type: [CustomerResponseDto] })
  async searchCustomers(@CurrentTenant() tenantId: string, @Query() searchDto: SearchCustomerDto) {
    return firstValueFrom(
      this.coreClient.send(CUSTOMER_PATTERNS.SEARCH, {
        tenantId,
        ...searchDto,
      }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer details', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomer(@CurrentTenant() tenantId: string, @Param('id') customerId: string) {
    return firstValueFrom(
      this.coreClient.send(CUSTOMER_PATTERNS.GET_BY_ID, {
        tenantId,
        customerId,
      }),
    );
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({ status: 201, description: 'Customer created', type: CustomerResponseDto })
  async createCustomer(@CurrentTenant() tenantId: string, @Body() createDto: CreateCustomerDto) {
    return firstValueFrom(
      this.coreClient.send(CUSTOMER_PATTERNS.CREATE, {
        tenantId,
        data: createDto,
      }),
    );
  }

  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Update customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiResponse({ status: 200, description: 'Customer updated', type: CustomerResponseDto })
  async updateCustomer(
    @CurrentTenant() tenantId: string,
    @Param('id') customerId: string,
    @Body() updateDto: UpdateCustomerDto,
  ) {
    return firstValueFrom(
      this.coreClient.send(CUSTOMER_PATTERNS.UPDATE, {
        tenantId,
        customerId,
        data: updateDto,
      }),
    );
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer deleted' })
  async deleteCustomer(@CurrentTenant() tenantId: string, @Param('id') customerId: string) {
    return firstValueFrom(
      this.coreClient.send(CUSTOMER_PATTERNS.DELETE, {
        tenantId,
        customerId,
      }),
    );
  }
}
