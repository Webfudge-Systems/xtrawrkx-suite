/**
 * Meeting API — Strapi /meetings.
 */
import strapiClient from '../strapiClient';
import {
  buildListQuery,
  normalizeStrapiEntry,
  normalizeStrapiListResponse,
  normalizeStrapiOneResponse,
} from './strapiContentApi';

const ENDPOINT = '/meetings';

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
    if (typeof value === 'string' && value.trim() === '' && key !== 'agenda' && key !== 'notes' && key !== 'aiSummary') return;
    data[key] = value;
  };

  set('title', payload.title?.trim());
  if (payload.startTime) set('startTime', payload.startTime);
  if (Object.prototype.hasOwnProperty.call(payload, 'endTime')) {
    data.endTime = payload.endTime || null;
  }
  if (payload.meetingType) set('meetingType', payload.meetingType);
  if (payload.status) set('status', payload.status);
  set('location', payload.location?.trim());
  if (payload.isVirtual !== undefined) data.isVirtual = Boolean(payload.isVirtual);
  if (payload.agenda !== undefined) set('agenda', payload.agenda?.trim() ?? '');
  if (payload.notes !== undefined) set('notes', payload.notes?.trim() ?? '');
  if (payload.outcome) set('outcome', payload.outcome);
  if (payload.reminderPreset) set('reminderPreset', payload.reminderPreset);
  if (payload.visibility) set('visibility', payload.visibility);
  if (payload.attendeesMeta !== undefined) data.attendeesMeta = payload.attendeesMeta;
  if (payload.recurrenceRule !== undefined) set('recurrenceRule', payload.recurrenceRule);
  if (payload.recordingUrl !== undefined) set('recordingUrl', payload.recordingUrl?.trim());
  if (payload.aiSummary !== undefined) set('aiSummary', payload.aiSummary?.trim() ?? '');
  if (payload.transcriptUrl !== undefined) set('transcriptUrl', payload.transcriptUrl?.trim());
  if (payload.externalMeetingId !== undefined) set('externalMeetingId', payload.externalMeetingId?.trim());

  const relKeys = ['organizer', 'assignedTo', 'deal', 'clientAccount', 'leadCompany', 'contact'];
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

  // manyToMany attendees — array of IDs
  if (Object.prototype.hasOwnProperty.call(payload, 'attendees')) {
    const raw = payload.attendees;
    if (Array.isArray(raw)) {
      data.attendees = raw.map((v) => parseInt(v, 10)).filter((n) => !Number.isNaN(n));
    } else if (raw === null) {
      data.attendees = [];
    }
  }

  return data;
}

function relationConnectFormat(data) {
  const out = { ...data };
  const rels = ['organizer', 'assignedTo', 'deal', 'clientAccount', 'leadCompany', 'contact'];
  for (const key of rels) {
    if (out[key] === null) continue;
    if (out[key] != null && typeof out[key] === 'number') {
      out[key] = { id: out[key] };
    }
  }
  // attendees manyToMany
  if (Array.isArray(out.attendees)) {
    out.attendees = out.attendees.map((id) =>
      typeof id === 'number' ? { id } : id
    );
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
        'organizer',
        'assignedTo',
        'organization',
        'deal',
        'clientAccount',
        'leadCompany',
        'contact',
        'attendees',
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

  /** Convenience: get all meetings for a calendar range (large page, sorted by startTime). */
  async getCalendarRange(params = {}) {
    return this.getAll({
      sort: 'startTime:asc',
      'pagination[pageSize]': 200,
      populate: ['organizer', 'assignedTo', 'deal', 'clientAccount', 'leadCompany', 'contact', 'attendees'],
      ...params,
    });
  },

  /** Get meetings linked to a specific deal. */
  async getByDeal(dealId, params = {}) {
    return this.getAll({
      sort: 'startTime:desc',
      'pagination[pageSize]': 50,
      'filters[deal][id][$eq]': dealId,
      populate: ['organizer', 'assignedTo', 'contact', 'attendees'],
      ...params,
    });
  },

  /** Get meetings linked to a specific client account. */
  async getByClientAccount(accountId, params = {}) {
    return this.getAll({
      sort: 'startTime:desc',
      'pagination[pageSize]': 50,
      'filters[clientAccount][id][$eq]': accountId,
      populate: ['organizer', 'assignedTo', 'contact', 'attendees'],
      ...params,
    });
  },

  /** Get meetings linked to a specific lead company. */
  async getByLeadCompany(leadCompanyId, params = {}) {
    return this.getAll({
      sort: 'startTime:desc',
      'pagination[pageSize]': 50,
      'filters[leadCompany][id][$eq]': leadCompanyId,
      populate: ['organizer', 'assignedTo', 'contact', 'attendees'],
      ...params,
    });
  },

  /** Count meetings for tab badges (uses list pagination total, minimal page size). */
  async countByDeal(dealId) {
    const res = await this.getAll({
      sort: 'startTime:desc',
      'filters[deal][id][$eq]': dealId,
      'pagination[pageSize]': 1,
      'pagination[page]': 1,
    });
    const t = res?.meta?.pagination?.total;
    if (typeof t === 'number') return t;
    return Array.isArray(res?.data) ? res.data.length : 0;
  },

  async countByClientAccount(accountId) {
    const res = await this.getAll({
      sort: 'startTime:desc',
      'filters[clientAccount][id][$eq]': accountId,
      'pagination[pageSize]': 1,
      'pagination[page]': 1,
    });
    const t = res?.meta?.pagination?.total;
    if (typeof t === 'number') return t;
    return Array.isArray(res?.data) ? res.data.length : 0;
  },

  async countByLeadCompany(leadCompanyId) {
    const res = await this.getAll({
      sort: 'startTime:desc',
      'filters[leadCompany][id][$eq]': leadCompanyId,
      'pagination[pageSize]': 1,
      'pagination[page]': 1,
    });
    const t = res?.meta?.pagination?.total;
    if (typeof t === 'number') return t;
    return Array.isArray(res?.data) ? res.data.length : 0;
  },

  /** Get meetings linked to a specific contact. */
  async getByContact(contactId, params = {}) {
    return this.getAll({
      sort: 'startTime:desc',
      'pagination[pageSize]': 50,
      'filters[$or][0][contact][id][$eq]': contactId,
      'filters[$or][1][attendees][id][$eq]': contactId,
      populate: ['organizer', 'assignedTo', 'deal', 'clientAccount', 'leadCompany', 'contact', 'attendees'],
      ...params,
    });
  },

  /** Check for overlapping meetings for an owner in a time range. Returns conflicting meetings. */
  async checkConflicts({ assignedToId, startTime, endTime, excludeId } = {}) {
    if (!assignedToId || !startTime || !endTime) return [];
    const params = {
      'pagination[pageSize]': 10,
      'filters[assignedTo][id][$eq]': assignedToId,
      'filters[status][$notIn][0]': 'cancelled',
      'filters[status][$notIn][1]': 'no_show',
      'filters[startTime][$lt]': endTime,
      'filters[endTime][$gt]': startTime,
      populate: ['assignedTo'],
    };
    if (excludeId) params['filters[id][$ne]'] = excludeId;
    return this.getAll(params);
  },
};
