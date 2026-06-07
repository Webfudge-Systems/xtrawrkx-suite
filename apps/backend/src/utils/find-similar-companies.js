'use strict';

const CLIENT_ACCOUNT_UID = 'api::client-account.client-account';
const { rankSimilarCompanies, normalizeCompanyName } = require('./company-name-similarity');
const { resolveWebsiteSignupOrgId } = require('./website-signup');

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function searchTokens(name) {
  const normalized = normalizeCompanyName(name);
  const tokens = normalized.split(' ').filter((token) => token.length > 1);
  if (tokens.length) return tokens.slice(0, 3);
  if (normalized.length >= 2) return [normalized];
  return [];
}

async function fetchNameCandidates(strapi, uid, orgId, tokens, source) {
  if (!tokens.length) return [];

  const filters = {
    organization: orgId,
    $or: tokens.map((token) => ({ companyName: { $containsi: token } })),
  };

  const rows = await strapi.entityService.findMany(uid, {
    filters,
    fields: ['companyName', 'industry', 'website'],
    limit: 120,
    sort: { updatedAt: 'DESC' },
  });

  return (rows || []).map((row) => ({
    companyName: normalizeString(row.companyName),
    industry: normalizeString(row.industry) || null,
    website: normalizeString(row.website) || null,
    source,
  }));
}

/**
 * Find existing client accounts with similar names in the website signup org.
 */
async function findSimilarCompanies(strapi, { name, limit = 5, minScore = 0.6 } = {}) {
  const query = normalizeString(name);
  if (query.length < 2) {
    return {
      ok: true,
      query,
      matches: [],
      hasStrongMatch: false,
      hasExactMatch: false,
      skipped: true,
      reason: 'Query too short',
    };
  }

  const orgId = await resolveWebsiteSignupOrgId(strapi);
  if (!orgId) {
    return {
      ok: false,
      query,
      matches: [],
      hasStrongMatch: false,
      hasExactMatch: false,
      error: 'Website signup organization is not configured.',
    };
  }

  const tokens = searchTokens(query);
  const clientRows = await fetchNameCandidates(
    strapi,
    CLIENT_ACCOUNT_UID,
    orgId,
    tokens,
    'client_account'
  );

  const matches = rankSimilarCompanies(query, clientRows, {
    limit,
    minScore,
  });

  const hasStrongMatch = matches.some(
    (match) => match.matchLevel === 'exact' || match.matchLevel === 'high'
  );
  const hasExactMatch = matches.some((match) => match.matchLevel === 'exact');

  return {
    ok: true,
    query,
    matches,
    hasStrongMatch,
    hasExactMatch,
  };
}

module.exports = {
  findSimilarCompanies,
};
