import winston from 'winston';
import { config } from './config.js';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

const devFormat = printf(({ level, message, requestId, ...meta }) => {
  const rid = requestId ? `[${requestId}] ` : '';
  const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${rid}${level}: ${message}${rest}`;
});

export const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format:
    config.NODE_ENV === 'production'
      ? combine(timestamp(), errors({ stack: true }), json())
      : combine(
          colorize(),
          timestamp({ format: 'HH:mm:ss' }),
          errors({ stack: true }),
          devFormat,
        ),
  defaultMeta: { service: 'linkedin-extract-api' },
  transports: [new winston.transports.Console()],
});

export function withRequestId(req) {
  return req.requestId || '—';
}
