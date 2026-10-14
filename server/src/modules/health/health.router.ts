import { Router } from 'express';
import { getHealth, getReadiness } from './health.controller.js';

export const healthRouter: Router = Router();

healthRouter.get('/', getHealth);
healthRouter.get('/ready', getReadiness);
