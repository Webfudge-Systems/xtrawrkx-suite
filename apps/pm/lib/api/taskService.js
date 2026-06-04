import strapiClient from '../strapiClient';

const CRM_RELATION_FIELDS = ['leadCompany', 'clientAccount', 'contact', 'deal'];

/**
 * Strapi 5 many-to-many relations expect `{ set: [id, ...] }` (not a bare ID array).
 * Maps modal fields `projectId` / `project` onto `projects`.
 */
function normalizeTaskPayload(taskData = {}) {
  const payload = { ...taskData };
  const hadProjectIdKey =
    Object.prototype.hasOwnProperty.call(taskData, 'projectId') ||
    Object.prototype.hasOwnProperty.call(taskData, 'project');
  const raw = payload.projectId ?? payload.project;

  delete payload.project;
  delete payload.projectId;

  let idNum = NaN;
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    const n = Number(raw);
    if (!Number.isNaN(n)) idNum = n;
  }

  if (!Number.isNaN(idNum)) {
    payload.projects = { set: [idNum] };
  } else if (hadProjectIdKey) {
    payload.projects = { set: [] };
  }

  if (Object.prototype.hasOwnProperty.call(taskData, 'assigneeUserIds')) {
    const ids = Array.isArray(taskData.assigneeUserIds)
      ? taskData.assigneeUserIds.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)
      : [];
    payload.collaborators = { set: ids };
    delete payload.assigneeUserIds;
  }

  if (Object.prototype.hasOwnProperty.call(taskData, 'assignerId')) {
    const a = taskData.assignerId;
    delete payload.assignerId;
    if (a !== '' && a != null) {
      const n = Number(a);
      if (Number.isFinite(n) && n > 0) payload.assigner = n;
    } else {
      // Omit assigner so the API can apply server defaults instead of `{ assigner: null }`.
      delete payload.assigner;
    }
  }

  if (Object.prototype.hasOwnProperty.call(taskData, 'parentId')) {
    const p = taskData.parentId;
    delete payload.parentId;
    if (p === '' || p == null) payload.parent = null;
    else {
      const n = Number(p);
      if (Number.isFinite(n) && n > 0) payload.parent = n;
    }
  }

  delete payload.subtasks;

  return payload;
}

class TaskService {
  async getAllTasks(options = {}) {
    try {
      const params = {
        'pagination[page]': options.page || 1,
        'pagination[pageSize]': options.pageSize || 25,
        'sort': options.sort || 'createdAt:desc',
        'populate[assignee]': '*',
        'populate[assigner]': '*',
        'populate[collaborators]': '*',
        'populate[pendingCollaborators]': '*',
        'populate[assignmentRequestedBy][fields][0]': 'id',
        'populate[assignmentRequestedBy][fields][1]': 'username',
        'populate[assignmentRequestedBy][fields][2]': 'email',
        'populate[projects][fields][0]': 'id',
        'populate[projects][fields][1]': 'name',
        'populate[projects][fields][2]': 'slug',
        'populate[subtasks][fields][0]': 'id',
        'populate[subtasks][fields][1]': 'name',
        'populate[subtasks][fields][2]': 'status',
        'populate[parent][fields][0]': 'id',
        'populate[parent][fields][1]': 'name',
      };

      if (options.status) params['filters[status][$eq]'] = options.status;
      if (options.priority) params['filters[priority][$eq]'] = options.priority;
      const projectId = options.projectId || options.project;
      if (projectId) params['filters[projects][id][$eq]'] = projectId;

      return await strapiClient.get('/tasks', params);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return { data: [], meta: { pagination: { total: 0 } } };
    }
  }

  async getTaskById(id, populate = true) {
    try {
      const params = populate ? {
        'populate[assignee]': '*',
        'populate[assigner]': '*',
        'populate[collaborators]': '*',
        'populate[projects]': '*',
        'populate[parent][fields][0]': 'id',
        'populate[parent][fields][1]': 'name',
        'populate[subtasks][populate][assignee]': '*',
      } : {};
      return await strapiClient.get(`/tasks/${id}`, params);
    } catch (error) {
      console.error(`Error fetching task ${id}:`, error);
      throw error;
    }
  }

