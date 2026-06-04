/** Shared select options and labels for deal forms (aligned with Strapi deal schema). */

export const DEAL_STAGE_OPTIONS = [
  { value: 'discovery', label: 'Discovery' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'team', label: 'Team' },
];

/** Preset deal groups for create/edit forms (stored as plain string on deal). */
export const DEAL_GROUP_OPTIONS = [
  { value: 'Enterprise', label: 'Enterprise' },
  { value: 'SMB', label: 'SMB' },
  { value: 'Mid-market', label: 'Mid-market' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Government', label: 'Government' },
  { value: 'Strategic', label: 'Strategic' },
];

export const SOURCE_OPTIONS = [
  { value: 'FROM_ACCOUNT', label: 'From account' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'SOCIAL_MEDIA', label: 'Social media' },
  { value: 'EMAIL_CAMPAIGN', label: 'Email campaign' },
  { value: 'COLD_CALL', label: 'Cold call' },
  { value: 'PARTNER', label: 'Partner' },
  { value: 'OTHER', label: 'Other' },
];

export function stageLabel(stage) {
  if (!stage) return '—';
  const s = String(stage).toLowerCase();
  const row = DEAL_STAGE_OPTIONS.find((o) => o.value === s);
  return row ? row.label : String(stage);
}

export function contactDisplayName(c) {
  if (!c || typeof c !== 'object') return '';
  const fn = (c.firstName || '').trim();
  const ln = (c.lastName || '').trim();
  const parts = [fn, ln].filter(Boolean);
  if (parts.length) return parts.join(' ');
  if (c.email) return c.email;
  return '';
}

/**
 * Lead companies that are already client accounts should not appear on the deal
 * "Lead company" picker (use client account instead). Matches list/detail CRM logic.
 */
export function isConvertedLeadCompany(company) {
  if (!company) return true;
  const s = (company.status || '').toString().toUpperCase();
  if (s === 'CONVERTED' || s === 'CLIENT') return true;
  const ca = company.convertedAccount;
  if (ca == null || ca === false) return false;
  if (typeof ca === 'object') {
    return ca.id != null || ca.documentId != null;
  }
  return true;
}

/** Normalize relation id from Strapi (populated object or scalar). */
export function relationEntityId(rel) {
  if (rel == null) return '';
  if (typeof rel === 'object') {
    const id = rel.id ?? rel.documentId;
    return id != null ? String(id) : '';
  }
  return String(rel);
}

/**
 * Contacts linked to the selected lead company or client account (string id compare).
 * Pass empty strings when nothing selected — returns [].
 */
export function filterContactsForCompany(contacts, leadCompanyId, clientAccountId) {
  if (!Array.isArray(contacts) || contacts.length === 0) return [];
  const lc = leadCompanyId ? String(leadCompanyId).trim() : '';
  const ca = clientAccountId ? String(clientAccountId).trim() : '';
  if (lc) {
    return contacts.filter((c) => relationEntityId(c.leadCompany) === lc);
  }
  if (ca) {
    return contacts.filter((c) => relationEntityId(c.clientAccount) === ca);
  }
  return [];
}

/** Stable value for selects (matches Strapi id or documentId). */
export function contactOptionValue(c) {
  if (!c || typeof c !== 'object') return '';
  return String(c.id ?? c.documentId ?? '');
}

/** Match stored deal/API id to a contact row (id vs documentId mismatch). */
export function contactRowMatchesId(contact, idStr) {
  if (!contact || idStr == null || String(idStr).trim() === '') return false;
  const s = String(idStr).trim();
  const v = contactOptionValue(contact);
  if (v === s) return true;
  if (String(contact.id ?? '') === s) return true;
  if (String(contact.documentId ?? '') === s) return true;
  return false;
}

/** Prefer primary contact, else first in list; returns id string or ''. */
export function defaultPrimaryContactId(filteredContacts) {
  if (!Array.isArray(filteredContacts) || filteredContacts.length === 0) return '';
  const sorted = [...filteredContacts].sort(
    (a, b) => Number(!!b.isPrimaryContact) - Number(!!a.isPrimaryContact)
  );
  const c = sorted[0];
  return contactOptionValue(c);
}
