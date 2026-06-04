/**
 * Helpers for meeting "Link to CRM" (client account / lead company / deal).
 */

/** @param {unknown} lead */
export function isLeadCompanyConverted(lead) {
  if (!lead || typeof lead !== 'object') return false;
  if (lead.convertedAt) return true;
  if (lead.convertedAccount != null) return true;
  const s = String(lead.status || '').toUpperCase();
  return s === 'CONVERTED' || s === 'CLIENT';
}

/** @param {unknown} entity */
export function relationId(entity) {
  if (entity == null || entity === '') return '';
  if (typeof entity === 'object') return String(entity.id ?? entity.documentId ?? '');
  return String(entity);
}

/**
 * Deals whose leadCompany or clientAccount matches the selected anchor(s).
 * @param {Array<Record<string, unknown>>} deals
 * @param {string} clientAccountId
 * @param {string} leadCompanyId
 */
export function filterDealsForAnchor(deals, clientAccountId, leadCompanyId) {
  const ca = String(clientAccountId || '').trim();
  const lc = String(leadCompanyId || '').trim();
  if (!ca && !lc) return [];
  return deals.filter((d) => {
    const dLc = relationId(d.leadCompany);
    const dCa = relationId(d.clientAccount);
    const matchLead = Boolean(lc && dLc && dLc === lc);
    const matchAccount = Boolean(ca && dCa && dCa === ca);
    return matchLead || matchAccount;
  });
}
