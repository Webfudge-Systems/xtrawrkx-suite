/**
 * Contact API — Strapi /contacts.
 */
import strapiClient from '../strapiClient';
import {
  buildListQuery,
  normalizeStrapiEntry,
  normalizeStrapiListResponse,
  normalizeStrapiOneResponse,
} from './strapiContentApi';

const ENDPOINT = '/contacts';

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

function appendContactSearchFilters(params, q, prefix = 'filters') {
  params[`${prefix}[$or][0][firstName][$containsi]`] = q;
  params[`${prefix}[$or][1][lastName][$containsi]`] = q;
  params[`${prefix}[$or][2][email][$containsi]`] = q;
  params[`${prefix}[$or][3][companyName][$containsi]`] = q;
}

function appendWithCompanyTabFilters(params, prefix = 'filters') {
  params[`${prefix}[$or][0][companyName][$notNull]`] = true;
  params[`${prefix}[$or][1][leadCompany][id][$notNull]`] = true;
}

/** Build Strapi list query for the contacts table (server-side pagination + filters). */
export function buildContactListParams({
  page = 1,
  pageSize = 15,
  activeTab = 'all',
  searchQuery = '',
  appliedFilters = {},
  sort = 'createdAt:desc',
  populate = ['leadCompany', 'clientAccount', 'assignedTo'],
} = {}) {
  const params = {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    sort,
    populate,
  };

  const tab = String(activeTab || 'all').toLowerCase();
  const q = String(searchQuery || '').trim();
  const needsWithCompanyTab = tab === 'withcompany';
  const needsSearch = Boolean(q);

  if (needsSearch && needsWithCompanyTab) {
    appendContactSearchFilters(params, q, 'filters[$and][0]');
    appendWithCompanyTabFilters(params, 'filters[$and][1]');
  } else if (needsSearch) {
    appendContactSearchFilters(params, q);
  } else if (needsWithCompanyTab) {
    appendWithCompanyTabFilters(params);
  } else if (tab === 'withemail') {
    params['filters[email][$notNull]'] = true;
  } else if (tab === 'withphone') {
    params['filters[phone][$notNull]'] = true;
  }

  const f = appliedFilters || {};
  if (f.status) params['filters[status][$eq]'] = String(f.status).toUpperCase();
  if (f.source) params['filters[source][$eq]'] = String(f.source).toUpperCase();
  if (f.preferredContactMethod) {
    params['filters[preferredContactMethod][$eq]'] = String(f.preferredContactMethod).toUpperCase();
  }
  if (f.assignedToId) params['filters[assignedTo][id][$eq]'] = f.assignedToId;
  if (f.companyQuery?.trim()) {
    params['filters[companyName][$containsi]'] = f.companyQuery.trim();
  }
  if (f.hasEmail === 'yes') params['filters[email][$notNull]'] = true;
  if (f.hasEmail === 'no') params['filters[email][$null]'] = true;
  if (f.hasPhone === 'yes') params['filters[phone][$notNull]'] = true;
  if (f.hasPhone === 'no') params['filters[phone][$null]'] = true;

  const createdAt = dateRangeToCreatedAtFilter(f.dateRange);
  if (createdAt) params['filters[createdAt]'] = createdAt;

  return params;
}

function normalizeEntry(entry) {
  return normalizeStrapiEntry(entry);
}

function normalizeListResponse(response) {
  return normalizeStrapiListResponse(response, normalizeEntry);
}

function normalizeOneResponse(response) {
  return normalizeStrapiOneResponse(response, normalizeEntry);
}

