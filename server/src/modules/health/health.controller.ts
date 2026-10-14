import type { Request, Response } from 'express';
import { config } from '../../config/env.js';

export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    service: 'sidequest-api',
    version: '0.1.0',
    environment: config.env,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      configured: config.supabase.isConfigured,
      hasServiceRole: Boolean(config.supabase.serviceRoleKey),
    },
  });
}

export function getReadiness(_req: Request, res: Response): void {
  // If in production, verify required configurations
  if (config.env === 'production' && !config.supabase.isConfigured) {
    res.status(503).json({
      status: 'not_ready',
      reason: 'Supabase configuration is required in production environment.',
    });
    return;
  }

  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
}
