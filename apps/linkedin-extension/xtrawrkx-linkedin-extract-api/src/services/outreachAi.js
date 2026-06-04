import { completeJsonWithAi } from './aiCompletion.js';
import { logger } from '../logger.js';
import {
  OUTREACH_SYSTEM_PROMPT,
  buildOutreachUserPrompt,
} from '../prompts/outreachGeneration.js';
import { parseOutreachResponseFromAi } from '../schemas/outreachSchemas.js';

/**
 * Normalize client body into model context + resolve persona / needs.
 */
export function buildOutreachContext(body) {
  let linkedin = body.linkedin;
  let enrichment = body.enrichment;
  let insights = body.insights;

  if (body.linkedinProfileData && typeof body.linkedinProfileData === 'object') {
    const snap = body.linkedinProfileData;
    linkedin = linkedin || snap.linkedin;
    enrichment = enrichment || snap.enrichment;
    insights = insights || snap.insights;
  }

  const persona =
    (body.persona && String(body.persona).trim()) ||
    (insights && insights.persona) ||
    '';

  const potential_needs = Array.isArray(body.potential_needs)
    ? body.potential_needs
    : insights && Array.isArray(insights.potential_needs)
      ? insights.potential_needs
      : [];

  return {
    linkedin: linkedin && typeof linkedin === 'object' ? linkedin : {},
    enrichment: enrichment && typeof enrichment === 'object' ? enrichment : {},
    insights: insights && typeof insights === 'object' ? insights : {},
    persona,
    potential_needs: potential_needs.map((s) => String(s).trim()).filter(Boolean),
  };
}

export async function generateOutreachMessages(body, requestId) {
  const context = buildOutreachContext(body);

  const user = buildOutreachUserPrompt(context);

  logger.debug('Outreach generation context', {
    requestId,
    hasLinkedin: Object.keys(context.linkedin).length > 0,
    persona: context.persona,
    needsCount: context.potential_needs.length,
  });

  const { text } = await completeJsonWithAi({
    system: OUTREACH_SYSTEM_PROMPT,
    user,
    requestId,
    logLabel: 'outreach_generate',
    maxTokens: 4096,
    temperature: 0.55,
  });

  return parseOutreachResponseFromAi(text);
}
