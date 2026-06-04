/**
 * Projects — Strapi /projects.
 */
import strapiClient from '../strapiClient';
import {
  buildListQuery,
  normalizeStrapiEntry,
  normalizeStrapiListResponse,
  normalizeStrapiOneResponse,
} from './strapiContentApi';

const ENDPOINT = '/projects';

function normalizeEntry(entry) {
  return normalizeStrapiEntry(entry);
}

function normalizeListResponse(response) {
  return normalizeStrapiListResponse(response, normalizeEntry);
}

function normalizeOneResponse(response) {
  return normalizeStrapiOneResponse(response, normalizeEntry);
}

function buildWritePayload(payload) {
  const data = { ...payload };
  if (data.projectManager != null && typeof data.projectManager === 'number') {
    data.projectManager = { id: data.projectManager };
  }
  if (data.clientAccount != null && typeof data.clientAccount === 'number') {
    data.clientAccount = { id: data.clientAccount };
  }
  if (data.organization != null && typeof data.organization === 'number') {
    data.organization = { id: data.organization };
  }
  if (data.sourceDeal != null && typeof data.sourceDeal === 'number') {
    data.sourceDeal = { id: data.sourceDeal };
  }
  return data;
}

export default {
  async getAll(params = {}) {
    const response = await strapiClient.get(ENDPOINT, buildListQuery(params));
    return normalizeListResponse(response);
  },

  async getOne(id, options = {}) {
    const populate =
      options.populate ?? [
        'projectManager',
        'teamMembers',
        'tasks',
        'clientAccount',
        'organization',
        'sourceDeal',
      ];
    const response = await strapiClient.get(`${ENDPOINT}/${id}`, { populate });
    return normalizeOneResponse(response);
  },

  async create(payload) {
    const response = await strapiClient.post(ENDPOINT, { data: buildWritePayload(payload) });
    return normalizeOneResponse(response);
  },

  async update(id, payload) {
    const response = await strapiClient.put(`${ENDPOINT}/${id}`, { data: buildWritePayload(payload) });
    return normalizeOneResponse(response);
  },

  async delete(id) {
    await strapiClient.delete(`${ENDPOINT}/${id}`);
    return {};
  },
};
