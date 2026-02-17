import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

/**
 * Global exception filter that catches all exceptions and returns
 * a consistent JSON error response format.
 *
 * - HttpException: returns the status and message from the exception
 * - Unknown exceptions: returns 500 with a generic message (details logged server-side)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = HttpStatus[statusCode] || 'Error';
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        // Handle class-validator array of messages
        if (Array.isArray(resp.message)) {
          message = resp.message.join('; ');
        } else {
          message = (resp.message as string) || exception.message;
        }
        error = (resp.error as string) || HttpStatus[statusCode] || 'Error';
      } else {
        message = exception.message;
        error = HttpStatus[statusCode] || 'Error';
      }
    } else {
      // Unexpected errors - log full details, return generic message
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Error interno del servidor';
      error = 'Internal Server Error';

      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );

      // Report unexpected errors to Sentry
      Sentry.captureException(exception);
    }

    const body: ErrorResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(body);
  }
}
