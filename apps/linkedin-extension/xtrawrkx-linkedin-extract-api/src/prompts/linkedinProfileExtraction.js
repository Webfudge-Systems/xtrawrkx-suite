/**
 * Reusable prompts + safe HTML truncation for LinkedIn profile extraction.
 * Use with any chat-completions or messages API (OpenAI, Anthropic, etc.).
 */

/** Conservative heuristic for Latin-heavy text; tune per locale if needed. */
export const DEFAULT_CHARS_PER_TOKEN = 3.5;

export const LINKEDIN_PROFILE_SYSTEM_PROMPT =
  'You are an expert data extraction engine. Extract structured professional profile data from raw LinkedIn HTML.';

const JSON_FORMAT_SPEC = `Return ONLY valid JSON in this format:

{
  "name": "",
  "headline": "",
  "location": "",
  "about": "",
  "followers": "",
  "connections": "",
  "experience": [
    {
      "title": "",
      "company": "",
      "duration": "",
      "description": ""
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "duration": ""
    }
  ],
  "skills": []
}`;

const EXTRACTION_RULES = `Rules:
- Do not hallucinate data
- If data not found, return empty string or empty array
- Keep text clean and readable
- Remove duplicates
- Prioritize accuracy over completeness`;

/**
 * Estimated token count from character length (no tokenizer; safe upper bound for budgeting).
 */
export function estimateTokensFromChars(charLength, charsPerToken = DEFAULT_CHARS_PER_TOKEN) {
  if (charLength <= 0) return 0;
  return Math.ceil(charLength / charsPerToken);
}

/**
 * Max UTF-8 bytes (or string length budget) from a target input-token budget.
 */
export function estimateCharBudgetForTokens(
  maxInputTokens,
  charsPerToken = DEFAULT_CHARS_PER_TOKEN,
) {
  if (!Number.isFinite(maxInputTokens) || maxInputTokens <= 0) return Number.POSITIVE_INFINITY;
  return Math.floor(maxInputTokens * charsPerToken);
}

/**
 * Truncate HTML (or any string) safely on UTF-8 boundaries.
 * Respects maxChars (byte length) and/or maxEstimatedInputTokens.
 */
export function truncateHtmlForModel(html, options = {}) {
  if (typeof html !== 'string' || html.length === 0) return html;

  const {
    maxChars,
    maxEstimatedInputTokens,
    charsPerToken = DEFAULT_CHARS_PER_TOKEN,
    ellipsis = '\n\n[... HTML truncated for model context ...]',
  } = options;

  let byteLimit = Number.POSITIVE_INFINITY;
  if (Number.isFinite(maxChars) && maxChars > 0) {
    byteLimit = Math.min(byteLimit, maxChars);
  }
  if (Number.isFinite(maxEstimatedInputTokens) && maxEstimatedInputTokens > 0) {
    byteLimit = Math.min(
      byteLimit,
      estimateCharBudgetForTokens(maxEstimatedInputTokens, charsPerToken),
    );
  }

  if (!Number.isFinite(byteLimit) || byteLimit === Number.POSITIVE_INFINITY) {
    return html;
  }

  const buf = Buffer.from(html, 'utf8');
  if (buf.length <= byteLimit) return html;

  const ellipsisBuf = Buffer.from(ellipsis, 'utf8');
  const cut = Math.max(0, byteLimit - ellipsisBuf.length);
  return buf.subarray(0, cut).toString('utf8') + ellipsis;
}

/**
 * Build the user message for LinkedIn extraction (metadata + truncated HTML).
 *
 * @param {string} html - Raw or cleaned profile HTML
 * @param {object} [context]
 * @param {string} [context.url]
 * @param {string} [context.title]
 * @param {string} [context.capturedAt]
 * @param {object} [truncation] - passed to {@link truncateHtmlForModel}
 */
export function buildLinkedInProfileUserPrompt(html, context = {}, truncation = {}) {
  const { url, title, capturedAt } = context;

  const metaLines = [
    url ? `Profile URL: ${url}` : null,
    title ? `Document title: ${title}` : null,
    capturedAt ? `Captured at (ISO): ${capturedAt}` : null,
  ].filter(Boolean);

  const metaBlock = metaLines.length ? `${metaLines.join('\n')}\n\n` : '';

  const bodyHtml = truncateHtmlForModel(html, truncation);

  return `${metaBlock}Given the following LinkedIn profile HTML, extract structured data.

${JSON_FORMAT_SPEC}

${EXTRACTION_RULES}

--- LinkedIn profile HTML ---
${bodyHtml}`;
}

/**
 * Full message pair for APIs that take separate system + user strings.
 */
export function buildLinkedInProfilePromptMessages(html, context = {}, truncation = {}) {
  return {
    system: LINKEDIN_PROFILE_SYSTEM_PROMPT,
    user: buildLinkedInProfileUserPrompt(html, context, truncation),
  };
}
