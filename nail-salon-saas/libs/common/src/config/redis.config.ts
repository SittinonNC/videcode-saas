import { Transport, RedisOptions } from '@nestjs/microservices';

/**
 * Factory function to create Redis microservice options.
 * Used by microservices to connect to Redis transport layer.
 */
export const createRedisOptions = (name?: string): RedisOptions => ({
  transport: Transport.REDIS,
  options: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    retryAttempts: 5,
    retryDelay: 1000,
    ...(name && { name }),
  },
});

/**
 * Factory function to create Redis client options for API Gateway.
 * Used to connect to microservices via Redis.
 */
export const createRedisClientOptions = (name: string): RedisOptions => ({
  transport: Transport.REDIS,
  options: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    retryAttempts: 5,
    retryDelay: 1000,
  },
});

/**
 * Service names for ClientProxy registration.
 */
export const SERVICES = {
  AUTH: 'AUTH_SERVICE',
  CORE: 'CORE_SERVICE',
  BOOKING: 'BOOKING_SERVICE',
  PAYMENT: 'PAYMENT_SERVICE',
} as const;

export type ServiceName = (typeof SERVICES)[keyof typeof SERVICES];
