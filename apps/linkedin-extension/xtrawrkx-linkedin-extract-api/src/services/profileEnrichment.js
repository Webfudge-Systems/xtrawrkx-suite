import { config } from '../config.js';
import { logger } from '../logger.js';
import { completeJsonWithAi } from './aiCompletion.js';
import { searchPersonOnWeb } from './webSearch.js';
import {
  ENRICHMENT_MERGE_SYSTEM_PROMPT,
  buildEnrichmentMergeUserPayload,
} from '../prompts/profileEnrichmentMerge.js';
import {
  parseEnrichmentMergeFromAi,
  emptyEnrichmentPayload,
} from '../schemas/enrichmentSchemas.js';

/**
 * Web search (if configured) + AI merge → enrichment + insights.
 * @param {object} linkedinProfile — normalized profile from {@link parseProfileFromAiJson}
 */
export async function enrichLinkedInProfile(linkedinProfile, requestId) {
  if (!config.PROFILE_ENRICHMENT_ENABLED) {
    logger.debug('Profile enrichment disabled', { requestId });
    return assembleResponse(linkedinProfile, emptyEnrichmentPayload());
  }

  const searchMeta = await searchPersonOnWeb(
    linkedinProfile.name,
    linkedinProfile.headline,
    requestId,
  );

  const user = buildEnrichmentMergeUserPayload(linkedinProfile, searchMeta);

  try {
    const { text } = await completeJsonWithAi({
      system: ENRICHMENT_MERGE_SYSTEM_PROMPT,
      user,
      requestId,
      logLabel: 'profile_enrichment',
      maxTokens: 4096,
      temperature: 0.2,
    });

    const merged = parseEnrichmentMergeFromAi(text);
    return assembleResponse(linkedinProfile, merged);
  } catch (err) {
    logger.error('Enrichment merge AI failed', {
      requestId,
      message: err.message,
    });
    return assembleResponse(linkedinProfile, emptyEnrichmentPayload());
  }
}

function assembleResponse(linkedinProfile, { enrichment, insights }) {
  return {
    linkedin: linkedinProfile,
    enrichment,
    insights,
  };
}
