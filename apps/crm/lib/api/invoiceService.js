/**
 * Invoice API — Strapi /invoices.
 * Follows the same pattern as dealService.js / projectService.js.
 */
import strapiClient from '../strapiClient';
import {
  buildListQuery,
  normalizeStrapiEntry,
  normalizeStrapiListResponse,
  normalizeStrapiOneResponse,
} from './strapiContentApi';

const ENDPOINT = '/invoices';

const POPULATE_DEFAULT = [
  'assignedTo',
  'organization',
  'leadCompany',
  'clientAccount',
  'deal',
];

const normalizeEntry = (e) => normalizeStrapiEntry(e);
const normalizeList  = (r) => normalizeStrapiListResponse(r, normalizeEntry);
const normalizeOne   = (r) => normalizeStrapiOneResponse(r, normalizeEntry);

function buildWritePayload(payload) {
  const data = { ...payload };

  // Normalize known enum values from UI labels.
  if (data.documentType === 'PROFORMA INVOICE') {
    data.documentType = 'PROFORMA_INVOICE';
  }

  const toNullIfBlank = (key) => {
    if (!Object.prototype.hasOwnProperty.call(data, key)) return;
    if (typeof data[key] === 'string' && data[key].trim() === '') {
      data[key] = null;
    }
  };

  // Strapi validates typed fields (date/email/decimal); blank strings fail validation.
  [
    'invoiceDate',
    'dueDate',
    'fromOrgEmail',
    'billToEmail',
    'fromOrgGstin',
    'billToGstin',
    'taxRate',
    'discount',
    'amountPaid',
    'subtotal',
    'total',
    'balanceDue',
  ].forEach(toNullIfBlank);

  for (const key of ['assignedTo', 'leadCompany', 'clientAccount', 'deal']) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    const v = data[key];
    if (v === '' || v === null || v === undefined) {
      data[key] = null;
      continue;
    }
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      continue;
    }
    if (typeof v === 'number' && !Number.isNaN(v)) {
      data[key] = { id: v };
      continue;
    }
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) {
        data[key] = null;
        continue;
      }
      if (/^\d+$/.test(s)) {
        data[key] = { id: parseInt(s, 10) };
      } else {
        data[key] = { documentId: s };
      }
    }
  }
  // Ensure lineItems is an actual array
  if (data.lineItems !== undefined && typeof data.lineItems === 'string') {
    try { data.lineItems = JSON.parse(data.lineItems); } catch (_) { /* keep as-is */ }
  }
  return data;
}

export default {
  async getAll(params = {}) {
    return normalizeList(await strapiClient.get(ENDPOINT, buildListQuery(params)));
  },

  async getOne(id, options = {}) {
    const populate = options.populate ?? POPULATE_DEFAULT;
    return normalizeOne(await strapiClient.get(`${ENDPOINT}/${id}`, { populate }));
  },

  async create(payload) {
    const res = await strapiClient.post(ENDPOINT, { data: buildWritePayload(payload) });
    const entry = normalizeEntry(res?.data ?? res);
    return { data: entry, id: entry?.id };
  },

  async update(id, payload) {
    return normalizeOne(
      await strapiClient.put(`${ENDPOINT}/${id}`, { data: buildWritePayload(payload) })
    );
  },

  async delete(id) {
    await strapiClient.delete(`${ENDPOINT}/${id}`);
    return {};
  },

  /** Convenience: get all invoices filtered by status */
  async getByStatus(status, params = {}) {
    return this.getAll({ ...params, filters: { status } });
  },
};
