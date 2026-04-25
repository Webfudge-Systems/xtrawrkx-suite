import { extractJsonObject } from './extractSchemas.js';

const NEEDS_CANONICAL = [
  'CRM',
  'Marketing automation',
  'Funnel',
  'Personal branding',
];

const NEEDS_LOWER = new Map(
  NEEDS_CANONICAL.map((n) => [n.toLowerCase(), n]),
);

function normalizeLeadScore(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (s.includes('high')) return 'High';
  if (s.includes('low')) return 'Low';
  if (s.includes('medium')) return 'Medium';
  return 'Medium';
}

function normalizePotentialNeeds(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  const seen = new Set();
  for (const item of arr) {
    const key = String(item || '').trim().toLowerCase();
    if (!key) continue;
    const canonical = NEEDS_LOWER.get(key) || fuzzyNeed(key);
    if (!canonical) continue;
    const dedupe = canonical.toLowerCase();
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push(canonical);
  }
  return out;
}

function fuzzyNeed(key) {
  if (key.includes('crm')) return 'CRM';
  if (key.includes('marketing') && key.includes('automation')) {
    return 'Marketing automation';
  }
  if (key.includes('funnel')) return 'Funnel';
  if (key.includes('personal') && key.includes('brand')) {
    return 'Personal branding';
  }
  return null;
}

function toEmpty(v) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

export function emptyEnrichmentPayload() {
  return {
    enrichment: {
      website: '',
      twitter: '',
      youtube: '',
      company: '',
    },
    insights: {
      persona: '',
      industry: '',
      lead_score: '',
      potential_needs: [],
    },
  };
}

export function parseEnrichmentMergeFromAi(text) {
  const raw = extractJsonObject(text);
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') {
    return emptyEnrichmentPayload();
  }

  const enr =
    parsed.enrichment && typeof parsed.enrichment === 'object'
      ? parsed.enrichment
      : {};
  const ins =
    parsed.insights && typeof parsed.insights === 'object'
      ? parsed.insights
      : {};

  const base = emptyEnrichmentPayload();

  base.enrichment = {
    website: toEmpty(enr.website),
    twitter: toEmpty(enr.twitter),
    youtube: toEmpty(enr.youtube),
    company: toEmpty(enr.company),
  };

  const rawNeeds = ins.potential_needs;
  const needsList = Array.isArray(rawNeeds)
    ? rawNeeds
    : rawNeeds != null && rawNeeds !== ''
      ? [rawNeeds]
      : [];

  base.insights = {
    persona: toEmpty(ins.persona),
    industry: toEmpty(ins.industry),
    lead_score: normalizeLeadScore(ins.lead_score),
    potential_needs: normalizePotentialNeeds(needsList),
  };

  return base;
}
