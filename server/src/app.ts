import express, { type Express } from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { healthRouter } from './modules/health/health.router.js';
import { apiV1Router } from './modules/router.js';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // 2. CORS Policy
  app.use(corsMiddleware);

  // 3. Body Parsing with Safe Payload Limits (1 MB)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4. Request Logging (Tokens & Passwords Redacted)
  app.use(requestLogger);

  // 5. Root & Health Endpoints
  app.use('/health', healthRouter);
  app.get('/', (_req, res) => {
    res.status(200).json({
      name: 'SideQuest API',
      status: 'operational',
      documentation: '/docs',
      health: '/health',
      apiV1: '/api/v1',
    });
  });

  // 6. Modular API v1 Routes
  app.use('/api/v1', apiV1Router);

  // 7. Not Found (404) Handler
  app.use(notFoundHandler);

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
