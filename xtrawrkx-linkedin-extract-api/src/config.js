import dotenv from 'dotenv';

dotenv.config();

const envSchema = {
  PORT: parsePositiveInt(process.env.PORT, 3847),
  NODE_ENV: process.env.NODE_ENV || 'development',
  AI_PROVIDER: (process.env.AI_PROVIDER || 'anthropic').toLowerCase(),
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  ANTHROPIC_MODEL:
    process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  MAX_HTML_BYTES: parsePositiveInt(process.env.MAX_HTML_BYTES, 2_500_000),
  MAX_CLEANED_BYTES: parsePositiveInt(process.env.MAX_CLEANED_BYTES, 400_000),
  /** Cap HTML embedded in user prompt by estimated tokenizer budget (chars ≈ tokens × 3.5). */
  AI_MAX_ESTIMATED_INPUT_TOKENS: parsePositiveInt(
    process.env.AI_MAX_ESTIMATED_INPUT_TOKENS,
    28_000,
  ),
  EXTRACT_API_SECRET: process.env.EXTRACT_API_SECRET || '',
  DEBUG_HTML_DIR: process.env.DEBUG_HTML_DIR || './storage/debug',
  DEBUG_HTML_MAX_FILES: parsePositiveInt(process.env.DEBUG_HTML_MAX_FILES, 50),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  PROFILE_ENRICHMENT_ENABLED: parseEnvBoolean(
    process.env.PROFILE_ENRICHMENT_ENABLED,
    true,
  ),
  /** auto | serpapi | google | none */
  SEARCH_PROVIDER: (process.env.SEARCH_PROVIDER || 'auto').toLowerCase(),
  SERPAPI_API_KEY: process.env.SERPAPI_API_KEY || '',
  GOOGLE_SEARCH_API_KEY: process.env.GOOGLE_SEARCH_API_KEY || '',
  GOOGLE_SEARCH_CX: process.env.GOOGLE_SEARCH_CX || '',
  WEB_SEARCH_NUM_RESULTS: Math.min(
    10,
    Math.max(1, parsePositiveInt(process.env.WEB_SEARCH_NUM_RESULTS, 10)),
  ),
};

function parsePositiveInt(val, fallback) {
  const n = Number.parseInt(String(val), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseEnvBoolean(val, defaultValue) {
  if (val === undefined || val === '') return defaultValue;
  return !['false', '0', 'no', 'off'].includes(
    String(val).toLowerCase().trim(),
  );
}

function validateAiConfig() {
  const { AI_PROVIDER, ANTHROPIC_API_KEY, OPENAI_API_KEY } = envSchema;
  if (AI_PROVIDER === 'anthropic' && !ANTHROPIC_API_KEY) {
    throw new Error('AI_PROVIDER=anthropic requires ANTHROPIC_API_KEY');
  }
  if (AI_PROVIDER === 'openai' && !OPENAI_API_KEY) {
    throw new Error('AI_PROVIDER=openai requires OPENAI_API_KEY');
  }
  if (AI_PROVIDER !== 'anthropic' && AI_PROVIDER !== 'openai') {
    throw new Error('AI_PROVIDER must be "anthropic" or "openai"');
  }
}

export const config = envSchema;
export { validateAiConfig };
