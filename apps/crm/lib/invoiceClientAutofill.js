/**
 * Map client-account Strapi records → invoice "Bill To" fields.
 */

/**
 * Stable id for API routes and <select> values (Strapi 5 may expose only `documentId`).
 */
export function clientAccountApiId(row) {
  if (!row || typeof row !== 'object') return '';
  if (row.id != null && row.id !== '') return String(row.id);
  if (row.documentId != null && row.documentId !== '') return String(row.documentId);
  return '';
}

/** Flatten one Strapi entry shape `{ id, attributes }` → plain fields. */
export function unwrapClientAccountRow(entry) {
  if (!entry || typeof entry !== 'object') return null;
  if (entry.attributes && typeof entry.attributes === 'object') {
    const { id, documentId } = entry;
    const { attributes } = entry;
    return {
      id,
      documentId: attributes.documentId ?? documentId ?? id,
      ...attributes,
    };
  }
  return entry;
}

export function formatClientBillingAddress(acc) {
  const row = unwrapClientAccountRow(acc);
  if (!row) return '';
  const line1 = (row.address || '').trim();
  const rest = [row.city, row.state, row.zipCode, row.country].filter(Boolean).join(', ');
  if (line1 && rest) return `${line1}\n${rest}`;
  return line1 || rest || '';
}

function unwrapContact(c) {
  if (c == null) return null;
  if (typeof c !== 'object') return null;
  if (c.attributes && typeof c.attributes === 'object') {
    return { id: c.id, documentId: c.documentId, ...c.attributes };
  }
  return c;
}

/** Strapi filters for contacts linked to a client account (`contactService.getAll`). */
export function clientAccountContactFilters(apiId) {
  const trimmed = String(apiId || '').trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    return { clientAccount: { id: { $eq: parseInt(trimmed, 10) } } };
  }
  return { clientAccount: { documentId: { $eq: trimmed } } };
}

/**
 * Load contacts for a client account. Tries server-side filters first (numeric + string id variants),
 * then matches client-side on `clientAccount` (same approach as `clients/accounts/[id]/page.js`).
 */
export async function fetchContactsForClientAccount(apiId, contactService) {
  const trimmed = String(apiId || '').trim();
  if (!trimmed || !contactService?.getAll) return [];

  const filterAttempts = [];
  const primary = clientAccountContactFilters(trimmed);
  if (primary) filterAttempts.push(primary);
  if (/^\d+$/.test(trimmed)) {
    filterAttempts.push({ clientAccount: { id: { $eq: trimmed } } });
  }

  for (const filters of filterAttempts) {
    try {
      const res = await contactService.getAll({
        filters,
        'pagination[pageSize]': 100,
        sort: 'createdAt:desc',
        populate: ['clientAccount'],
      });
      const data = Array.isArray(res?.data) ? res.data : [];
      if (data.length) return data;
    } catch {
      /* try next */
    }
  }

  try {
    const res = await contactService.getAll({
      'pagination[pageSize]': 500,
      sort: 'createdAt:desc',
      populate: ['clientAccount'],
    });
    const all = Array.isArray(res?.data) ? res.data : [];
    return all.filter((contact) => {
      const ca = contact?.clientAccount;
      if (ca == null) return false;
      if (typeof ca !== 'object') return String(ca) === trimmed;
      const cid = ca.id ?? ca.documentId;
      return cid != null && String(cid) === trimmed;
    });
  } catch (e) {
    console.warn('fetchContactsForClientAccount: client-side filter failed', e);
    return [];
  }
}

function listResolvedContacts(contacts) {
  if (!Array.isArray(contacts)) return [];
  return contacts.map(unwrapContact).filter((c) => c && typeof c === 'object');
}

export function formatContactDisplayName(c) {
  if (!c || typeof c !== 'object') return '';
  const fn = (c.firstName || c.firstname || '').trim();
  const ln = (c.lastName || c.lastname || '').trim();
  const full = [fn, ln].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (c.name) return String(c.name).trim();
  return '';
}

function contactBillToScore(c) {
  if (!c) return 0;
  return (
    Number(!!c.isPrimaryContact) * 1000 +
    (formatContactDisplayName(c) ? 100 : 0) +
    (String(c.phone || '').trim() ? 10 : 0) +
    (String(c.email || '').trim() ? 1 : 0)
  );
}

