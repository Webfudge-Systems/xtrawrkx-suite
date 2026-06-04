/**
 * Fetch meetings, scheduled tasks, and projects for the unified workspace calendar.
 * Loads recurring tasks separately so occurrences outside `scheduledDate` range still expand on the grid.
 */
import meetingService from './api/meetingService';
import taskService from './api/taskService';
import projectService from './api/projectService';
import { mergeTaskListsForCalendar, projectOverlapsRange } from '@webfudge/utils';

const TASK_POPULATE = ['assignee', 'projects', 'deal', 'clientAccount', 'leadCompany'];

export async function loadWorkspaceCalendarData(rangeStart, rangeEnd) {
  const startIso = rangeStart.toISOString();
  const endIso = rangeEnd.toISOString();

  const [meetRes, taskRangeRes, taskRecurringRes, projRes] = await Promise.all([
    meetingService.getCalendarRange({
      'filters[startTime][$gte]': startIso,
      'filters[startTime][$lte]': endIso,
    }),
    taskService.getAll({
      sort: 'scheduledDate:asc',
      'pagination[pageSize]': 200,
      'filters[scheduledDate][$gte]': startIso,
      'filters[scheduledDate][$lte]': endIso,
      populate: TASK_POPULATE,
    }),
    taskService.getAll({
      sort: 'scheduledDate:asc',
      'pagination[pageSize]': 150,
      'filters[recurrenceFrequency][$ne]': 'none',
      populate: TASK_POPULATE,
    }),
    projectService.getAll({
      sort: 'updatedAt:desc',
      'pagination[pageSize]': 200,
      populate: ['projectManager', 'clientAccount'],
    }),
  ]);

  const meetings = Array.isArray(meetRes?.data) ? meetRes.data : [];
  const rangeTasks = Array.isArray(taskRangeRes?.data) ? taskRangeRes.data : [];
  const recurringTasks = Array.isArray(taskRecurringRes?.data) ? taskRecurringRes.data : [];
  const tasks = mergeTaskListsForCalendar(rangeTasks, recurringTasks);

  let projects = Array.isArray(projRes?.data) ? projRes.data : [];
  projects = projects.filter((p) => projectOverlapsRange(p, rangeStart, rangeEnd));

  return { meetings, tasks, projects };
}
