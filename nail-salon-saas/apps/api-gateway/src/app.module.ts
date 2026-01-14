import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { APP_GUARD } from '@nestjs/core';

// Shared Library
import { DatabaseModule, createRedisClientOptions, SERVICES } from '@app/common';

// Middleware
import { TenantMiddleware } from './middleware/tenant.middleware';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

// Controllers
import { AuthController } from './auth/auth.controller';
import { TenantController } from './tenant/tenant.controller';
import { StaffController } from './core/staff.controller';
import { ServiceController } from './core/service.controller';
import { CustomerController } from './core/customer.controller';
import { BookingController } from './booking/booking.controller';
import { PaymentController } from './payment/payment.controller';
import { HealthController } from './health/health.controller';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // Config Module - Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database Module (Prisma)
    DatabaseModule,

    // Microservices Clients
    ClientsModule.register([
      {
        name: SERVICES.AUTH,
        ...createRedisClientOptions(SERVICES.AUTH),
      },
      {
        name: SERVICES.CORE,
        ...createRedisClientOptions(SERVICES.CORE),
      },
      {
        name: SERVICES.BOOKING,
        ...createRedisClientOptions(SERVICES.BOOKING),
      },
      {
        name: SERVICES.PAYMENT,
        ...createRedisClientOptions(SERVICES.PAYMENT),
      },
    ]),
  ],
  controllers: [
    HealthController,
    AuthController,
    TenantController,
    StaffController,
    ServiceController,
    CustomerController,
    BookingController,
    PaymentController,
  ],
  providers: [
    JwtStrategy,
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant middleware to all routes except health check
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'api/v1/health', method: RequestMethod.GET },
        { path: 'api/docs', method: RequestMethod.GET },
        { path: 'api/docs/(.*)', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
