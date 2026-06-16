'use strict';

const {
  verifyClientToken,
  resolveClientSession,
} = require('./client-auth');

function readBearerToken(ctx) {
  const authHeader = ctx.request?.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.replace('Bearer ', '').trim();
}

/**
 * Resolve an authenticated client-portal session from the request bearer token.
 * @returns {Promise<object|null>}
 */
async function resolveClientPortalSession(strapi, ctx) {
  const token = readBearerToken(ctx);
  if (!token) return null;
  try {
    const decoded = verifyClientToken(token);
    if (!decoded?.portalAccessId) return null;
    return resolveClientSession(strapi, decoded.portalAccessId);
  } catch {
    return null;
  }
}

function clientAccountIdFromSession(session) {
  if (!session) return null;
  return (
    session.account?.id ??
    session.clientAccount?.id ??
    session.clientAccountId ??
    null
  );
}

module.exports = {
  readBearerToken,
  resolveClientPortalSession,
  clientAccountIdFromSession,
};
