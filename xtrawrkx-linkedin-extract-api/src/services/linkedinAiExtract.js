import { config } from '../config.js';
import { logger } from '../logger.js';
import { parseProfileFromAiJson } from '../schemas/extractSchemas.js';
import {
  buildLinkedInProfilePromptMessages,
  estimateTokensFromChars,
} from '../prompts/linkedinProfileExtraction.js';
import { completeJsonWithAi } from './aiCompletion.js';

export async function extractProfileWithAi(
  { cleanedHtml, url, title, capturedAt },
  requestId,
) {
  const truncation = {
    maxChars: config.MAX_CLEANED_BYTES,
    maxEstimatedInputTokens: config.AI_MAX_ESTIMATED_INPUT_TOKENS,
  };

  const { system, user } = buildLinkedInProfilePromptMessages(
    cleanedHtml,
    { url, title, capturedAt },
    truncation,
  );

  const estimatedTokens = estimateTokensFromChars(system.length + user.length);
  logger.debug('Prompt built', {
    requestId,
    systemChars: system.length,
    userChars: user.length,
    estimatedInputTokensApprox: estimatedTokens,
  });

  const { text } = await completeJsonWithAi({
    system,
    user,
    requestId,
    logLabel: 'linkedin_extract',
    maxTokens: 8192,
    temperature: 0.2,
  });

  return parseProfileFromAiJson(text);
}
