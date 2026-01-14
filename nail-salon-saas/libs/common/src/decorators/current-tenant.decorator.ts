import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the current tenant ID from the request.
 * The tenant is resolved from the subdomain by TenantMiddleware.
 *
 * Usage:
 * @Get('services')
 * getServices(@CurrentTenant() tenantId: string) {
 *   return this.serviceService.findAll(tenantId);
 * }
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    // Return tenantId from middleware resolution OR from authenticated user token
    return request.tenantId || request.user?.tenantId;
  },
);

/**
 * For microservices - extract tenant from message payload
 */
export const CurrentTenantFromPayload = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const payload = ctx.switchToRpc().getData();
    return payload.tenantId;
  },
);
