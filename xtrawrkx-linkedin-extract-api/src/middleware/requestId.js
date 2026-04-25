import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req, res, next) {
  const incoming =
    req.headers['x-request-id'] || req.headers['x-correlation-id'];
  req.requestId =
    typeof incoming === 'string' && incoming.length <= 128
      ? incoming
      : uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
