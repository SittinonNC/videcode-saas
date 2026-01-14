import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '@app/common';
import { IJwtPayload, ICurrentUser, IRequestWithTenant } from '@app/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest() as IRequestWithTenant & {
      headers: { authorization?: string };
    };
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({
        code: 'TOKEN_MISSING',
        message: 'Authentication token is required',
      });
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');

      if (!secret) {
        throw new UnauthorizedException({
          code: 'CONFIG_ERROR',
          message: 'JWT secret not configured',
        });
      }

      const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

      // Map to our payload interface
      const payload: IJwtPayload = {
        sub: decoded.sub as string,
        email: decoded.email as string,
        tenantId: decoded.tenantId as string,
        role: decoded.role,
        iat: decoded.iat,
        exp: decoded.exp,
      };

      // Attach user to request
      const user: ICurrentUser = {
        id: payload.sub,
        email: payload.email,
        tenantId: payload.tenantId,
        role: payload.role,
        firstName: '', // Will be populated if needed
        lastName: '',
      };

      request.user = user;

      // Verify user's tenant matches request tenant (if tenant context exists)
      if (request.tenantId && payload.tenantId !== request.tenantId) {
        throw new UnauthorizedException({
          code: 'TENANT_MISMATCH',
          message: 'User does not belong to this tenant',
        });
      }

      return true;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException({
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
        });
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException({
          code: 'TOKEN_INVALID',
          message: 'Invalid authentication token',
        });
      }

      throw error;
    }
  }

  private extractTokenFromHeader(request: { headers: { authorization?: string } }): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
