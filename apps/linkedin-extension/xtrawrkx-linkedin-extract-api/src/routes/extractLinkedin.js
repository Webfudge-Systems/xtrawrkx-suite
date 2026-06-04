import { Router } from 'express';
import { ZodError } from 'zod';
import { extractRequestSchema } from '../schemas/extractSchemas.js';
import { cleanLinkedInHtml } from '../services/htmlCleaner.js';
import { storeRawHtmlForDebug } from '../services/debugHtmlStorage.js';
import { extractProfileWithAi } from '../services/linkedinAiExtract.js';
import { enrichLinkedInProfile } from '../services/profileEnrichment.js';
import { emptyEnrichmentPayload } from '../schemas/enrichmentSchemas.js';
import { logger } from '../logger.js';

export const extractLinkedinRouter = Router();

extractLinkedinRouter.post('/extract-linkedin', async (req, res, next) => {
  const { requestId } = req;

  try {
    const body = extractRequestSchema.parse(req.body);
    const { url, html, title, capturedAt } = body;

    await storeRawHtmlForDebug(html, { url, title, capturedAt }, requestId);

    const { cleanedHtml, stats } = cleanLinkedInHtml(html, { requestId });

    logger.debug('HTML cleaned', { requestId, stats });

    let profile;
    try {
      profile = await extractProfileWithAi(
        { cleanedHtml, url, title, capturedAt },
        requestId,
      );
    } catch (aiErr) {
      logger.error('AI extraction failed', {
        requestId,
        message: aiErr.message,
        stack: aiErr.stack,
      });

      if (aiErr instanceof SyntaxError || aiErr instanceof ZodError) {
        return res.status(502).json({
          error: {
            code: 'AI_PARSE_ERROR',
            message: 'Model returned data that could not be parsed',
            requestId,
          },
        });
      }

      const status = aiErr.status || aiErr.statusCode;
      if (status >= 400 && status < 500) {
        return res.status(502).json({
          error: {
            code: 'AI_CLIENT_ERROR',
            message: aiErr.message,
            requestId,
          },
        });
      }

      return res.status(502).json({
        error: {
          code: 'AI_UNAVAILABLE',
          message: 'The extraction service failed to complete',
          requestId,
        },
      });
    }

    res.setHeader('X-Cleaned-Bytes', String(stats.cleanedBytes));
    res.setHeader('X-HTML-Truncated', stats.truncatedInput || stats.truncatedOutput ? '1' : '0');
    logger.info('Extract success', {
      requestId,
      cleanedBytes: stats.cleanedBytes,
      truncatedInput: stats.truncatedInput,
      truncatedOutput: stats.truncatedOutput,
    });

    const skipEnrich =
      req.query.enrich === 'false' || req.query.enrich === '0';
    const responseBody = skipEnrich
      ? { linkedin: profile, ...emptyEnrichmentPayload() }
      : await enrichLinkedInProfile(profile, requestId);

    return res.status(200).json(responseBody);
  } catch (err) {
    next(err);
  }
});
