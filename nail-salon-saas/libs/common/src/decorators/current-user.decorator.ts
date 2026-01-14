import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ICurrentUser } from '../interfaces';

/**
 * Decorator to extract the current authenticated user from the request.
 *
 * Usage:
 * @Get('profile')
 * getProfile(@CurrentUser() user: ICurrentUser) {
 *   return user;
 * }
 *
 * // Or extract a specific property
 * @Get('profile')
 * getProfile(@CurrentUser('id') userId: string) {
 *   return userId;
 * }
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof ICurrentUser | undefined,
    ctx: ExecutionContext,
  ): ICurrentUser | string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as ICurrentUser | undefined;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
