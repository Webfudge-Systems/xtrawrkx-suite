import { Router } from 'express';
import { ZodError } from 'zod';
import { generateOutreachRequestSchema } from '../schemas/outreachSchemas.js';
import { generateOutreachMessages } from '../services/outreachAi.js';
import { logger } from '../logger.js';

export const generateOutreachRouter = Router();

generateOutreachRouter.post('/generate-outreach', async (req, res, next) => {
  const { requestId } = req;

  try {
    const body = generateOutreachRequestSchema.parse(req.body || {});
    const hasAny =
      (body.linkedin && Object.keys(body.linkedin).length > 0) ||
      (body.linkedinProfileData &&
        typeof body.linkedinProfileData === 'object' &&
        Object.keys(body.linkedinProfileData).length > 0) ||
      (body.persona && String(body.persona).trim()) ||
      (Array.isArray(body.potential_needs) && body.potential_needs.length > 0);

    if (!hasAny) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message:
            'Provide linkedin, linkedinProfileData, persona, and/or potential_needs',
          requestId,
        },
      });
    }

    const messages = await generateOutreachMessages(body, requestId);
    logger.info('Outreach generated', { requestId });
    return res.status(200).json(messages);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: err.flatten(),
          requestId,
        },
      });
    }
    if (err instanceof SyntaxError) {
      logger.error('Outreach parse error', { requestId, message: err.message });
      return res.status(502).json({
        error: {
          code: 'AI_PARSE_ERROR',
          message: 'Could not parse model output',
          requestId,
        },
      });
    }
    next(err);
  }
});
