/**
 * Tasks — Strapi /tasks; dashboard My work uses GET /tasks/my-work.
 * CRM list/summary calls pass scope=crm so PM project-only tasks are excluded.
 */
import strapiClient from '../strapiClient';
import { listCacheBust, paginateStrapiList } from '@webfudge/utils';
import { filterCrmTasks, filterCrmMyWorkSummary } from '../crmTasks';
import {
  buildListQuery,
  normalizeStrapiEntry,
  normalizeStrapiListResponse,
  normalizeStrapiOneResponse,
} from './strapiContentApi';

const ENDPOINT = '/tasks';
const CRM_SCOPE = { scope: 'crm' };

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
  if (data.assignee != null && typeof data.assignee === 'number') {
    data.assignee = { id: data.assignee };
  }
  if (data.deal != null && typeof data.deal === 'number') {
    data.deal = { id: data.deal };
  }
  if (data.clientAccount != null && typeof data.clientAccount === 'number') {
    data.clientAccount = { id: data.clientAccount };
  }
  if (data.leadCompany != null && typeof data.leadCompany === 'number') {
    data.leadCompany = { id: data.leadCompany };
  }
  if (data.organization != null && typeof data.organization === 'number') {
    data.organization = { id: data.organization };
  }
  return data;
}

/**
 * Open tasks for a deal (next steps on deal detail).
 * @param {string|number} dealId
 * @returns {Promise<{ data: object[] }>}
 */
async function getByDealId(dealId, options = {}) {
  const pageSize = options.pageSize ?? 50;
  const dealIdStr = dealId == null ? '' : String(dealId).trim();
  const asNum = Number(dealIdStr);
  const dealFilter =
    dealIdStr !== '' && !Number.isNaN(asNum) && String(asNum) === dealIdStr
      ? { id: { $eq: asNum } }
      : { documentId: { $eq: dealIdStr } };

  const query = buildListQuery({
    'pagination[pageSize]': pageSize,
    sort: options.sort ?? 'scheduledDate:asc',
    filters: { deal: dealFilter },
    populate: ['assignee', 'leadCompany', 'clientAccount', 'deal'],
  });
  const res = await strapiClient.get(ENDPOINT, query);
  return normalizeListResponse(res);
}

/**
 * @returns {Promise<{ overdue: { count: number, items: object[] }, today: object, upcoming: object }>}
 */
export async function fetchMyWorkSummary() {
  const res = await strapiClient.get(`${ENDPOINT}/my-work`, CRM_SCOPE);
  const data = res?.data;
  if (!data || typeof data !== 'object') {
    return filterCrmMyWorkSummary(null);
  }
  return filterCrmMyWorkSummary(data);
}

async function getAll(params = {}) {
  const response = await strapiClient.get(
    ENDPOINT,
    buildListQuery({ ...params, ...CRM_SCOPE })
  );
  const normalized = normalizeListResponse(response);
  normalized.data = filterCrmTasks(normalized.data);
  return normalized;
}

/**
 * Paginate through every CRM-scoped task page (list views, dashboards).
 * @returns {Promise<{ data: object[], meta: { pagination: object } }>}
 */
async function fetchAll(params = {}) {
  const cacheBust = listCacheBust(params);
  const pageSize = Math.min(
    Number(params['pagination[pageSize]'] ?? params.pageSize) || 100,
    500
  );
  const rows = await paginateStrapiList(
    (page, ps) =>
      strapiClient
        .get(
          ENDPOINT,
          buildListQuery({
            ...params,
            ...CRM_SCOPE,
            'pagination[page]': page,
            'pagination[pageSize]': ps,
            _: cacheBust,
          })
        )
        .then((response) => {
          const normalized = normalizeListResponse(response);
          normalized.data = filterCrmTasks(normalized.data);
          return normalized;
        }),
    { ...params, pageSize, cacheBust }
  );
  return {
    data: rows,
    meta: {
      pagination: {
        page: 1,
        pageSize: rows.length,
        pageCount: 1,
        total: rows.length,
      },
    },
  };
}

async function getOne(id, options = {}) {
  const populate =
    options.populate ?? [
      'assignee',
      'collaborators',
      'projects',
      'parent',
      'subtasks',
      'leadCompany',
      'clientAccount',
      'deal',
      'organization',
    ];
  const response = await strapiClient.get(`${ENDPOINT}/${id}`, { populate });
  return normalizeOneResponse(response);
}

async function create(payload) {
  const response = await strapiClient.post(ENDPOINT, { data: buildWritePayload(payload) });
  return normalizeOneResponse(response);
}

async function update(id, payload) {
  const response = await strapiClient.put(`${ENDPOINT}/${id}`, { data: buildWritePayload(payload) });
  return normalizeOneResponse(response);
}

async function deleteTask(id) {
  await strapiClient.delete(`${ENDPOINT}/${id}`);
  return {};
}

const taskService = {
  fetchMyWorkSummary,
  getByDealId,
  getAll,
  fetchAll,
  getOne,
  create,
  update,
  delete: deleteTask,
};

export default taskService;
