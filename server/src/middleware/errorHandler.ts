import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { logger } from '../lib/logger.js';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Access denied'): ApiError {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Requested resource not found'): ApiError {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static payloadTooLarge(message = 'Request payload exceeds allowable limit'): ApiError {
    return new ApiError(413, 'PAYLOAD_TOO_LARGE', message);
  }

  static internal(message = 'An unexpected server error occurred'): ApiError {
    return new ApiError(500, 'INTERNAL_SERVER_ERROR', message);
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Endpoint not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  // Express requires 4 parameters to treat this as an error-handling middleware
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const errorCode = isApiError ? err.code : 'INTERNAL_SERVER_ERROR';

  // In production, do not leak unknown internal error messages or stack traces
  const isProduction = config.env === 'production';
  const message = isApiError
    ? err.message
    : isProduction
    ? 'An unexpected internal error occurred'
    : err.message || 'Internal Server Error';

  logger.error(`[Error Handler] ${req.method} ${req.originalUrl} (${statusCode}) - ${err.message}`, {
    code: errorCode,
    statusCode,
    stack: isProduction ? undefined : err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(isProduction ? {} : { stack: err.stack, details: isApiError ? err.details : undefined }),
    },
  });
}