/** Build Strapi `data` object; drop empties; map CRM field names to schema. */
function toStrapiData(payload) {
  const data = {};
  const set = (key, value) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    data[key] = value;
  };

  set('firstName', payload.firstName?.trim());
  set('lastName', payload.lastName?.trim());
  if (payload.email != null && String(payload.email).trim()) {
    data.email = String(payload.email).trim();
  }
  set('phone', payload.phone?.trim());
  set('companyName', payload.companyName?.trim());
  set('companyWebsite', payload.companyWebsite?.trim());
  if (payload.status) set('status', payload.status);
  if (payload.source) set('source', payload.source);
  set('preferredContactMethod', payload.preferredContactMethod);
  set('birthDate', payload.birthDate);
  set('timezone', payload.timezone?.trim());
  set('jobTitle', payload.jobTitle?.trim());
  set('department', payload.department?.trim());
  set('contactRole', payload.contactRole?.trim());
  if (payload.isPrimaryContact === true || payload.isPrimaryContact === false) {
    data.isPrimaryContact = Boolean(payload.isPrimaryContact);
  }
  set('address', payload.address?.trim());
  set('city', payload.city?.trim());
  set('state', payload.state?.trim());
  set('country', payload.country?.trim());
  set('zipCode', payload.zipCode?.trim());
  const linkedIn = payload.linkedIn?.trim() || payload.linkedinUrl?.trim();
  set('linkedIn', linkedIn);
  set('twitter', payload.twitter?.trim());
  set('notes', payload.notes?.trim());

  if (payload.assignedTo != null && payload.assignedTo !== '') {
    const n = parseInt(payload.assignedTo, 10);
    if (!Number.isNaN(n)) data.assignedTo = n;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'leadCompany')) {
    if (payload.leadCompany == null || payload.leadCompany === '') {
      data.leadCompany = null;
    } else {
      const n = parseInt(payload.leadCompany, 10);
      if (!Number.isNaN(n)) data.leadCompany = n;
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'clientAccount')) {
    if (payload.clientAccount == null || payload.clientAccount === '') {
      data.clientAccount = null;
    } else {
      const n = parseInt(payload.clientAccount, 10);
      if (!Number.isNaN(n)) data.clientAccount = n;
    }
  }

  return data;
}

function relationConnectFormat(data) {
  const out = { ...data };
  if (out.assignedTo != null && typeof out.assignedTo === 'number') {
    out.assignedTo = { id: out.assignedTo };
  }
  if (out.leadCompany != null && typeof out.leadCompany === 'number') {
    out.leadCompany = { id: out.leadCompany };
  }
  if (out.clientAccount != null && typeof out.clientAccount === 'number') {
    out.clientAccount = { id: out.clientAccount };
  }
  return out;
}

export default {
  async getAll(params = {}) {
    const response = await strapiClient.get(ENDPOINT, buildListQuery(params));
    return normalizeListResponse(response);
  },

  async getStats() {
    try {
      const response = await strapiClient.get(`${ENDPOINT}/stats`);
      const data = response?.data ?? response ?? {};
      return {
        total: data.total ?? 0,
        withEmail: data.withEmail ?? 0,
        withPhone: data.withPhone ?? 0,
        withCompany: data.withCompany ?? 0,
        facets: data.facets || { sources: [], preferredContactMethods: [] },
      };
    } catch (err) {
      console.error('Contact getStats error:', err);
      return {
        total: 0,
        withEmail: 0,
        withPhone: 0,
        withCompany: 0,
        facets: { sources: [], preferredContactMethods: [] },
      };
    }
  },

  async getOne(id, options = {}) {
    const populate = options.populate ?? ['assignedTo', 'organization', 'leadCompany', 'clientAccount'];
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

  /** Paginate through every contact page (dashboard widgets, exports). */
  async fetchAll(params = {}) {
    const pageSize = 100;
    let page = 1;
    const out = [];
    let pageCount = 1;
    do {
      const res = await this.getAll({
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
        sort: 'createdAt:desc',
        populate: ['leadCompany', 'clientAccount', 'assignedTo'],
        ...params,
      });
      const batch = Array.isArray(res.data) ? res.data : [];
      out.push(...batch);
      pageCount = res?.meta?.pagination?.pageCount ?? 1;
      page += 1;
    } while (page <= pageCount);
    return out;
  },

  buildListParams: buildContactListParams,
};