/** Prefer `isPrimaryContact`, else the best row for billing (name / phone / email). */
export function pickPrimaryContact(acc) {
  const row = unwrapClientAccountRow(acc);
  const list = listResolvedContacts(row?.contacts);
  if (!list.length) return null;
  const sorted = [...list].sort((a, b) => contactBillToScore(b) - contactBillToScore(a));
  return sorted[0] || null;
}

/** Prefer primary contact, else first contact with a usable name. */
export function pickPrimaryContactDisplayName(acc) {
  return formatContactDisplayName(pickPrimaryContact(acc));
}

function mergeContactListsPreferFetched(embedded, fetched) {
  const map = new Map();
  const keyOf = (c) => {
    if (c.id != null && c.id !== '') return `id:${String(c.id)}`;
    if (c.documentId != null && c.documentId !== '') return `doc:${String(c.documentId)}`;
    return null;
  };
  for (const c of embedded) {
    const k = keyOf(c);
    if (k) map.set(k, { ...c });
  }
  for (const c of fetched) {
    const k = keyOf(c);
    if (k) {
      map.set(k, { ...(map.get(k) || {}), ...c });
    } else {
      map.set(`anon:${map.size}`, c);
    }
  }
  return Array.from(map.values());
}

/**
 * Merge embedded `contacts` on the account with `/contacts?filters[clientAccount]…` rows
 * (fetched wins on duplicate ids). Then map Bill To using primary / best contact.
 */
export function buildBillToFromClientAccount(accountRow, fetchedContacts = []) {
  const row = unwrapClientAccountRow(accountRow);
  if (!row) return mapClientAccountToBillTo(null);
  const embedded = listResolvedContacts(row.contacts);
  const fetched = listResolvedContacts(fetchedContacts);
  const contacts = mergeContactListsPreferFetched(embedded, fetched);
  return mapClientAccountToBillTo({ ...row, contacts });
}

export function mapClientAccountToBillTo(acc) {
  const row = unwrapClientAccountRow(acc);
  if (!row) {
    return {
      billToName: '',
      billToCompany: '',
      billToEmail: '',
      billToPhone: '',
      billToAddress: '',
      billToGstin: '',
    };
  }
  const primary = pickPrimaryContact(row);
  const contactName = formatContactDisplayName(primary);
  const contactPhone = (primary?.phone || '').trim();
  const contactEmail = (primary?.email || '').trim();
  return {
    billToCompany: (row.companyName || row.name || '').trim(),
    billToName: contactName,
    billToEmail: (contactEmail || row.email || '').trim(),
    billToPhone: (contactPhone || row.phone || '').trim(),
    billToAddress: formatClientBillingAddress(row),
    billToGstin: '',
  };
}

/** Client-account fields only; contact name/phone/email come from the contact dropdown. */
export function mapClientAccountFieldsOnly(acc) {
  const row = unwrapClientAccountRow(acc);
  if (!row) {
    return {
      billToCompany: '',
      billToEmail: '',
      billToPhone: '',
      billToAddress: '',
      billToGstin: '',
    };
  }
  return {
    billToCompany: (row.companyName || row.name || '').trim(),
    billToEmail: (row.email || '').trim(),
    billToPhone: (row.phone || '').trim(),
    billToAddress: formatClientBillingAddress(row),
    billToGstin: '',
  };
}

export function contactToBillToFields(contact) {
  if (!contact || typeof contact !== 'object') {
    return { billToName: '', billToEmail: '', billToPhone: '' };
  }
  return {
    billToName: formatContactDisplayName(contact),
    billToEmail: (contact.email || '').trim(),
    billToPhone: (contact.phone || '').trim(),
  };
}

/** Combine account row + optional CRM contact row into Bill To fields. */
export function mergeBillToFromAccountAndContact(accountRow, contactRow) {
  const acc = mapClientAccountFieldsOnly(accountRow);
  const c = contactRow ? contactToBillToFields(contactRow) : { billToName: '', billToEmail: '', billToPhone: '' };
  return {
    ...acc,
    billToName: c.billToName,
    billToEmail: c.billToEmail || acc.billToEmail,
    billToPhone: c.billToPhone || acc.billToPhone,
  };
}
