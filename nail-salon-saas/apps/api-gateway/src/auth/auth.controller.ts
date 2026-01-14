import { Controller, Post, Body, Inject, HttpCode, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import {
  Public,
  CurrentTenant,
  AUTH_PATTERNS,
  TENANT_PATTERNS,
  SERVICES,
  LoginDto,
  RegisterDto,
  CreateTenantDto,
  AuthResponseDto,
  ResetPasswordDto,
} from '@app/common';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(SERVICES.AUTH) private readonly authClient: ClientProxy) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user within a tenant' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto, @CurrentTenant() tenantId: string) {
    return firstValueFrom(
      this.authClient.send(AUTH_PATTERNS.REGISTER, {
        ...registerDto,
        tenantId,
      }),
    );
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and receive tokens' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @CurrentTenant() tenantId: string) {
    // For login, if no tenantId is resolved from subdomain, we'll let auth-service handle it
    return firstValueFrom(
      this.authClient.send(AUTH_PATTERNS.LOGIN, {
        ...loginDto,
        tenantId: tenantId || null,
      }),
    );
  }

  @Public()
  @Post('register-tenant')
  @ApiOperation({ summary: 'Register a new tenant (shop) with owner account' })
  @ApiBody({ type: CreateTenantDto })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 409, description: 'Subdomain already taken' })
  async registerTenant(@Body() createTenantDto: CreateTenantDto) {
    return firstValueFrom(this.authClient.send(TENANT_PATTERNS.CREATE, createTenantDto));
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Reset email sent if account exists' })
  async resetPassword(@Body() resetDto: ResetPasswordDto, @CurrentTenant() tenantId: string) {
    return firstValueFrom(
      this.authClient.send(AUTH_PATTERNS.RESET_PASSWORD, {
        ...resetDto,
        tenantId,
      }),
    );
  }
}
