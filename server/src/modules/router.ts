import { Router } from 'express';
import { healthRouter } from './health/health.router.js';

export const apiV1Router: Router = Router();

// Mount modules
apiV1Router.use('/health', healthRouter);

// Scaffolding for upcoming Phase 3B feature routes:
// apiV1Router.use('/squads', squadsRouter);
// apiV1Router.use('/missions', missionsRouter);