  async getTasksByProject(projectId, options = {}) {
    try {
      const params = {
        'pagination[page]': options.page || 1,
        'pagination[pageSize]': options.pageSize || 100,
        'sort': options.sort || 'createdAt:desc',
        'filters[projects][id][$eq]': projectId,
        'populate[assignee]': '*',
        'populate[assigner]': '*',
        'populate[collaborators]': '*',
        'populate[pendingCollaborators]': '*',
        'populate[assignmentRequestedBy][fields][0]': 'id',
        'populate[assignmentRequestedBy][fields][1]': 'username',
        'populate[assignmentRequestedBy][fields][2]': 'email',
        'populate[projects][fields][0]': 'id',
        'populate[projects][fields][1]': 'name',
        'populate[projects][fields][2]': 'slug',
        'populate[subtasks][fields][0]': 'id',
        'populate[subtasks][fields][1]': 'name',
        'populate[subtasks][fields][2]': 'status',
        'populate[parent][fields][0]': 'id',
        'populate[parent][fields][1]': 'name',
      };
      if (options.status) params['filters[status][$eq]'] = options.status;
      return await strapiClient.get('/tasks', params);
    } catch (error) {
      console.error('Error fetching tasks by project:', error);
      return { data: [] };
    }
  }

  async getTasksByAssignee(userId, options = {}) {
    try {
      const params = {
        'pagination[page]': options.page || 1,
        'pagination[pageSize]': options.pageSize || 50,
        'sort': options.sort || 'createdAt:desc',
        'filters[assignee][id][$eq]': userId,
        'populate[assignee]': '*',
        'populate[assigner]': '*',
        'populate[collaborators]': '*',
        'populate[pendingCollaborators]': '*',
        'populate[assignmentRequestedBy][fields][0]': 'id',
        'populate[assignmentRequestedBy][fields][1]': 'username',
        'populate[assignmentRequestedBy][fields][2]': 'email',
        'populate[projects][fields][0]': 'id',
        'populate[projects][fields][1]': 'name',
        'populate[projects][fields][2]': 'slug',
        'populate[subtasks][fields][0]': 'id',
        'populate[subtasks][fields][1]': 'name',
        'populate[subtasks][fields][2]': 'status',
        'populate[parent][fields][0]': 'id',
        'populate[parent][fields][1]': 'name',
      };
      if (options.status) params['filters[status][$eq]'] = options.status;
      if (options.priority) params['filters[priority][$eq]'] = options.priority;
      const projectId = options.projectId || options.project;
      if (projectId) params['filters[projects][id][$eq]'] = projectId;
      return await strapiClient.get('/tasks', params);
    } catch (error) {
      console.error('Error fetching tasks by assignee:', error);
      return { data: [] };
    }
  }

  // Gets tasks where the user is primary assignee or in collaborators; excludes CRM-scoped tasks
  async getPMTasksByAssignee(userId, options = {}) {
    try {
      const pageSize = Math.min(Number(options.pageSize) || 200, 500);
      const sort = options.sort || 'updatedAt:desc';
      const basePopulate = {
        'populate[assignee]': '*',
        'populate[assigner]': '*',
        'populate[collaborators]': '*',
        'populate[pendingCollaborators]': '*',
        'populate[assignmentRequestedBy][fields][0]': 'id',
        'populate[assignmentRequestedBy][fields][1]': 'username',
        'populate[assignmentRequestedBy][fields][2]': 'email',
        'populate[projects][fields][0]': 'id',
        'populate[projects][fields][1]': 'name',
        'populate[projects][fields][2]': 'slug',
        'populate[subtasks][fields][0]': 'id',
        'populate[subtasks][fields][1]': 'name',
        'populate[subtasks][fields][2]': 'status',
        'populate[parent][fields][0]': 'id',
        'populate[parent][fields][1]': 'name',
      };
      const base = {
        'pagination[page]': options.page || 1,
        'pagination[pageSize]': pageSize,
        sort,
        ...basePopulate,
      };
      if (options.status) base['filters[status][$eq]'] = options.status;
      if (options.priority) base['filters[priority][$eq]'] = options.priority;
      const projectId = options.projectId || options.project;
      if (projectId) base['filters[projects][id][$eq]'] = projectId;

      const [responseAssignee, responseCollab] = await Promise.all([
        strapiClient.get('/tasks', { ...base, 'filters[assignee][id][$eq]': userId }),
        strapiClient.get('/tasks', { ...base, 'filters[collaborators][id][$eq]': userId }),
      ]);

      const byId = new Map();
      for (const row of [...(responseAssignee?.data || []), ...(responseCollab?.data || [])]) {
        const id = row?.id ?? row?.attributes?.id;
        if (id != null) byId.set(id, row);
      }
      const items = [...byId.values()];
      const pmTasks = items.filter((task) => {
        const t = task.attributes || task;
        return !CRM_RELATION_FIELDS.some((field) => {
          const rel = t[field];
          if (!rel) return false;
          const relData = rel.data !== undefined ? rel.data : rel;
          return relData !== null && relData !== undefined && (Array.isArray(relData) ? relData.length > 0 : true);
        });
      });
      return { data: pmTasks, meta: responseAssignee?.meta };
    } catch (error) {
      console.error('Error fetching PM tasks by assignee:', error);
      return { data: [] };
    }
  }

