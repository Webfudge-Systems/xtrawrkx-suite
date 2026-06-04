/**
 * Deal API — Strapi /deals.
 */
import strapiClient from '../strapiClient';
import {
  buildListQuery,
  normalizeStrapiEntry,
  normalizeStrapiListResponse,
  normalizeStrapiOneResponse,
} from './strapiContentApi';

const ENDPOINT = '/deals';

function normalizeEntry(entry) {
  return normalizeStrapiEntry(entry);
}

function normalizeListResponse(response) {
  return normalizeStrapiListResponse(response, normalizeEntry);
}

function normalizeOneResponse(response) {
  return normalizeStrapiOneResponse(response, normalizeEntry);
}

function toStrapiData(payload) {
  const data = {};
  const set = (key, value) => {
    if (value === undefined) return;
    if (typeof value === 'string' && value.trim() === '' && key !== 'description' && key !== 'notes') return;
    data[key] = value;
  };

  set('name', payload.name?.trim());
  if (Object.prototype.hasOwnProperty.call(payload, 'value')) {
    const raw = payload.value;
    if (raw !== '' && raw != null) {
      const n = Number(raw);
      if (!Number.isNaN(n)) data.value = n;
    }
  }
  if (payload.stage) set('stage', payload.stage);
  if (payload.priority) set('priority', payload.priority);
  if (payload.probability != null && payload.probability !== '') {
    const p = parseInt(payload.probability, 10);
    if (!Number.isNaN(p)) data.probability = Math.min(100, Math.max(0, p));
  }
  if (payload.visibility) set('visibility', payload.visibility);
  set('dealGroup', payload.dealGroup?.trim());
  if (Object.prototype.hasOwnProperty.call(payload, 'expectedCloseDate')) {
    const raw = payload.expectedCloseDate;
    if (raw == null || String(raw).trim() === '') data.expectedCloseDate = null;
    else data.expectedCloseDate = String(raw).trim();
  }
  if (payload.source) set('source', payload.source);
  if (payload.description !== undefined) set('description', payload.description?.trim() ?? '');
  if (payload.notes !== undefined) set('notes', payload.notes?.trim() ?? '');

  const relKeys = ['assignedTo', 'leadCompany', 'clientAccount', 'contact'];
  for (const key of relKeys) {
    if (!Object.prototype.hasOwnProperty.call(payload, key)) continue;
    const raw = payload[key];
    if (raw === null || raw === '') {
      data[key] = null;
      continue;
    }
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n)) data[key] = n;
  }

  return data;
}

function relationConnectFormat(data) {
  const out = { ...data };
  const rels = ['assignedTo', 'leadCompany', 'clientAccount', 'contact'];
  for (const key of rels) {
    if (out[key] === null) continue;
    if (out[key] != null && typeof out[key] === 'number') {
      out[key] = { id: out[key] };
    }
  }
  return out;
}

export default {
  async getAll(params = {}) {
    const response = await strapiClient.get(ENDPOINT, buildListQuery(params));
    return normalizeListResponse(response);
  },

  async getOne(id, options = {}) {
    const populate =
      options.populate ?? [
        'assignedTo',
        'organization',
        'leadCompany',
        'clientAccount',
        'contact',
        'deliveryProject',
      ];
    const response = await strapiClient.get(`${ENDPOINT}/${id}`, { populate });
    return normalizeOneResponse(response);
  },

  async create(payload) {
    const data = relationConnectFormat(toStrapiData(payload));
    const response = await strapiClient.post(ENDPOINT, { data });
    const result = response?.data ?? response;
    const normalized = normalizeEntry(result);
    return { data: normalized, id: normalized?.id ?? result?.id };
  },

  async update(id, payload) {
    const data = relationConnectFormat(toStrapiData(payload));
    const response = await strapiClient.put(`${ENDPOINT}/${id}`, { data });
    return normalizeOneResponse(response);
  },

  async delete(id) {
    await strapiClient.delete(`${ENDPOINT}/${id}`);
    return {};
  },

  /** Create org project linked to a won deal (`POST /deals/:id/delivery-project`). */
  async createDeliveryProject(dealId) {
    const response = await strapiClient.post(`${ENDPOINT}/${dealId}/delivery-project`, {});
    return normalizeOneResponse(response);
  },

  /** All deals for pipeline board (client-side grouping). */
  async getPipeline() {
    return this.getAll({
      sort: 'updatedAt:desc',
      'pagination[pageSize]': 100,
      populate: ['leadCompany', 'clientAccount', 'assignedTo', 'deliveryProject'],
    });
  },

  /** Paginate through all deals (analytics dashboards). Org-scoped via strapi headers. */
  async fetchAll() {
    const pageSize = 100;
    let page = 1;
    const out = [];
    let pageCount = 1;
    do {
      const res = await this.getAll({
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
        sort: 'updatedAt:desc',
      });
      const batch = Array.isArray(res.data) ? res.data : [];
      out.push(...batch);
      pageCount = res?.meta?.pagination?.pageCount ?? 1;
      page += 1;
    } while (page <= pageCount);
    return out;
  },
};
