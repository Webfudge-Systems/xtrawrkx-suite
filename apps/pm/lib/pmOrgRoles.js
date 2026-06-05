import { authService } from '@webfudge/auth'

/**
 * Organization-role kind for PM row-level rules (from active org membership).
 * Admin / Manager / Member templates use codes admin / manager / member.
 */
export function getPmOrgRoleKind() {
  const r = authService.getCurrentOrgRole()
  const code = String(r.code || '').trim().toLowerCase()
  const name = String(r.name || '').trim().toLowerCase()
  if (code === 'admin' || code.endsWith('-admin') || name === 'admin') return 'admin'
  if (code === 'manager' || name === 'manager') return 'manager'
  return 'member'
}

export function canCreateProjectsInPm() {
  return getPmOrgRoleKind() !== 'member'
}

/**
 * Admin: always. Manager: only when assigned as project manager. Member: never.
 */
export function canEditProjectInPm(project, userId) {
  if (!project || userId == null) return false
  const kind = getPmOrgRoleKind()
  if (kind === 'admin') return true
  if (kind === 'member') return false
  if (kind === 'manager') {
    const pm = project.projectManager
    const pmId = typeof pm === 'object' && pm ? pm.id : pm
    return pmId != null && Number(pmId) === Number(userId)
  }
  return false
}

/**
 * Only admins can set the isPrivate flag (and toggle it in the UI).
 */
export function canToggleProjectPrivacy() {
  return getPmOrgRoleKind() === 'admin'
}

/** User is project manager or listed in project assignees (team). */
export function isProjectTeamMember(project, userId) {
  if (!project || userId == null) return false
  const pm = project.projectManager
  const pmId = typeof pm === 'object' && pm ? pm.id : pm
  if (pmId != null && Number(pmId) === Number(userId)) return true
  const team = project.teamMembers || project.team || []
  return team.some((m) => m?.id != null && Number(m.id) === Number(userId))
}

/**
 * Create tasks on a project: org admin/manager always; org members only if on the project team.
 */
export function canCreateTaskInProject(project, userId) {
  if (!project || userId == null) return false
  const kind = getPmOrgRoleKind()
  if (kind === 'admin' || kind === 'manager') return true
  return isProjectTeamMember(project, userId)
}

/** Org admin or manager may approve member-requested task assignments. */
export function canApproveTaskAssignmentsInPm() {
  const kind = getPmOrgRoleKind()
  return kind === 'admin' || kind === 'manager'
}

/** User is primary assignee or listed collaborator on a task row. */
export function isTaskAssigneeOrCollaborator(task, userId) {
  if (!task || userId == null) return false
  const ids = new Set()
  if (task.assigneeId != null) ids.add(Number(task.assigneeId))
  if (Array.isArray(task.assigneeUserIds)) {
    task.assigneeUserIds.forEach((id) => ids.add(Number(id)))
  }
  ;(task.assignees || []).forEach((u) => {
    if (u?.id != null) ids.add(Number(u.id))
  })
  return [...ids].some((id) => Number.isFinite(id) && id === Number(userId))
}

/** User created the task (Reporter / Strapi `assigner`). */
export function isTaskReporter(task, userId) {
  if (!task || userId == null) return false
  if (task.assignerId != null && Number(task.assignerId) === Number(userId)) return true
  const assigner = task.assigner
  if (assigner?.id != null && Number(assigner.id) === Number(userId)) return true
  return false
}

/**
 * Edit a task: admin/manager always; org members when assignee, collaborator, or reporter.
 */
export function canEditTaskInPm(task, userId) {
  if (!task || userId == null) return false
  const kind = getPmOrgRoleKind()
  if (kind === 'admin' || kind === 'manager') return true
  return isTaskAssigneeOrCollaborator(task, userId) || isTaskReporter(task, userId)
}

/**
 * Delete a task: admin/manager always; org members only for tasks they created (reporter).
 */
export function canDeleteTaskInPm(task, userId) {
  if (!task || userId == null) return false
  const kind = getPmOrgRoleKind()
  if (kind === 'admin' || kind === 'manager') return true
  return isTaskReporter(task, userId)
}

/**
 * Subtasks: admin/manager always; org members when assigned to the parent task.
 */
export function canCreateSubtaskOnTask(task, userId) {
  if (!task || userId == null) return false
  const kind = getPmOrgRoleKind()
  if (kind === 'admin' || kind === 'manager') return true
  return isTaskAssigneeOrCollaborator(task, userId)
}
