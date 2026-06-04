import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { optionalBearerAuth } from './middleware/optionalBearerAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { extractLinkedinRouter } from './routes/extractLinkedin.js';
import { generateOutreachRouter } from './routes/generateOutreach.js';
import { logger } from './logger.js';

const jsonLimitBytes = Math.min(config.MAX_HTML_BYTES + 50_000, 3_500_000);

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.NODE_ENV === 'production' ? 1 : false);

  app.use(requestIdMiddleware);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const corsOrigin =
    config.CORS_ORIGIN === '*'
      ? true
      : config.CORS_ORIGIN.split(',').map((o) => o.trim());

  app.use(
    cors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Request-Id',
        'X-Correlation-Id',
      ],
      maxAge: 86400,
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: jsonLimitBytes }));

  if (config.NODE_ENV === 'production') {
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 120,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
          logger.warn('Rate limit', { requestId: req.requestId });
          res.status(429).json({
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many requests',
              requestId: req.requestId,
            },
          });
        },
      }),
    );
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({
      ok: true,
      service: 'linkedin-extract-api',
      uptime: process.uptime(),
    });
  });

  app.use(optionalBearerAuth);
  app.use(extractLinkedinRouter);
  app.use(generateOutreachRouter);

  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `No route ${req.method} ${req.path}`,
        requestId: req.requestId,
      },
    });
  });

  app.use(errorHandler);

  return app;
}
