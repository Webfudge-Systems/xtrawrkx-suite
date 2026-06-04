import { config } from '../config.js';
import { logger } from '../logger.js';

/**
 * @typedef {{ title: string, link: string, snippet: string }} SearchHit
 */

function resolveProvider() {
  const explicit = (config.SEARCH_PROVIDER || 'auto').toLowerCase();
  if (explicit === 'none') return 'none';
  if (explicit === 'serpapi' && config.SERPAPI_API_KEY) return 'serpapi';
  if (
    explicit === 'google' &&
    config.GOOGLE_SEARCH_API_KEY &&
    config.GOOGLE_SEARCH_CX
  ) {
    return 'google';
  }
  if (explicit === 'auto' || !explicit) {
    if (config.SERPAPI_API_KEY) return 'serpapi';
    if (config.GOOGLE_SEARCH_API_KEY && config.GOOGLE_SEARCH_CX) {
      return 'google';
    }
  }
  return 'none';
}

/**
 * Web search for "<name> <headline>" (LinkedIn enrichment).
 * @returns {Promise<{ query: string, provider: string, results: SearchHit[] }>}
 */
export async function searchPersonOnWeb(name, headline, requestId) {
  const query = [name, headline].filter(Boolean).join(' ').trim();
  if (query.length < 2) {
    return { query, provider: 'none', results: [] };
  }

  const provider = resolveProvider();
  if (provider === 'none') {
    logger.debug('Web search skipped (no provider configured)', { requestId, query });
    return { query, provider: 'none', results: [] };
  }

  try {
    if (provider === 'serpapi') {
      const results = await serpApiSearch(query, requestId);
      return { query, provider, results };
    }
    if (provider === 'google') {
      const results = await googleCustomSearch(query, requestId);
      return { query, provider, results };
    }
  } catch (err) {
    logger.error('Web search failed', {
      requestId,
      provider,
      message: err.message,
    });
    return { query, provider, results: [] };
  }

  return { query, provider: 'none', results: [] };
}

async function serpApiSearch(query, requestId) {
  const params = new URLSearchParams({
    engine: 'google',
    q: query,
    api_key: config.SERPAPI_API_KEY,
    num: String(Math.min(10, config.WEB_SEARCH_NUM_RESULTS)),
  });

  const url = `https://serpapi.com/search.json?${params}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SerpAPI HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const organic = data.organic_results || [];

  logger.info('SerpAPI search done', {
    requestId,
    hits: organic.length,
  });

  return organic.slice(0, 10).map((r) => ({
    title: String(r.title || ''),
    link: String(r.link || ''),
    snippet: String(r.snippet || ''),
  }));
}

async function googleCustomSearch(query, requestId) {
  const params = new URLSearchParams({
    key: config.GOOGLE_SEARCH_API_KEY,
    cx: config.GOOGLE_SEARCH_CX,
    q: query,
    num: String(Math.min(10, config.WEB_SEARCH_NUM_RESULTS)),
  });

  const url = `https://www.googleapis.com/customsearch/v1?${params}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Google CSE HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const items = data.items || [];

  logger.info('Google CSE search done', {
    requestId,
    hits: items.length,
  });

  return items.slice(0, 10).map((r) => ({
    title: String(r.title || ''),
    link: String(r.link || ''),
    snippet: String(r.snippet || ''),
  }));
}
