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
};
