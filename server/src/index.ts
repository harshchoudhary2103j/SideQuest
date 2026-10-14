import type { Server } from 'node:http';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { logger } from './lib/logger.js';

const app = createApp();

const server: Server = app.listen(config.port, () => {
  logger.info(`SideQuest API listening on port ${config.port} [${config.env}]`);
  logger.info(`Allowed CORS origins: ${config.frontendOrigins.join(', ')}`);
  logger.info(
    `Supabase status: ${config.supabase.isConfigured ? 'Connected (' + config.supabase.url + ')' : 'Unconfigured (Mock/Local mode)'}`
  );
});

// Graceful Shutdown Handler
function handleShutdown(signal: string): void {
  logger.info(`Received ${signal}. Gracefully terminating SideQuest server...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force exit if close hangs
  setTimeout(() => {
    logger.error('Forcefully shutting down after timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
