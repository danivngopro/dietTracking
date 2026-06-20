import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class OriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return true;
    const expected = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
    const origin = request.headers.origin;
    if (origin === expected) return true;
    if (process.env.NODE_ENV !== 'production' && !origin) return true;
    throw new ForbiddenException({ code: 'INVALID_ORIGIN', message: 'Request origin is not allowed' });
  }
}

