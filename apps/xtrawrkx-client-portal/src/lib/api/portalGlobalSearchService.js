import { COMMUNITIES_LIST } from "@/data/communitiesCatalog";
import { resolveClientAccountId } from "@/lib/clientAccountId";
import { listProjectsForClient } from "./clientProjectService";
import { listTasksForClient } from "./clientTaskService";
import { listCompanyMembers } from "./companyMembersService";

function matchesQuery(value, query) {
  return String(value || "")
    .toLowerCase()
    .includes(String(query || "").toLowerCase());
}

function normalizeTask(row) {
  const taskData = row?.attributes || row || {};
  const projectsArray = taskData.projects?.data || taskData.projects || [];
  const singleProject =
    taskData.project?.data?.attributes ||
    taskData.project?.data ||
    taskData.project?.attributes ||
    taskData.project;

  let project = null;
  if (Array.isArray(projectsArray) && projectsArray.length > 0) {
    const firstProject = projectsArray[0];
    project = firstProject.attributes || firstProject;
  } else if (singleProject) {
    project = singleProject;
  }

  return {
    id: row.id || row.documentId || taskData.id || taskData.documentId,
    name: taskData.name || taskData.title || "Untitled Task",
    description: taskData.description || "",
    strapiStatus: String(taskData.status || "ASSIGNED").toUpperCase(),
    projectName: project?.name || null,
    href: `/tasks/${row.id || row.documentId || taskData.id || taskData.documentId}`,
  };
}

function normalizeProject(project) {
  return {
    id: project.id || project.documentId,
    name: project.name || "Untitled Project",
    description: project.description || "",
    strapiStatus: String(project.strapiStatus || project.status || "PLANNING").toUpperCase(),
    href: `/projects/${project.slug || project.id || project.documentId}`,
  };
}

function normalizeCommunity(community) {
  return {
    id: community.id,
    name: community.name || community.fullName || "Community",
    description: community.description || community.fullName || "",
    href: `/communities/${community.id}`,
  };
}

function normalizeMember(member) {
  return {
    id: member.id,
    name: member.name || member.email?.split("@")[0] || "Member",
    email: member.email || null,
    role: member.role || null,
    href: `/company?details=${member.id}`,
  };
}

/**
 * Client-portal global search across tasks, projects, communities, and company members.
 */
export async function searchPortal(query, { maxResults = 5, session } = {}) {
  const trimmed = String(query || "").trim();
  if (!trimmed) {
    return { tasks: [], projects: [], communities: [], members: [] };
  }

  const accountId = await resolveClientAccountId(session);

  const [projectResult, taskResult, memberResult] = await Promise.allSettled([
    accountId ? listProjectsForClient(accountId) : Promise.resolve([]),
    accountId ? listTasksForClient(accountId) : Promise.resolve([]),
    listCompanyMembers(),
  ]);

  const projectRows =
    projectResult.status === "fulfilled" ? projectResult.value || [] : [];
  const taskRows = taskResult.status === "fulfilled" ? taskResult.value || [] : [];
  const memberRows =
    memberResult.status === "fulfilled"
      ? memberResult.value?.data || memberResult.value || []
      : [];

  const tasks = taskRows
    .map(normalizeTask)
    .filter(
      (task) =>
        task.id &&
        (matchesQuery(task.name, trimmed) ||
          matchesQuery(task.description, trimmed) ||
          matchesQuery(task.projectName, trimmed))
    )
    .slice(0, maxResults);

  const projects = projectRows
    .map(normalizeProject)
    .filter(
      (project) =>
        project.id &&
        (matchesQuery(project.name, trimmed) || matchesQuery(project.description, trimmed))
    )
    .slice(0, maxResults);

  const communities = COMMUNITIES_LIST.map(normalizeCommunity)
    .filter(
      (community) =>
        community.id &&
        (matchesQuery(community.name, trimmed) || matchesQuery(community.description, trimmed))
    )
    .slice(0, maxResults);

  const members = memberRows
    .map(normalizeMember)
    .filter(
      (member) =>
        member.id &&
        (matchesQuery(member.name, trimmed) ||
          matchesQuery(member.email, trimmed) ||
          matchesQuery(member.role, trimmed))
    )
    .slice(0, maxResults);

  return { tasks, projects, communities, members };
}
