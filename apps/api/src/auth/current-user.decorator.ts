import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export interface AuthUser { id: string; email: string; timezone: string }
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthUser => context.switchToHttp().getRequest().user);

