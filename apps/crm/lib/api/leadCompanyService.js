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

function dateRangeToCreatedAtFilter(range) {
  if (!range) return null;
  const now = new Date();
  if (range === 'last7') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return { $gte: d.toISOString() };
  }
  if (range === 'last30') {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return { $gte: d.toISOString() };
  }
  if (range === 'last90') {
    const d = new Date(now);
    d.setDate(d.getDate() - 90);
    return { $gte: d.toISOString() };
  }
  if (range === 'thisYear') {
    const d = new Date(now.getFullYear(), 0, 1);
    return { $gte: d.toISOString() };
  }
  return null;
}

function valueRangeToDealValueFilter(range) {
  if (!range) return null;
  if (range === 'lt100k') return { $lt: 100000 };
  if (range === '100k_1m') return { $gte: 100000, $lte: 1000000 };
  if (range === '1m_5m') return { $gt: 1000000, $lte: 5000000 };
  if (range === 'gt5m') return { $gt: 5000000 };
  return null;
}

/** Build Strapi list query for the lead companies table (server-side pagination + filters). */
export function buildLeadCompanyListParams({
  page = 1,
  pageSize = 15,
  activeTab = 'all',
  searchQuery = '',
  appliedFilters = {},
  sort = 'createdAt:desc',
  populate = ['assignedTo', 'convertedAccount', 'contacts'],
  assignedToUserId = null,
} = {}) {
  const params = {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    sort,
    populate,
  };

  const tab = String(activeTab || 'all').toLowerCase();
  if (tab === 'my') {
    if (assignedToUserId != null) {
      params['filters[assignedTo][id][$eq]'] = assignedToUserId;
    } else {
      params['filters[id][$eq]'] = -1;
    }
  } else if (tab !== 'all') {
    params['filters[status][$eq]'] = tab.toUpperCase();
  }

  const q = String(searchQuery || '').trim();
  if (q) {
    params['filters[$or][0][companyName][$containsi]'] = q;
    params['filters[$or][1][email][$containsi]'] = q;
  }

  const f = appliedFilters || {};
  if (f.status) params['filters[status][$eq]'] = String(f.status).toUpperCase();
  if (f.source) params['filters[source][$eq]'] = String(f.source).toUpperCase();
  if (f.type) params['filters[type][$eq]'] = f.type;
  if (tab !== 'my' && f.assignedToId) params['filters[assignedTo][id][$eq]'] = f.assignedToId;
  if (f.companyQuery?.trim()) {
    params['filters[companyName][$containsi]'] = f.companyQuery.trim();
  }

  const createdAt = dateRangeToCreatedAtFilter(f.dateRange);
  if (createdAt) params['filters[createdAt]'] = createdAt;

  const dealValue = valueRangeToDealValueFilter(f.valueRange);
  if (dealValue) params['filters[dealValue]'] = dealValue;

  return params;
}

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

/** Fetch contacts for specific lead companies only (avoids org-wide contact scan). */
async function mergeContactsOntoLeadCompanies(companies) {
  if (!companies?.length) return companies;

  const leadIds = companies
    .map((co) => co.id ?? co.documentId)
    .filter((id) => id != null)
    .map((id) => parseInt(id, 10))
    .filter((n) => !Number.isNaN(n));

  if (!leadIds.length) return companies;

  const byLead = new Map();
  const chunkSize = 100;
  for (let i = 0; i < leadIds.length; i += chunkSize) {
    const chunk = leadIds.slice(i, i + chunkSize);
    const query = {
      sort: 'createdAt:desc',
      populate: ['leadCompany'],
      'pagination[page]': 1,
      'pagination[pageSize]': Math.min(chunk.length * 50, 500),
    };
    chunk.forEach((id, idx) => {
      query[`filters[$or][${idx}][leadCompany][id][$eq]`] = id;
    });
    const res = await contactService.getAll(query);
    const batch = Array.isArray(res.data) ? res.data : [];
    for (const c of batch) {
      const lc = c.leadCompany;
      const lid = lc && typeof lc === 'object' ? lc.id ?? lc.documentId : lc;
      if (lid == null) continue;
      const key = String(lid);
      if (!byLead.has(key)) byLead.set(key, []);
      byLead.get(key).push(c);
    }
  }

  for (const list of byLead.values()) {
    list.sort((a, b) => Number(!!b.isPrimaryContact) - Number(!!a.isPrimaryContact));
  }

  return companies.map((co) => {
    const cid = co.id ?? co.documentId;
    if (cid == null) return co;
    const merged = byLead.get(String(cid));
    if (!merged?.length) return co;
    const existingById = new Map((co.contacts || []).map((c) => [String(c.id), c]));
    const enriched = merged.map((c) => {
      const ex = existingById.get(String(c.id));
      if (!ex) return c;
      return {
        ...ex,
        ...c,
        email: c.email || ex.email,
        phone: c.phone || ex.phone,
        firstName: c.firstName || ex.firstName,
        lastName: c.lastName || ex.lastName,
      };
    });
    return { ...co, contacts: enriched };
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
   * Stats by status from dedicated backend endpoint (fast counts, no full list fetch).
   */
  async getStats() {
    try {
      const response = await strapiClient.get(`${ENDPOINT}/stats`);
      const data = response?.data ?? response ?? {};
      return {
        byStatus: data.byStatus || {},
        facets: data.facets || { sources: [], types: [] },
      };
    } catch (err) {
      console.error('Lead company getStats error:', err);
      return { byStatus: {}, facets: { sources: [], types: [] } };
    }
  },

  /** Paginate through all lead companies (dashboard widgets, exports). Avoid mergeContacts on every page. */
  async fetchAll(params = {}) {
    const { mergeContactsFromContactsApi, ...rest } = params;
    const pageSize = 100;
    let page = 1;
    const out = [];
    let pageCount = 1;
    do {
      const res = await this.getAll({
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
        sort: 'createdAt:desc',
        ...rest,
      });
      const batch = Array.isArray(res.data) ? res.data : [];
      out.push(...batch);
      pageCount = res?.meta?.pagination?.pageCount ?? 1;
      page += 1;
    } while (page <= pageCount);

    if (mergeContactsFromContactsApi && out.length) {
      return mergeContactsOntoLeadCompanies(out);
    }
    return out;
  },

  buildListParams: buildLeadCompanyListParams,
};
