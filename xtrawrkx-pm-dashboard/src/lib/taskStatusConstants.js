/**
 * Task status definitions — single source for PM dashboard.
 * Strapi enum values map to user-facing labels.
 */

export const TASK_STATUS_OPTIONS = [
  { value: "ASSIGNED", label: "Assigned", description: "Task created and assigned to a member" },
  { value: "ACCEPTED", label: "Accepted", description: "Member acknowledged the task" },
  { value: "IN_PROGRESS", label: "In Progress", description: "Work has started" },
  { value: "ON_HOLD", label: "On Hold", description: "Waiting due to dependency, client response, issue, etc." },
  { value: "PENDING_REVIEW", label: "Pending Review", description: "Member completed work and submitted for manager review" },
  { value: "REVISION_REQUIRED", label: "Revision Required", description: "Manager requested changes" },
  { value: "COMPLETED", label: "Completed", description: "Work approved and finished" },
  { value: "CANCELLED", label: "Cancelled", description: "Task no longer needed" },
  { value: "WAITING_FOR_CLIENT", label: "Waiting for Client", description: "Awaiting external approval/input" },
];

/** Legacy Strapi statuses kept for backward compatibility */
export const LEGACY_STATUS_MAP = {
  SCHEDULED: "ASSIGNED",
  IN_REVIEW: "PENDING_REVIEW",
  CLIENT_REVIEW: "WAITING_FOR_CLIENT",
  APPROVED: "COMPLETED",
};

export const STRAPI_TO_LABEL = {
  ASSIGNED: "Assigned",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  PENDING_REVIEW: "Pending Review",
  REVISION_REQUIRED: "Revision Required",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  WAITING_FOR_CLIENT: "Waiting for Client",
  // Legacy
  SCHEDULED: "Assigned",
  IN_REVIEW: "Pending Review",
  CLIENT_REVIEW: "Waiting for Client",
  APPROVED: "Completed",
  TODO: "Assigned",
  DONE: "Completed",
};

export const LABEL_TO_STRAPI = {
  Assigned: "ASSIGNED",
  Accepted: "ACCEPTED",
  "In Progress": "IN_PROGRESS",
  "On Hold": "ON_HOLD",
  "Pending Review": "PENDING_REVIEW",
  "Revision Required": "REVISION_REQUIRED",
  Completed: "COMPLETED",
  Cancelled: "CANCELLED",
  "Waiting for Client": "WAITING_FOR_CLIENT",
  // Legacy labels
  "To Do": "ASSIGNED",
  "Internal Review": "PENDING_REVIEW",
  "Client Review": "WAITING_FOR_CLIENT",
  Approved: "COMPLETED",
  Done: "COMPLETED",
};

export const getStatusLabel = (strapiStatus) => {
  if (!strapiStatus) return "Assigned";
  const upper = String(strapiStatus).toUpperCase().replace(/\s+/g, "_");
  if (STRAPI_TO_LABEL[upper]) return STRAPI_TO_LABEL[upper];
  if (STRAPI_TO_LABEL[strapiStatus]) return STRAPI_TO_LABEL[strapiStatus];
  return strapiStatus;
};

export const getStrapiStatus = (labelOrValue) => {
  if (!labelOrValue) return "ASSIGNED";
  const upper = String(labelOrValue).toUpperCase().replace(/\s+/g, "_");
  if (STRAPI_TO_LABEL[upper]) return upper;
  if (LABEL_TO_STRAPI[labelOrValue]) return LABEL_TO_STRAPI[labelOrValue];
  const lower = String(labelOrValue).toLowerCase();
  const lowerMap = Object.fromEntries(
    Object.entries(LABEL_TO_STRAPI).map(([k, v]) => [k.toLowerCase(), v]),
  );
  if (lowerMap[lower]) return lowerMap[lower];
  return upper;
};

/** PM select options: { value, label } */
export const PM_STATUS_SELECT_OPTIONS = TASK_STATUS_OPTIONS.map(({ value, label }) => ({
  value,
  label,
}));

const ASSIGNED_STRAPI = "ASSIGNED";

/** True if status is Assigned (includes legacy SCHEDULED / To Do). */
export const isAssignedStatus = (status) =>
  getStrapiStatus(status) === ASSIGNED_STRAPI;

/**
 * Assigned may only be selected while the task is already Assigned.
 * Once moved to any other status, reverting to Assigned is blocked.
 */
export const canChangeToAssigned = (currentStatus) =>
  isAssignedStatus(currentStatus);

export const STATUS_REVERT_TO_ASSIGNED_MESSAGE =
  "Status cannot be changed back to Assigned after the task has moved forward.";

export const assertStatusChangeAllowed = (currentStatus, newStatus) => {
  if (
    !canChangeToAssigned(currentStatus) &&
    isAssignedStatus(newStatus)
  ) {
    return { ok: false, message: STATUS_REVERT_TO_ASSIGNED_MESSAGE };
  }
  return { ok: true };
};

/** Filter select options — pass options with `value` as Strapi enum or display label. */
export const getEditableStatusOptions = (
  currentStatus,
  options = PM_STATUS_SELECT_OPTIONS,
) => {
  if (canChangeToAssigned(currentStatus)) {
    return options;
  }
  return options.filter(
    (opt) => getStrapiStatus(opt.value ?? opt.label) !== ASSIGNED_STRAPI,
  );
};

/** Options for dropdowns that use display labels as values (list table, edit form). */
export const getEditableStatusOptionsByLabel = (currentStatus) =>
  getEditableStatusOptions(
    currentStatus,
    PM_STATUS_SELECT_OPTIONS.map(({ label }) => ({
      value: label,
      label,
    })),
  );
