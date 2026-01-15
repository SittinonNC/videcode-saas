import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '@app/common';
import { firstValueFrom } from 'rxjs';
import {
  CurrentTenant,
  Roles,
  Public,
  SERVICE_PATTERNS,
  SERVICES,
  CreateServiceDto,
  UpdateServiceDto,
  ServiceResponseDto,
  PaginationDto,
} from '@app/common';

@ApiTags('Services')
@ApiBearerAuth('JWT-auth')
@Controller('services')
export class ServiceController {
  constructor(@Inject(SERVICES.CORE) private readonly coreClient: ClientProxy) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all services (menu items)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiResponse({ status: 200, description: 'List of services', type: [ServiceResponseDto] })
  async listServices(
    @CurrentTenant() tenantId: string,
    @Query() pagination: PaginationDto,
    @Query('category') category?: string,
  ) {
    return firstValueFrom(
      this.coreClient.send(SERVICE_PATTERNS.LIST, {
        tenantId,
        category,
        ...pagination,
      }),
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get list of service categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async getCategories(@CurrentTenant() tenantId: string) {
    return firstValueFrom(this.coreClient.send(SERVICE_PATTERNS.GET_BY_CATEGORY, { tenantId }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service details', type: ServiceResponseDto })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async getService(@CurrentTenant() tenantId: string, @Param('id') serviceId: string) {
    return firstValueFrom(
      this.coreClient.send(SERVICE_PATTERNS.GET_BY_ID, {
        tenantId,
        serviceId,
      }),
    );
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new service' })
  @ApiBody({ type: CreateServiceDto })
  @ApiResponse({ status: 201, description: 'Service created', type: ServiceResponseDto })
  async createService(@CurrentTenant() tenantId: string, @Body() createDto: CreateServiceDto) {
    return firstValueFrom(
      this.coreClient.send(SERVICE_PATTERNS.CREATE, {
        tenantId,
        data: createDto,
      }),
    );
  }

  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update service' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiBody({ type: UpdateServiceDto })
  @ApiResponse({ status: 200, description: 'Service updated', type: ServiceResponseDto })
  async updateService(
    @CurrentTenant() tenantId: string,
    @Param('id') serviceId: string,
    @Body() updateDto: UpdateServiceDto,
  ) {
    return firstValueFrom(
      this.coreClient.send(SERVICE_PATTERNS.UPDATE, {
        tenantId,
        serviceId,
        data: updateDto,
      }),
    );
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete service' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service deleted' })
  async deleteService(@CurrentTenant() tenantId: string, @Param('id') serviceId: string) {
    return firstValueFrom(
      this.coreClient.send(SERVICE_PATTERNS.DELETE, {
        tenantId,
        serviceId,
      }),
    );
  }
}
