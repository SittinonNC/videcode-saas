import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../interfaces';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for an endpoint.
 *
 * Usage:
 * @Roles(UserRole.OWNER, UserRole.MANAGER)
 * @Get('admin/dashboard')
 * getAdminDashboard() {
 *   return this.dashboardService.getAdminData();
 * }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
