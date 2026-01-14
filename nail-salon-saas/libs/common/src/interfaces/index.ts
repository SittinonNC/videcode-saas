import { UserRole } from '../enums';

// Re-export UserRole so consumers can import from either location
export { UserRole };

/**
 * Interface for the authenticated user payload extracted from JWT.
 */
export interface ICurrentUser {
  id: string;
  email: string;
  tenantId: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

/**
 * Interface for JWT payload structure.
 */
export interface IJwtPayload {
  sub: string; // User ID
  email: string;
  tenantId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Interface for tenant context in requests.
 */
export interface ITenantContext {
  tenantId: string;
  subdomain: string;
}

/**
 * Base interface for service responses.
 */
export interface IServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Interface for paginated responses.
 */
export interface IPaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Interface for microservice message payload.
 */
export interface IMicroservicePayload<T = unknown> {
  tenantId: string;
  userId?: string;
  data: T;
}

/**
 * Extended Express Request interface with tenant context
 */
export interface IRequestWithTenant {
  tenantId?: string;
  subdomain?: string;
  user?: ICurrentUser;
}
