import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AUTH_PATTERNS, UserRole } from '@app/common';
import { AuthService } from './auth.service';

interface RegisterPayload {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole | string;
}

interface LoginPayload {
  tenantId: string;
  email: string;
  password: string;
}

interface ResetPasswordPayload {
  tenantId: string;
  email: string;
}

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_PATTERNS.REGISTER)
  async register(@Payload() payload: RegisterPayload) {
    try {
      this.logger.debug(`Register user: ${payload.email} for tenant: ${payload.tenantId}`);
      // Cast role to UserRole if provided as string
      const registerDto = {
        ...payload,
        role: payload.role ? (payload.role as UserRole) : undefined,
      };
      return await this.authService.register(registerDto);
    } catch (error) {
      this.logger.error(`Registration failed: ${(error as Error).message}`);
      throw new RpcException({
        code: (error as { code?: string }).code || 'REGISTRATION_FAILED',
        message: (error as Error).message,
      });
    }
  }

  @MessagePattern(AUTH_PATTERNS.LOGIN)
  async login(@Payload() payload: LoginPayload) {
    try {
      this.logger.debug(`Login attempt: ${payload.email}`);
      return await this.authService.login(payload);
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      throw new RpcException({
        code: error.code || 'LOGIN_FAILED',
        message: error.message,
      });
    }
  }

  @MessagePattern(AUTH_PATTERNS.VALIDATE_TOKEN)
  async validateToken(@Payload() payload: { token: string }) {
    try {
      return await this.authService.validateToken(payload.token);
    } catch (error) {
      throw new RpcException({
        code: 'TOKEN_INVALID',
        message: error.message,
      });
    }
  }

  @MessagePattern(AUTH_PATTERNS.RESET_PASSWORD)
  async resetPassword(@Payload() payload: ResetPasswordPayload) {
    try {
      this.logger.debug(`Password reset request for: ${payload.email}`);
      return await this.authService.initiatePasswordReset(payload.tenantId, payload.email);
    } catch (error) {
      // Don't reveal if email exists or not
      return { success: true, message: 'If the email exists, a reset link has been sent.' };
    }
  }
}
