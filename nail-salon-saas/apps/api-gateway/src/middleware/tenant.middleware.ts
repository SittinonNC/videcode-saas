import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService, IRequestWithTenant } from '@app/common';

/**
 * Middleware that extracts the subdomain from the request host
 * and resolves it to a tenant_id.
 *
 * The tenant context is then attached to the request object
 * for use by controllers and guards.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request & IRequestWithTenant, _res: Response, next: NextFunction) {
    try {
      const host = req.headers.host || req.hostname || '';

      // Extract subdomain from host
      // Expected formats:
      // - beautiful-nails.nailsalon.com
      // - beautiful-nails.localhost:3000
      // - localhost:3000 (for development - defaults to 'demo' tenant)

      const hostWithoutPort = host.split(':')[0];
      const parts = hostWithoutPort.split('.');

      let subdomain: string;

      if (parts.length === 1 || (parts.length === 2 && parts[1] === 'localhost')) {
        // Local development without subdomain
        // Use 'demo' as default or get from header
        subdomain = (req.headers['x-tenant-subdomain'] as string) || 'demo';
        this.logger.debug(`Development mode: Using subdomain from header or default: ${subdomain}`);
      } else {
        // Production: Extract first part as subdomain
        subdomain = parts[0];
      }

      // Skip tenant resolution for public registration endpoints
      if (req.path === '/api/v1/auth/register-tenant' || req.path === '/api/v1/health') {
        req.subdomain = subdomain;
        return next();
      }

      // Look up tenant by subdomain
      // Note: this.prisma.tenant will work after prisma generate is run
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prismaClient = this.prisma as any;
        if (prismaClient.tenant) {
          const tenant = await prismaClient.tenant.findUnique({
            where: { subdomain },
            select: { id: true, isActive: true, subdomain: true },
          });

          if (tenant && tenant.isActive) {
            req.tenantId = tenant.id;
            req.subdomain = subdomain;
            this.logger.debug(`Resolved tenant: ${subdomain} -> ${tenant.id}`);
          } else {
            this.logger.warn(`Tenant not found or inactive for subdomain: ${subdomain}`);
            req.subdomain = subdomain;
          }
        } else {
          // Prisma client not generated yet
          this.logger.warn('Prisma client not fully initialized. Run: npm run prisma:generate');
          req.subdomain = subdomain;
        }
      } catch (dbError) {
        this.logger.warn(`Database query failed: ${dbError}`);
        req.subdomain = subdomain;
      }

      next();
    } catch (error) {
      this.logger.error(`Error resolving tenant: ${(error as Error).message}`);
      next();
    }
  }
}
