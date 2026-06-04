function userSortKey(user) {
  return (
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    user?.username ||
    `User ${user?.id ?? ''}`
  )
    .toString()
    .toLowerCase();
}

function addUser(roster, seen, user, directoryUsers) {
  if (!user?.id) return;
  const n = Number(user.id);
  if (!Number.isFinite(n) || n <= 0 || seen.has(n)) return;
  seen.add(n);
  const fromDirectory = directoryUsers.find((u) => Number(u.id) === n);
  roster.push(fromDirectory || user);
}

/**
 * Users who may be assigned to tasks within a project.
 * Uses project assignees (teamMembers) and the project manager.
 * Optionally merges extra users (e.g. existing task assignees no longer on the team).
 */
export function usersForProjectTaskAssignment(project, directoryUsers = [], { extraUsers = [] } = {}) {
  if (!project) return [];

  const roster = [];
  const seen = new Set();

  const team = project.teamMembers || project.team || [];
  team.forEach((member) => addUser(roster, seen, member, directoryUsers));

  if (project.projectManager) {
    addUser(roster, seen, project.projectManager, directoryUsers);
  }

  const extras = Array.isArray(extraUsers) ? extraUsers : [];
  extras.forEach((user) => addUser(roster, seen, user, directoryUsers));

  return roster.sort((a, b) => userSortKey(a).localeCompare(userSortKey(b)));
}

/**
 * Collect assignee user objects from tasks (and nested subtasks when present).
 */
export function collectTaskAssigneeUsers(tasks) {
  const out = [];
  const seen = new Set();

  const visit = (task) => {
    if (!task) return;
    (task.assignees || []).forEach((u) => {
      const n = Number(u?.id);
      if (!Number.isFinite(n) || n <= 0 || seen.has(n)) return;
      seen.add(n);
      out.push(u);
    });
    const children = task.subtasks || task.children || [];
    if (Array.isArray(children)) children.forEach(visit);
  };

  (tasks || []).forEach(visit);
  return out;
}
