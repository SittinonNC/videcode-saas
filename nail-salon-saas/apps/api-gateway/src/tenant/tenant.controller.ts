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

  @Put('payment-settings')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update payment settings (bank info & LINE)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bankName: { type: 'string', example: 'กสิกรไทย' },
        bankAccountNo: { type: 'string', example: '123-4-56789-0' },
        bankAccountName: { type: 'string', example: 'ร้านทำเล็บ ABC' },
        lineUserId: { type: 'string', example: 'U1234567890abcdef...' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Payment settings updated' })
  async updatePaymentSettings(
    @CurrentTenant() tenantId: string,
    @Body()
    settingsDto: {
      bankName?: string;
      bankAccountNo?: string;
      bankAccountName?: string;
      lineUserId?: string;
    },
  ) {
    return firstValueFrom(
      this.authClient.send(TENANT_PATTERNS.UPDATE, {
        tenantId,
        data: settingsDto,
      }),
    );
  }
}
