import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal error occurred. Please check server logs.';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message || exception.message;
        error = resObj.error || error;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      // Diagnostic log on server side only - stack trace never sent to user
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
      
      // Known helpful hints
      if (exception.message.includes('ECONNREFUSED')) {
        message = 'Cannot connect to background service or database.';
      } else if (exception.message.includes('PrismaClientInitializationError')) {
        message = 'Database connection failure. Verify PostgreSQL is running.';
      }
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
    });
  }
}
