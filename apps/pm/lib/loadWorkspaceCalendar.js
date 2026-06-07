/**
 * Same workspace calendar data as CRM — shared Strapi API.
 * Recurring tasks are merged so series occurrences render inside the visible range.
 */
import strapiClient from './strapiClient';
import projectService from './api/projectService';
import { transformTask, transformProject } from './api/dataTransformers';
import { mergeTaskListsForCalendar, paginateStrapiList, projectOverlapsRange } from '@webfudge/utils';

function pickRelation(rel) {
  if (!rel) return null;
  const d = rel.data !== undefined ? rel.data : rel;
  const node = Array.isArray(d) ? d[0] : d;
  if (!node) return null;
  const a = node.attributes || node;
  const id = node.id ?? a.id;
  return {
    id,
    name: a.name,
    companyName: a.companyName || a.name,
    firstName: a.firstName,
    lastName: a.lastName,
    email: a.email,
  };
}

function meetingFromApi(raw) {
  if (!raw) return null;
  const e = raw.attributes || raw;
  const id = raw.id ?? e.id;
  return {
    id,
    title: e.title,
    startTime: e.startTime,
    endTime: e.endTime,
    status: e.status,
    meetingType: e.meetingType,
    isVirtual: e.isVirtual,
    location: e.location,
    deal: pickRelation(e.deal),
    clientAccount: pickRelation(e.clientAccount),
    leadCompany: pickRelation(e.leadCompany),
    contact: pickRelation(e.contact),
  };
}

const TASK_QUERY_BASE = {
  'populate[assignee]': '*',
  'populate[projects][fields][0]': 'id',
  'populate[projects][fields][1]': 'name',
  'populate[projects][fields][2]': 'slug',
};

async function fetchAllCalendarTasks(queryBase) {
  const pageSize = Number(queryBase['pagination[pageSize]']) || 200;
  const rows = await paginateStrapiList(
    (page, ps, cacheBust) =>
      strapiClient.get('/tasks', {
        ...queryBase,
        'pagination[page]': page,
        'pagination[pageSize]': ps,
        _: cacheBust,
      }),
    { pageSize }
  );
  return rows.map(transformTask).filter(Boolean);
}

export async function loadWorkspaceCalendarData(rangeStart, rangeEnd) {
  const startIso = rangeStart.toISOString();
  const endIso = rangeEnd.toISOString();

  const [meetingsRaw, rangeTasks, recurringTasks, projRes] = await Promise.all([
    strapiClient.get('/meetings', {
      sort: 'startTime:asc',
      'pagination[pageSize]': 200,
      'filters[startTime][$gte]': startIso,
      'filters[startTime][$lte]': endIso,
      'populate[0]': 'deal',
      'populate[1]': 'clientAccount',
      'populate[2]': 'leadCompany',
      'populate[3]': 'contact',
    }),
    fetchAllCalendarTasks({
      sort: 'scheduledDate:asc',
      'pagination[pageSize]': 200,
      'filters[scheduledDate][$gte]': startIso,
      'filters[scheduledDate][$lte]': endIso,
      ...TASK_QUERY_BASE,
    }),
    fetchAllCalendarTasks({
      sort: 'scheduledDate:asc',
      'pagination[pageSize]': 150,
      'filters[recurrenceFrequency][$ne]': 'none',
      ...TASK_QUERY_BASE,
    }),
    projectService.getAllProjects({
      pageSize: 200,
    }),
  ]);

  const meetBody = meetingsRaw?.data ?? meetingsRaw;
  const meetList = Array.isArray(meetBody?.data) ? meetBody.data : Array.isArray(meetBody) ? meetBody : [];
  const meetings = meetList.map(meetingFromApi).filter(Boolean);

  const tasks = mergeTaskListsForCalendar(rangeTasks, recurringTasks);

  const rawProjects = projRes?.data || [];
  const projects = rawProjects
    .map(transformProject)
    .filter((p) => p && projectOverlapsRange(p, rangeStart, rangeEnd));

  return { meetings, tasks, projects };
}
