/**
 * Proposal API — Strapi /proposals.
 * Follows the same pattern as dealService.js / projectService.js.
 */
import strapiClient from '../strapiClient';
import {
  buildListQuery,
  normalizeStrapiEntry,
  normalizeStrapiListResponse,
  normalizeStrapiOneResponse,
} from './strapiContentApi';

const ENDPOINT = '/proposals';

const POPULATE_DEFAULT = [
  'assignedTo',
  'organization',
  'leadCompany',
  'clientAccount',
  'deal',
  'proposalFile',
];

const normalizeEntry = (e) => normalizeStrapiEntry(e);
const normalizeList  = (r) => normalizeStrapiListResponse(r, normalizeEntry);
const normalizeOne   = (r) => normalizeStrapiOneResponse(r, normalizeEntry);

function buildWritePayload(payload) {
  const data = { ...payload };

  const toNullIfBlank = (key) => {
    if (!Object.prototype.hasOwnProperty.call(data, key)) return;
    if (typeof data[key] === 'string' && data[key].trim() === '') {
      data[key] = null;
    }
  };

  // Strapi validates typed fields (date/email/decimal/integer); blank strings fail validation.
  [
    'date',
    'validUntil',
    'clientEmail',
    'preparedByEmail',
    'outOfScopeRate',
    'warrantyDays',
    'totalValue',
  ].forEach(toNullIfBlank);

  for (const key of ['assignedTo', 'leadCompany', 'clientAccount', 'deal', 'proposalFile']) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (data[key] === '' || data[key] === null) {
        data[key] = null;
      } else if (data[key] != null && typeof data[key] === 'number') {
        data[key] = { id: data[key] };
      }
    }
  }
  // Ensure JSON fields are actual arrays (not stringified)
  for (const key of ['modules', 'milestones', 'assumptions', 'securityItems', 'outOfScope', 'handoverDeliverables']) {
    if (data[key] !== undefined && typeof data[key] === 'string') {
      try { data[key] = JSON.parse(data[key]); } catch (_) { /* keep as-is */ }
    }
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

  /** Convenience: get all proposals filtered by status */
  async getByStatus(status, params = {}) {
    return this.getAll({ ...params, filters: { status } });
  },
};
