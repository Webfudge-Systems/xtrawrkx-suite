/**
 * Helpers for PM task lists: major (root) rows vs subtasks nested under a parent.
 */

/** True when the task should appear as a top-level row (no parent, or parent not in `tasks`). */
export function isMajorTask(task, tasks) {
  if (!task?.parentId) return true;
  const idSet = new Set((tasks || []).map((t) => t?.id).filter((x) => x != null));
  return !idSet.has(task.parentId);
}

/** Keep only top-level tasks from a flat list (hide subtasks whose parent is in the same list). */
export function filterMajorTasks(tasks) {
  const list = tasks || [];
  const idSet = new Set(list.map((t) => t?.id).filter((x) => x != null));
  return list.filter((t) => !t?.parentId || !idSet.has(t.parentId));
}

/**
 * Map parent id → child tasks for inline expand rows.
 * @param {object} [options.excludeTaskIds] — ids already shown as root rows (avoid duplicates in My Tasks).
 */
function findProjectForTask(task, projects) {
  if (!task || !Array.isArray(projects) || projects.length === 0) return null;
  const pid = task.projectId;
  const slug = task.projectSlug;
  return (
    projects.find(
      (p) =>
        (pid != null && (Number(p.id) === Number(pid) || String(p.documentId) === String(pid))) ||
        (slug && String(p.slug) === String(slug))
    ) || null
  );
}

/** Attach project manager from a loaded projects list when the task API omitted nested populate. */
export function enrichTaskWithProjectManager(task, projects) {
  if (!task) return task;
  if (task.projectManager?.id) return task;
  const proj = findProjectForTask(task, projects);
  const pm = proj?.projectManager;
  if (!pm?.id) return task;
  const pmName = pm.name || pm.email || '';
  const withPm = {
    projectManager: pm,
    projectManagerId: pm.id,
    projectManagerName: pmName,
  };
  return {
    ...task,
    ...withPm,
    projects: (task.projects || []).map((p) =>
      Number(p.id) === Number(proj.id) ? { ...p, projectManager: pm } : p
    ),
    subtasks: (task.subtasks || []).map((st) =>
      st.projectManager?.id ? st : { ...st, ...withPm }
    ),
  };
}

export function enrichTasksWithProjectManager(tasks, projects) {
  return (tasks || []).map((t) => enrichTaskWithProjectManager(t, projects));
}

export function mergeTasksById(apiTasks, previousTasks) {
  const byId = new Map();
  for (const task of apiTasks || []) {
    if (task?.id != null) byId.set(String(task.id), task);
  }
  for (const task of previousTasks || []) {
    if (task?.id == null) continue;
    const id = String(task.id);
    if (!byId.has(id)) byId.set(id, task);
  }
  return [...byId.values()];
}

export function buildChildrenByParentId(tasks, { excludeTaskIds } = {}) {
  const exclude =
    excludeTaskIds instanceof Set ? excludeTaskIds : new Set(excludeTaskIds || []);
  const map = {};
  for (const task of tasks || []) {
    if (!task?.parentId) continue;
    if (exclude.has(task.id)) continue;
    if (!map[task.parentId]) map[task.parentId] = [];
    map[task.parentId].push(task);
  }
  return map;
}
