import { Router } from 'express';
import { healthRouter } from './health/health.router.js';
import { authRouter } from './auth/auth.router.js';
import { missionsRouter } from './missions/missions.router.js';

export const apiV1Router: Router = Router();

// Mount modules
apiV1Router.use('/health', healthRouter);
apiV1Router.use('/auth', authRouter);
apiV1Router.use('/missions', missionsRouter);

