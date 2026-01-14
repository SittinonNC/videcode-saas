import { Controller, Get, Put, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UserRole } from '@app/common';
import { firstValueFrom } from 'rxjs';
import {
  CurrentTenant,
  CurrentUser,
  Roles,
  TENANT_PATTERNS,
  SERVICES,
  ICurrentUser,
  UpdateTenantDto,
  UpdateSubscriptionDto,
  TenantResponseDto,
} from '@app/common';

@ApiTags('Tenant')
@ApiBearerAuth('JWT-auth')
@Controller('tenant')
export class TenantController {
  constructor(@Inject(SERVICES.AUTH) private readonly authClient: ClientProxy) {}

  @Get()
  @ApiOperation({ summary: 'Get current tenant details' })
  @ApiResponse({ status: 200, description: 'Tenant details', type: TenantResponseDto })
  async getCurrentTenant(@CurrentTenant() tenantId: string) {
    return firstValueFrom(this.authClient.send(TENANT_PATTERNS.GET_BY_ID, { tenantId }));
  }

  @Put()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update tenant details' })
  @ApiBody({ type: UpdateTenantDto })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  async updateTenant(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: ICurrentUser,
    @Body() updateDto: UpdateTenantDto,
  ) {
    return firstValueFrom(
      this.authClient.send(TENANT_PATTERNS.UPDATE, {
        tenantId,
        userId: user.id,
        data: updateDto,
      }),
    );
  }

  @Put('subscription')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update subscription plan' })
  @ApiBody({ type: UpdateSubscriptionDto })
  @ApiResponse({ status: 200, description: 'Subscription updated' })
  async updateSubscription(
    @CurrentTenant() tenantId: string,
    @Body() subscriptionDto: UpdateSubscriptionDto,
  ) {
    return firstValueFrom(
      this.authClient.send(TENANT_PATTERNS.UPDATE_SUBSCRIPTION, {
        tenantId,
        data: subscriptionDto,
      }),
    );
  }
}
