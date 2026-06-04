/**
 * Lead company API — Strapi /lead-companies.
 */
import strapiClient from '../strapiClient';
import contactService from './contactService';
import {
  buildListQuery,
  normalizeStrapiEntry,
  normalizeStrapiListResponse,
  normalizeStrapiOneResponse,
} from './strapiContentApi';

const ENDPOINT = '/lead-companies';

function normalizeEntry(entry) {
  const n = normalizeStrapiEntry(entry);
  if (
    n &&
    typeof n === 'object' &&
    n.contacts &&
    typeof n.contacts === 'object' &&
    !Array.isArray(n.contacts) &&
    n.contacts.data !== undefined
  ) {
    const d = n.contacts.data;
    return {
      ...n,
      contacts: Array.isArray(d)
        ? d.map(normalizeEntry).filter(Boolean)
        : d
          ? [normalizeEntry(d)]
          : [],
    };
  }
  return n;
}

function normalizeListResponse(response) {
  return normalizeStrapiListResponse(response, normalizeEntry);
}

function normalizeOneResponse(response) {
  return normalizeStrapiOneResponse(response, normalizeEntry);
}

/** Same source as lead company detail Contacts tab: GET /contacts scoped by org, grouped by leadCompany.id */
async function mergeContactsOntoLeadCompanies(companies) {
  if (!companies?.length) return companies;
  const { data: allContacts = [] } = await contactService.getAll({
    'pagination[pageSize]': 2000,
    sort: 'createdAt:desc',
    populate: ['leadCompany'],
  });
  const byLead = new Map();
  for (const c of allContacts) {
    const lc = c.leadCompany;
    const lid = lc && typeof lc === 'object' ? lc.id ?? lc.documentId : lc;
    if (lid == null) continue;
    const key = String(lid);
    if (!byLead.has(key)) byLead.set(key, []);
    byLead.get(key).push(c);
  }
  for (const list of byLead.values()) {
    list.sort((a, b) => Number(!!b.isPrimaryContact) - Number(!!a.isPrimaryContact));
  }
  return companies.map((co) => {
    const cid = co.id ?? co.documentId;
    if (cid == null) return co;
    const merged = byLead.get(String(cid));
    if (!merged?.length) return co;
    return { ...co, contacts: merged };
  });
}

export default {
  async getAll(params = {}) {
    const { mergeContactsFromContactsApi, ...rest } = params;
    const response = await strapiClient.get(ENDPOINT, buildListQuery(rest));
    const normalized = normalizeListResponse(response);
    if (mergeContactsFromContactsApi && normalized.data?.length) {
      normalized.data = await mergeContactsOntoLeadCompanies(normalized.data);
    }
    return normalized;
  },

  async getOne(id, options = {}) {
    const populate = options.populate ?? ['assignedTo', 'organization', 'contacts', 'convertedAccount'];
    const response = await strapiClient.get(`${ENDPOINT}/${id}`, { populate });
    return normalizeOneResponse(response);
  },

  async create(payload) {
    const data = { ...payload };
    if (data.assignedTo != null && typeof data.assignedTo === 'number') {
      data.assignedTo = { id: data.assignedTo };
    }
    const response = await strapiClient.post(ENDPOINT, { data });
    const result = response?.data ?? response;
    const normalized = normalizeEntry(result);
    return { data: normalized, id: normalized?.id ?? result?.id };
  },

  async update(id, payload) {
    const data = { ...payload };
    if (data.assignedTo != null && typeof data.assignedTo === 'number') {
      data.assignedTo = { id: data.assignedTo };
    }
    const body = { data };
    const response = await strapiClient.put(`${ENDPOINT}/${id}`, body);
    return normalizeOneResponse(response);
  },

  async delete(id) {
    await strapiClient.delete(`${ENDPOINT}/${id}`);
    return {};
  },

  /**
   * Convert a lead company to a client account.
   * POST /lead-companies/:id/convert
   * Returns { data: { leadCompany, clientAccount } }
   */
  async convertToClient(id) {
    const response = await strapiClient.post(`${ENDPOINT}/${id}/convert`, {});
    const raw = response?.data ?? response;
    return {
      data: {
        leadCompany: normalizeEntry(raw?.leadCompany ?? null),
        clientAccount: normalizeEntry(raw?.clientAccount ?? null),
      },
    };
  },

  async getStatuses() {
    const response = await strapiClient.get(`${ENDPOINT}/statuses`);
    const data = response?.data ?? response ?? [];
    return Array.isArray(data) ? data : [];
  },

  /**
   * Stats by status. Derives from getAll when backend has no dedicated stats endpoint.
   */
  async getStats() {
    try {
      const { data } = await this.getAll({
        'pagination[pageSize]': 1000,
        sort: 'createdAt:desc',
      });
      const byStatus = (data || []).reduce((acc, company) => {
        const s = (company.status || 'NEW').toUpperCase();
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});
      return { byStatus };
    } catch (err) {
      console.error('Lead company getStats error:', err);
      return { byStatus: {} };
    }
  },

  /** Paginate through all lead companies (dashboard analytics). */
  async fetchAll() {
    const pageSize = 100;
    let page = 1;
    const out = [];
    let pageCount = 1;
    do {
      const res = await this.getAll({
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
        sort: 'createdAt:desc',
      });
      const batch = Array.isArray(res.data) ? res.data : [];
      out.push(...batch);
      pageCount = res?.meta?.pagination?.pageCount ?? 1;
      page += 1;
    } while (page <= pageCount);
    return out;
  },
};
