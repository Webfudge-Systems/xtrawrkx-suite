/**
 * Client Account API — Strapi /client-accounts.
 */
import strapiClient from '../strapiClient';
import {
  buildListQuery,
  normalizeStrapiEntry,
  normalizeStrapiListResponse,
  normalizeStrapiOneResponse,
} from './strapiContentApi';

const ENDPOINT = '/client-accounts';

function normalizeEntry(entry) {
  return normalizeStrapiEntry(entry);
}

function normalizeListResponse(response) {
  return normalizeStrapiListResponse(response, normalizeEntry);
}

function normalizeOneResponse(response) {
  return normalizeStrapiOneResponse(response, normalizeEntry);
}

export default {
  async getAll(params = {}) {
    const response = await strapiClient.get(ENDPOINT, buildListQuery(params));
    return normalizeListResponse(response);
  },

  async getOne(id, options = {}) {
    const populate =
      options.populate ?? ['assignedTo', 'organization', 'convertedFromLead', 'contacts'];
    const response = await strapiClient.get(`${ENDPOINT}/${id}`, { populate });
    return normalizeOneResponse(response);
  },

  async create(payload) {
    const data = { ...payload };
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
    const response = await strapiClient.put(`${ENDPOINT}/${id}`, { data });
    return normalizeOneResponse(response);
  },

  async delete(id) {
    await strapiClient.delete(`${ENDPOINT}/${id}`);
    return {};
  },

  async changeContactPortalPassword(id, contactId, password) {
    return strapiClient.post(
      `${ENDPOINT}/${encodeURIComponent(String(id))}/contacts/${encodeURIComponent(
        String(contactId)
      )}/portal-password`,
      { password }
    );
  },

  /** One page of client accounts for typeahead pickers (`companyName $containsi`). */
  async searchForPicker({ search = '', page = 1, pageSize = 40 } = {}) {
    const params = {
      sort: 'companyName:asc',
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
    };
    const q = String(search || '').trim();
    if (q) {
      params['filters[companyName][$containsi]'] = q;
    }
    return this.getAll(params);
  },

  /** Paginate through all client accounts (dropdowns, exports). */
  async fetchAll(params = {}) {
    const pageSize = 100;
    let page = 1;
    const out = [];
    let pageCount = 1;
    do {
      const res = await this.getAll({
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
        ...params,
      });
      const batch = Array.isArray(res.data) ? res.data : [];
      out.push(...batch);
      pageCount = res?.meta?.pagination?.pageCount ?? 1;
      page += 1;
    } while (page <= pageCount);
    return out;
  },
};
