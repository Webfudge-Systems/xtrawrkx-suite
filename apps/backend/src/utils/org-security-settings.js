'use strict';

function normalizeAllowedDomains(securitySettings) {
  const raw = securitySettings?.allowedEmailDomains;
  if (!Array.isArray(raw)) return [];
  return raw.map((d) => String(d).trim().toLowerCase()).filter(Boolean);
}

function emailMatchesAllowedDomains(email, allowedDomains) {
  if (!allowedDomains.length) return true;
  const parts = String(email || '').trim().toLowerCase().split('@');
  if (parts.length !== 2 || !parts[1]) return false;
  return allowedDomains.includes(parts[1]);
}

/**
 * @param {string[]} emails
 * @param {object} securitySettings
 * @returns {string|null} Error message or null if all emails are allowed.
 */
function validateInviteEmailsForSecurity(emails, securitySettings) {
  const allowedDomains = normalizeAllowedDomains(securitySettings);
  if (!allowedDomains.length) return null;

  const list = Array.isArray(emails) ? emails : [emails];
  for (const email of list) {
    if (!email) continue;
    if (!emailMatchesAllowedDomains(email, allowedDomains)) {
      return `Invitations are limited to these email domains: ${allowedDomains.join(', ')}`;
    }
  }
  return null;
}

module.exports = {
  emailMatchesAllowedDomains,
  normalizeAllowedDomains,
  validateInviteEmailsForSecurity,
};
