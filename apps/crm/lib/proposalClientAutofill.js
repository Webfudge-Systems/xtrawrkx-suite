/**
 * Map lead company / client account (+ contacts) → proposal "Prepared For" fields.
 */
import { filterContactsForCompany } from './dealFormOptions';
import {
  mapClientAccountToBillTo,
  pickPrimaryContact,
  formatContactDisplayName,
} from './invoiceClientAutofill';

export function formatCompanyAddressRow(row) {
  if (!row || typeof row !== 'object') return '';
  const line1 = (row.address || '').trim();
  const rest = [row.city, row.state, row.zipCode, row.country].filter(Boolean).join(', ');
  if (line1 && rest) return `${line1}\n${rest}`;
  return line1 || rest || '';
}

/**
 * @param {'lead' | 'client'} kind
 * @param {object|null} entity — lead company or client account row from list/getOne
 * @param {object[]} allContacts — contacts with leadCompany / clientAccount populated
 */
export function mapEntityToProposalClientFields(kind, entity, allContacts) {
  if (!entity) {
    return {
      clientCompanyName: '',
      clientContactName: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
    };
  }
  const contacts = Array.isArray(allContacts) ? allContacts : [];

  if (kind === 'client') {
    const id = String(entity.id ?? entity.documentId ?? '');
    const forAcc = filterContactsForCompany(contacts, '', id);
    const bill = mapClientAccountToBillTo({ ...entity, contacts: forAcc });
    return {
      clientCompanyName: bill.billToCompany,
      clientContactName: bill.billToName,
      clientEmail: bill.billToEmail,
      clientPhone: bill.billToPhone,
      clientAddress: bill.billToAddress,
    };
  }

  const id = String(entity.id ?? entity.documentId ?? '');
  const forLead = filterContactsForCompany(contacts, id, '');
  const primary = pickPrimaryContact({ contacts: forLead });
  return {
    clientCompanyName: (entity.companyName || entity.name || '').trim(),
    clientContactName: formatContactDisplayName(primary),
    clientEmail: (primary?.email || entity.email || '').trim(),
    clientPhone: (primary?.phone || entity.phone || '').trim(),
    clientAddress: formatCompanyAddressRow(entity),
  };
}
