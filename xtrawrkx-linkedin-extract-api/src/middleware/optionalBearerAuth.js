import { config } from '../config.js';
import { logger } from '../logger.js';

/**
 * When EXTRACT_API_SECRET is set, require Authorization: Bearer <secret>
 */
export function optionalBearerAuth(req, res, next) {
  if (!config.EXTRACT_API_SECRET) {
    return next();
  }

  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const token = match ? match[1].trim() : '';

  if (token !== config.EXTRACT_API_SECRET) {
    logger.warn('Unauthorized extract request', { requestId: req.requestId });
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing bearer token',
        requestId: req.requestId,
      },
    });
  }

  next();
}
