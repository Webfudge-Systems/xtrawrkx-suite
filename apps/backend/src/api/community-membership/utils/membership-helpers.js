'use strict';

const VALID_COMMUNITY_ENUMS = new Set(['XEN', 'XEVFIN', 'XEVTG', 'XDD']);

const PENDING_SUBMISSION_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_INFO'];

function mergeSelectedCommunities(existing, communityEnum) {
  const code = String(communityEnum || '').trim().toUpperCase();
  if (!VALID_COMMUNITY_ENUMS.has(code)) {
    return Array.isArray(existing) ? existing : [];
  }

  const base = Array.isArray(existing)
    ? existing.map((x) => String(x).trim()).filter(Boolean)
    : [];

  const upper = new Set(base.map((x) => x.toUpperCase()));
  if (upper.has(code)) {
    return base;
  }

  return [...base, code];
}

async function registerCommunityOnClientAccount(strapi, accountId, communityEnum) {
  if (!accountId || !communityEnum) return;

  const account = await strapi.db
    .query('api::client-account.client-account')
    .findOne({
      where: { id: accountId },
      select: ['id', 'selectedCommunities'],
    });

  if (!account) return;

  const nextSelected = mergeSelectedCommunities(
    account.selectedCommunities,
    communityEnum
  );

  await strapi.db.query('api::client-account.client-account').update({
    where: { id: accountId },
    data: { selectedCommunities: nextSelected },
  });
}

/**
 * Create or return ACTIVE membership for client+community (used after POC approval).
 */
async function ensureActiveMembership(strapi, {
  accountId,
  communityEnum,
  membershipData,
  membershipType,
}) {
  if (!communityEnum) {
    throw new Error('communityEnum is required');
  }

  const resolvedType = membershipType || 'FREE';

  const existing = await strapi.db
    .query('api::community-membership.community-membership')
    .findOne({
      where: {
        community: communityEnum,
        status: 'ACTIVE',
        ...(accountId ? { clientAccount: accountId } : {}),
      },
    });

  if (existing) {
    if (membershipData || membershipType) {
      await strapi.db.query('api::community-membership.community-membership').update({
        where: { id: existing.id },
        data: {
          ...(membershipType ? { membershipType: resolvedType } : {}),
          ...(membershipData ? { membershipData } : {}),
        },
      });
    }
    await registerCommunityOnClientAccount(strapi, accountId, communityEnum);
    return { entry: existing, alreadyMember: true };
  }

  const entry = await strapi.db
    .query('api::community-membership.community-membership')
    .create({
      data: {
        community: communityEnum,
        membershipType: resolvedType,
        status: 'ACTIVE',
        joinedAt: new Date(),
        membershipData: membershipData || null,
        ...(accountId ? { clientAccount: accountId } : {}),
      },
    });

  await registerCommunityOnClientAccount(strapi, accountId, communityEnum);

  return { entry, alreadyMember: false };
}

module.exports = {
  PENDING_SUBMISSION_STATUSES,
  VALID_COMMUNITY_ENUMS,
  registerCommunityOnClientAccount,
  ensureActiveMembership,
};
