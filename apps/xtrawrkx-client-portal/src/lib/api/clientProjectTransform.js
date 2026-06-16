/** Shared project row shaping for client portal list + detail. */

function flattenUser(u) {
  if (!u) return null;
  const attrs = u.attributes || u;
  const id = u.id ?? attrs.id ?? u.documentId ?? attrs.documentId;
  if (id == null) return null;
  const firstName = attrs.firstName || "";
  const lastName = attrs.lastName || "";
  const name =
    `${firstName} ${lastName}`.trim() ||
    attrs.name ||
    attrs.username ||
    attrs.email ||
    "Unknown";
  const avatarRaw = attrs.avatar?.data?.attributes || attrs.avatar;
  return {
    id,
    name,
    firstName,
    lastName,
    email: attrs.email || "",
    username: attrs.username || "",
    avatar: avatarRaw?.url || attrs.avatar?.url || null,
    initials:
      name
        .split(/\s+/)
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?",
    role: attrs.role || attrs.jobTitle || null,
  };
}

function flattenTask(t) {
  if (!t) return null;
  const attrs = t.attributes || t;
  const id = t.id ?? attrs.id ?? t.documentId;
  const assignee = flattenUser(attrs.assignee?.data || attrs.assignee);
  return {
    id,
    name: attrs.name || attrs.title || "Untitled Task",
    description: attrs.description || "",
    strapiStatus: (attrs.status || "ASSIGNED").toUpperCase(),
    priority: (attrs.priority || "medium").toLowerCase(),
    scheduledDate: attrs.scheduledDate || attrs.dueDate || null,
    isSharedWithClient: !!attrs.isSharedWithClient,
    clientActionRequired: !!attrs.clientActionRequired,
    assignee,
    assigneeName: assignee?.name || null,
    createdAt: attrs.createdAt || null,
    updatedAt: attrs.updatedAt || null,
  };
}

export function transformClientProject(row) {
  if (!row) return null;
  const p = row.attributes || row;
  const id = row.id ?? row.documentId ?? p.id ?? p.documentId;

  const pm = flattenUser(p.projectManager?.data || p.projectManager);
  const teamMembers = (p.teamMembers?.data || p.teamMembers || [])
    .map(flattenUser)
    .filter(Boolean);
  const rawTasks = (p.tasks?.data || p.tasks || []).map(flattenTask).filter(Boolean);
  const sharedTasks = rawTasks.filter((t) => t.isSharedWithClient);
  const totalTasks = rawTasks.length;
  const completedTasks = rawTasks.filter((t) => t.strapiStatus === "COMPLETED").length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const clientAccount = p.clientAccount?.data || p.clientAccount;
  const ca = clientAccount?.attributes || clientAccount || {};

  return {
    id,
    documentId: row.documentId ?? p.documentId ?? id,
    slug: p.slug || String(id),
    name: p.name || "Untitled Project",
    description: p.description || "",
    strapiStatus: (p.status || "PLANNING").toUpperCase(),
    status: (p.status || "PLANNING").toUpperCase(),
    startDate: p.startDate || null,
    endDate: p.endDate || null,
    budget: p.budget ?? p.budgetAmount ?? null,
    spent: p.spent ?? p.totalSpend ?? null,
    progress,
    totalTasks,
    completedTasks,
    sharedTaskCount: sharedTasks.length,
    projectManager: pm,
    managerName: pm?.name || "Unassigned",
    teamMembers,
    team: teamMembers,
    clientName: ca.companyName || ca.name || ca.title || "",
    clientAccountId: clientAccount?.id ?? ca.id ?? null,
    isPrivate: !!p.isPrivate,
    icon: p.icon || (p.name ? p.name.charAt(0).toUpperCase() : "P"),
    createdAt: p.createdAt || null,
    updatedAt: p.updatedAt || null,
    tasks: rawTasks,
    sharedTasks,
  };
}
