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
  STAFF_PATTERNS,
  SERVICES,
  CreateStaffDto,
  UpdateStaffDto,
  StaffResponseDto,
  PaginationDto,
} from '@app/common';

@ApiTags('Staff')
@ApiBearerAuth('JWT-auth')
@Controller('staff')
export class StaffController {
  constructor(@Inject(SERVICES.CORE) private readonly coreClient: ClientProxy) {}

  @Get()
  @ApiOperation({ summary: 'List all staff members' })
  @ApiResponse({ status: 200, description: 'List of staff', type: [StaffResponseDto] })
  async listStaff(@CurrentTenant() tenantId: string, @Query() pagination: PaginationDto) {
    return firstValueFrom(
      this.coreClient.send(STAFF_PATTERNS.LIST, {
        tenantId,
        ...pagination,
      }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get staff member by ID' })
  @ApiParam({ name: 'id', description: 'Staff ID' })
  @ApiResponse({ status: 200, description: 'Staff details', type: StaffResponseDto })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  async getStaff(@CurrentTenant() tenantId: string, @Param('id') staffId: string) {
    return firstValueFrom(
      this.coreClient.send(STAFF_PATTERNS.GET_BY_ID, {
        tenantId,
        staffId,
      }),
    );
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new staff member' })
  @ApiBody({ type: CreateStaffDto })
  @ApiResponse({ status: 201, description: 'Staff created', type: StaffResponseDto })
  async createStaff(@CurrentTenant() tenantId: string, @Body() createDto: CreateStaffDto) {
    return firstValueFrom(
      this.coreClient.send(STAFF_PATTERNS.CREATE, {
        tenantId,
        data: createDto,
      }),
    );
  }

  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update staff member' })
  @ApiParam({ name: 'id', description: 'Staff ID' })
  @ApiBody({ type: UpdateStaffDto })
  @ApiResponse({ status: 200, description: 'Staff updated', type: StaffResponseDto })
  async updateStaff(
    @CurrentTenant() tenantId: string,
    @Param('id') staffId: string,
    @Body() updateDto: UpdateStaffDto,
  ) {
    return firstValueFrom(
      this.coreClient.send(STAFF_PATTERNS.UPDATE, {
        tenantId,
        staffId,
        data: updateDto,
      }),
    );
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete staff member' })
  @ApiParam({ name: 'id', description: 'Staff ID' })
  @ApiResponse({ status: 200, description: 'Staff deleted' })
  async deleteStaff(@CurrentTenant() tenantId: string, @Param('id') staffId: string) {
    return firstValueFrom(
      this.coreClient.send(STAFF_PATTERNS.DELETE, {
        tenantId,
        staffId,
      }),
    );
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get staff availability for a date' })
  @ApiParam({ name: 'id', description: 'Staff ID' })
  @ApiResponse({ status: 200, description: 'Availability slots' })
  async getAvailability(
    @CurrentTenant() tenantId: string,
    @Param('id') staffId: string,
    @Query('date') date: string,
  ) {
    return firstValueFrom(
      this.coreClient.send(STAFF_PATTERNS.GET_AVAILABILITY, {
        tenantId,
        staffId,
        date,
      }),
    );
  }
}
