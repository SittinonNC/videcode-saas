import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { IRequestWithTenant } from '../interfaces';

/**
 * Guard to ensure tenant context is present in HTTP requests.
 * Used in API Gateway after TenantMiddleware has resolved the tenant.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest() as IRequestWithTenant;
    const tenantId = request.tenantId;

    if (!tenantId) {
      throw new ForbiddenException({
        code: 'TENANT_NOT_FOUND',
        message:
          'Unable to resolve tenant from request. Please ensure you are accessing via a valid subdomain.',
      });
    }

    return true;
  }
}

/**
 * Guard to ensure tenant context is present in RPC messages.
 * Used in microservices.
 */
@Injectable()
export class RpcTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const data = context.switchToRpc().getData() as { tenantId?: string };
    const tenantId = data?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException({
        code: 'TENANT_NOT_FOUND',
        message: 'Tenant ID is required in message payload.',
      });
    }

    return true;
  }
}
