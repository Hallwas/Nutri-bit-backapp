import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// uso: @Roles('admin') + @UseGuards(RolesGuard)
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(ctx: ExecutionContext): boolean {
        const roles = this.reflector.getAllAndOverride<string[]>('roles', [ctx.getHandler(), ctx.getClass()]);
        if (!roles || roles.length === 0) return true;
        const req = ctx.switchToHttp().getRequest<any>();
        if (!roles.includes(req.user?.role)) {
            throw new ForbiddenException('Acesso restrito a administradores.');
        }
        return true;
    }
}
