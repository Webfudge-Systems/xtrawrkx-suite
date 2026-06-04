/**
 * Map lead company / client account records onto contact form company fields.
 * Shared between CRM and PM.
 */

export function contactFieldsFromClientAccount(acc) {
  if (!acc || typeof acc !== 'object') return {};
  return {
    companyName:    (acc.companyName || acc.name || '').trim(),
    companyWebsite: (acc.website || acc.companyWebsite || '').trim(),
    address:        (acc.address  || '').trim(),
    city:           (acc.city     || '').trim(),
    state:          (acc.state    || '').trim(),
    zipCode:        (acc.zipCode  || '').trim(),
    country:        (acc.country  || '').trim(),
  };
}

export function contactFieldsFromLeadCompany(lc) {
  if (!lc || typeof lc !== 'object') return {};
  return {
    companyName:    (lc.companyName || lc.name || '').trim(),
    companyWebsite: (lc.website     || '').trim(),
    address:        (lc.address     || '').trim(),
    city:           (lc.city        || '').trim(),
    state:          (lc.state       || '').trim(),
    zipCode:        (lc.zipCode     || '').trim(),
    country:        (lc.country     || '').trim(),
  };
}
