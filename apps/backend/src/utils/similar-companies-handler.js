'use strict';

const { findSimilarCompanies } = require('./find-similar-companies');
const { verifyLandingSignupSecret } = require('./website-signup');

function normalizeQueryString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function handleSimilarCompaniesRequest(strapi, ctx) {
  if (!verifyLandingSignupSecret(ctx)) {
    return ctx.forbidden('Invalid or missing website signup secret.');
  }

  const name =
    normalizeQueryString(ctx.query?.name) ||
    normalizeQueryString(ctx.query?.q) ||
    normalizeQueryString(ctx.query?.companyName);

  const limitRaw = parseInt(String(ctx.query?.limit ?? '5'), 10);
  const limit = Number.isNaN(limitRaw) ? 5 : Math.min(Math.max(limitRaw, 1), 10);

  const minScoreRaw = parseFloat(String(ctx.query?.minScore ?? '0.6'));
  const minScore = Number.isNaN(minScoreRaw) ? 0.6 : Math.min(Math.max(minScoreRaw, 0.4), 0.95);

  const result = await findSimilarCompanies(strapi, { name, limit, minScore });
  if (!result.ok) {
    return ctx.send({ error: result.error, matches: [], hasStrongMatch: false }, 500);
  }

  return ctx.send({
    query: result.query,
    matches: result.matches,
    hasStrongMatch: result.hasStrongMatch,
    hasExactMatch: result.hasExactMatch,
  });
}

module.exports = {
  handleSimilarCompaniesRequest,
};
