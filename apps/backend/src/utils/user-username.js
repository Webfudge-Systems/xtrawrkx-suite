'use strict';

function usernameFromEmail(email) {
  const local = String(email || '').split('@')[0].trim();
  const cleaned = local
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'user';
}

async function usernameExists(strapi, username, excludeUserId = null) {
  const existing = await strapi.query('plugin::users-permissions.user').findOne({
    where: { username },
  });
  if (!existing) return false;
  if (excludeUserId != null && String(existing.id) === String(excludeUserId)) return false;
  return true;
}

async function uniqueUsernameFromEmail(strapi, email, excludeUserId = null) {
  const base = usernameFromEmail(email);
  let candidate = base;
  let suffix = 2;
  while (await usernameExists(strapi, candidate, excludeUserId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function normalizeUserUsername(strapi, user) {
  if (!user?.id || !user?.email) return user;
  const current = String(user.username || '').trim();
  const desiredBase = usernameFromEmail(user.email);
  if (current && current !== user.email && current.split('@')[0] === current) return user;

  const username = await uniqueUsernameFromEmail(strapi, user.email, user.id);
  if (username === current || !username.startsWith(desiredBase)) return user;

  await strapi.query('plugin::users-permissions.user').update({
    where: { id: user.id },
    data: { username },
  });
  return { ...user, username };
}

module.exports = {
  normalizeUserUsername,
  uniqueUsernameFromEmail,
  usernameFromEmail,
  usernameExists,
};
