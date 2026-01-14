import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService, IJwtPayload, UserRole } from '@app/common';

interface RegisterDto {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

interface LoginDto {
  tenantId: string;
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user within a tenant
   */
  async register(dto: RegisterDto) {
    // Check if email already exists in tenant
    const existingUser = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: dto.tenantId,
          email: dto.email,
        },
      },
    });

    if (existingUser) {
      throw { code: 'EMAIL_EXISTS', message: 'Email already registered' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        tenantId: dto.tenantId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || UserRole.STAFF,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    this.logger.log(`User registered: ${user.email} in tenant: ${dto.tenantId}`);

    return {
      success: true,
      user,
    };
  }

  /**
   * Authenticate user and return JWT tokens
   */
  async login(dto: LoginDto) {
    let user;

    // If tenantId is provided, use compound unique key
    if (dto.tenantId) {
      user = await this.prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: dto.tenantId,
            email: dto.email,
          },
        },
      });
    } else {
      // If no tenantId, find user by email only (for easier login)
      user = await this.prisma.user.findFirst({
        where: { email: dto.email },
      });
    }

    if (!user) {
      throw { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
    }

    if (!user.isActive) {
      throw { code: 'ACCOUNT_DISABLED', message: 'Account is disabled' };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
    }

    // Generate JWT token
    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role as UserRole, // Cast Prisma enum to local enum
    };

    const accessToken = this.jwtService.sign(payload);

    // Update last login timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`User logged in: ${user.email}`);

    return {
      accessToken,
      expiresIn: 604800, // 7 days in seconds
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Validate JWT token and return payload
   */
  async validateToken(token: string): Promise<IJwtPayload> {
    return this.jwtService.verify(token);
  }

  /**
   * Initiate password reset flow
   */
  async initiatePasswordReset(tenantId: string, email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: { tenantId, email },
      },
    });

    if (user) {
      // In production, generate a reset token and send email
      // For now, just log it
      this.logger.log(`Password reset requested for: ${email}`);

      // TODO: Implement email sending with reset token
      // const resetToken = crypto.randomBytes(32).toString('hex');
      // await this.emailService.sendPasswordReset(email, resetToken);
    }

    return { success: true };
  }
}
