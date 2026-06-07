'use strict';

const SUFFIX_PATTERN =
  /\b(inc|incorporated|llc|ltd|limited|corp|corporation|company|co|agency|group|studio|studios|llp|plc|gmbh|sa|pte|pvt|private)\b/gi;

/**
 * Normalize a company name for fuzzy comparison.
 * Strips punctuation, common suffixes, and collapses whitespace.
 */
function normalizeCompanyName(value) {
  if (typeof value !== 'string') return '';
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(SUFFIX_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeCompanyName(value) {
  return normalizeCompanyName(value)
    .split(' ')
    .filter((token) => token.length > 1);
}

function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function levenshteinRatio(a, b) {
  if (!a && !b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (!maxLen) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

function tokenOverlapScore(inputTokens, candidateTokens) {
  if (!inputTokens.length || !candidateTokens.length) return 0;
  const setA = new Set(inputTokens);
  const setB = new Set(candidateTokens);
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union ? intersection / union : 0;
}

/**
 * Score how similar two company names are (0–1).
 * Handles cases like "Webfudge" vs "Webfudge Agency".
 */
function scoreCompanyNameSimilarity(inputName, candidateName) {
  const input = normalizeCompanyName(inputName);
  const candidate = normalizeCompanyName(candidateName);
  if (!input || !candidate) return 0;
  if (input === candidate) return 1;

  if (candidate.includes(input) || input.includes(candidate)) {
    const shorter = Math.min(input.length, candidate.length);
    const longer = Math.max(input.length, candidate.length);
    return 0.86 + (shorter / longer) * 0.13;
  }

  const inputTokens = tokenizeCompanyName(inputName);
  const candidateTokens = tokenizeCompanyName(candidateName);
  const tokenScore = tokenOverlapScore(inputTokens, candidateTokens);
  const editScore = levenshteinRatio(input, candidate);

  if (inputTokens.length === 1 && candidateTokens.length >= 1) {
    const primary = inputTokens[0];
    if (candidateTokens.some((token) => token === primary || token.startsWith(primary) || primary.startsWith(token))) {
      return Math.max(tokenScore, editScore, 0.82);
    }
  }

  return Math.max(tokenScore, editScore * 0.95);
}

function matchLevelFromScore(score) {
  if (score >= 0.98) return 'exact';
  if (score >= 0.85) return 'high';
  if (score >= 0.6) return 'possible';
  return 'low';
}

function rankSimilarCompanies(inputName, candidates, { limit = 5, minScore = 0.6 } = {}) {
  const deduped = new Map();

  for (const candidate of candidates || []) {
    const companyName =
      typeof candidate?.companyName === 'string' ? candidate.companyName.trim() : '';
    if (!companyName) continue;

    const key = normalizeCompanyName(companyName);
    if (!key) continue;

    const score = scoreCompanyNameSimilarity(inputName, companyName);
    if (score < minScore) continue;

    const existing = deduped.get(key);
    if (existing && existing.score >= score) continue;

    deduped.set(key, {
      companyName,
      source: candidate.source || 'unknown',
      industry: candidate.industry || null,
      website: candidate.website || null,
      score: Number(score.toFixed(3)),
      matchLevel: matchLevelFromScore(score),
    });
  }

  return [...deduped.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = {
  normalizeCompanyName,
  scoreCompanyNameSimilarity,
  rankSimilarCompanies,
  matchLevelFromScore,
};
