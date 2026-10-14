import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = performance.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Math.round(performance.now() - start);
    const { statusCode } = res;

    // Skip noisy healthcheck logging if preferred, or log at debug level
    if (originalUrl === '/health' || originalUrl === '/api/v1/health') {
      logger.debug(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
      return;
    }

    const message = `${method} ${originalUrl} ${statusCode} [${duration}ms] - ${ip || 'unknown'}`;

    if (statusCode >= 500) {
      logger.error(message);
    } else if (statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });

  next();
}