  // Get tasks where user is a collaborator (for dashboard)
  async getCollaboratorTasks(userId, options = {}) {
    try {
      const params = {
        'pagination[page]': 1,
        'pagination[pageSize]': options.pageSize || 50,
        'sort': options.sort || 'updatedAt:desc',
        'filters[collaborators][id][$eq]': userId,
        'populate[assignee]': '*',
        'populate[assigner]': '*',
        'populate[collaborators]': '*',
        'populate[pendingCollaborators]': '*',
        'populate[assignmentRequestedBy][fields][0]': 'id',
        'populate[assignmentRequestedBy][fields][1]': 'username',
        'populate[assignmentRequestedBy][fields][2]': 'email',
        'populate[projects][fields][0]': 'id',
        'populate[projects][fields][1]': 'name',
        'populate[projects][fields][2]': 'slug',
      };
      if (options.openOnly) {
        params['filters[status][$notIn][0]'] = 'COMPLETED';
        params['filters[status][$notIn][1]'] = 'CANCELLED';
      }
      return await strapiClient.get('/tasks', params);
    } catch (error) {
      console.error('Error fetching collaborator tasks:', error);
      return { data: [] };
    }
  }

  async createTask(taskData) {
    try {
      return await strapiClient.post('/tasks', { data: normalizeTaskPayload(taskData) });
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(id, taskData) {
    try {
      return await strapiClient.put(`/tasks/${id}`, { data: normalizeTaskPayload(taskData) });
    } catch (error) {
      console.error(`Error updating task ${id}:`, error);
      throw error;
    }
  }

  async updateTaskStatus(id, status) {
    return this.updateTask(id, { status });
  }

  async approveTaskAssignment(id) {
    try {
      return await strapiClient.post(`/tasks/${id}/approve-assignment`, {});
    } catch (error) {
      console.error(`Error approving assignment for task ${id}:`, error);
      throw error;
    }
  }

  async rejectTaskAssignment(id) {
    try {
      return await strapiClient.post(`/tasks/${id}/reject-assignment`, {});
    } catch (error) {
      console.error(`Error rejecting assignment for task ${id}:`, error);
      throw error;
    }
  }

  async deleteTask(id) {
    try {
      return await strapiClient.delete(`/tasks/${id}`);
    } catch (error) {
      console.error(`Error deleting task ${id}:`, error);
      throw error;
    }
  }

  async searchTasks(query, options = {}) {
    try {
      const params = {
        'pagination[page]': 1,
        'pagination[pageSize]': options.pageSize || 10,
        'filters[$or][0][name][$containsi]': query,
        'filters[$or][1][description][$containsi]': query,
        'populate[projects][fields][0]': 'name',
        'populate[assignee][fields][0]': 'firstName',
        'populate[assignee][fields][1]': 'lastName',
      };
      return await strapiClient.get('/tasks', params);
    } catch (error) {
      console.error('Error searching tasks:', error);
      return { data: [] };
    }
  }

  async getTasksByStatus(status, options = {}) {
    return this.getAllTasks({ ...options, status });
  }

  async getOverdueTasks(options = {}) {
    try {
      const params = {
        'pagination[pageSize]': options.pageSize || 50,
        'filters[scheduledDate][$lt]': new Date().toISOString(),
        'filters[status][$ne]': 'COMPLETED',
        'populate[assignee]': '*',
        'populate[assigner]': '*',
        'populate[collaborators]': '*',
        'populate[projects][fields][0]': 'name',
      };
      return await strapiClient.get('/tasks', params);
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
      return { data: [] };
    }
  }

  async getTaskStats(userId = null) {
    try {
      let response;
      if (userId) {
        response = await this.getAllTasks({ pageSize: 500 });
      } else {
        response = await this.getAllTasks({ pageSize: 500 });
      }
      const tasks = response?.data || [];

      const now = new Date();
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => {
        const tData = t.attributes || t;
        return tData.status === 'COMPLETED';
      }).length;
      const inProgressTasks = tasks.filter((t) => {
        const tData = t.attributes || t;
        return tData.status === 'IN_PROGRESS';
      }).length;
      const scheduledTasks = tasks.filter((t) => {
        const tData = t.attributes || t;
        return tData.status === 'SCHEDULED';
      }).length;
      const overdueTasks = tasks.filter((t) => {
        const tData = t.attributes || t;
        return tData.scheduledDate && new Date(tData.scheduledDate) < now && tData.status !== 'COMPLETED';
      }).length;

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        scheduledTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    } catch (error) {
      console.error('Error fetching task stats:', error);
      return { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, scheduledTasks: 0, overdueTasks: 0, completionRate: 0 };
    }
  }
}

export default new TaskService();
