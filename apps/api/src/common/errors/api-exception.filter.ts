import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : null;
    const body = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
    const validation = Array.isArray(body.message) ? body.message : undefined;
    response.status(status).json({
      error: {
        code: typeof body.code === 'string' ? body.code : validation ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
        message: validation ? 'Request validation failed' : typeof body.message === 'string' ? body.message : 'Unexpected server error',
        ...(body.details !== undefined || validation ? { details: body.details ?? validation } : {}),
      },
    });
  }
}

