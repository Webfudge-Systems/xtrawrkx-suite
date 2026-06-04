import { ZodError } from 'zod';
import { logger } from '../logger.js';

export function errorHandler(err, req, res, _next) {
  const requestId = req.requestId;

  if (err instanceof ZodError) {
    logger.warn('Validation error', {
      requestId,
      issues: err.issues,
    });
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.flatten(),
        requestId,
      },
    });
  }

  if (err.status === 413 || err.type === 'entity.too.large') {
    return res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'JSON body exceeds size limit',
        requestId,
      },
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Payload too large',
        requestId,
      },
    });
  }

  const status = err.statusCode || err.status || 500;
  const isClient = status >= 400 && status < 500;

  if (isClient) {
    logger.warn('Client error', {
      requestId,
      status,
      message: err.message,
    });
    return res.status(status).json({
      error: {
        code: err.code || 'CLIENT_ERROR',
        message: err.message,
        requestId,
      },
    });
  }

  logger.error('Unhandled error', {
    requestId,
    message: err.message,
    stack: err.stack,
  });

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
      requestId,
    },
  });
}
