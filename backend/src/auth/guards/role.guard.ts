import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the required roles from the @Roles decorator
    const requiredRoles = this.reflector.get<UserRole[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    // If no roles specified, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get the user from the request (populated by JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Check if user's role matches required roles
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Access denied. Required role: ' + requiredRoles.join(', '));
    }

    return true;
  }
}
