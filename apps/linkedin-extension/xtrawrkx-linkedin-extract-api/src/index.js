import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config, validateAiConfig } from './config.js';
import { logger } from './logger.js';

try {
  validateAiConfig();
} catch (e) {
  logger.error('Invalid configuration', { message: e.message });
  process.exit(1);
}

const app = createApp();
const server = createServer(app);

server.listen(config.PORT, () => {
  logger.info('Server listening', {
    port: config.PORT,
    env: config.NODE_ENV,
    aiProvider: config.AI_PROVIDER,
  });
});

function shutdown(signal) {
  logger.info(`${signal} received, closing`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', {
    reason: reason instanceof Error ? reason.message : reason,
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
  process.exit(1);
});
