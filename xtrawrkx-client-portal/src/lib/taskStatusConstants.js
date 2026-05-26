export const TASK_STATUS_OPTIONS = [
  { value: "ASSIGNED", label: "Assigned" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "REVISION_REQUIRED", label: "Revision Required" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "WAITING_FOR_CLIENT", label: "Waiting for Client" },
];

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
  SCHEDULED: "Assigned",
  IN_REVIEW: "Pending Review",
  CLIENT_REVIEW: "Waiting for Client",
  APPROVED: "Completed",
};

export const LABEL_TO_STRAPI = Object.fromEntries(
  TASK_STATUS_OPTIONS.map(({ value, label }) => [label, value]),
);

LABEL_TO_STRAPI["To Do"] = "ASSIGNED";
LABEL_TO_STRAPI["Internal Review"] = "PENDING_REVIEW";
LABEL_TO_STRAPI["Client Review"] = "WAITING_FOR_CLIENT";
LABEL_TO_STRAPI["Done"] = "COMPLETED";
LABEL_TO_STRAPI["Approved"] = "COMPLETED";

export const getStatusLabel = (strapiStatus) => {
  if (!strapiStatus) return "Assigned";
  const upper = String(strapiStatus).toUpperCase().replace(/\s+/g, "_");
  return STRAPI_TO_LABEL[upper] || strapiStatus;
};

export const getStrapiStatus = (label) => {
  if (!label) return "ASSIGNED";
  return LABEL_TO_STRAPI[label] || String(label).toUpperCase().replace(/\s+/g, "_");
};

export const CP_STATUS_SELECT_OPTIONS = TASK_STATUS_OPTIONS.map(({ value, label }) => ({
  value,
  label,
}));

const ASSIGNED_STRAPI = "ASSIGNED";

export const isAssignedStatus = (status) =>
  getStrapiStatus(status) === ASSIGNED_STRAPI;

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

export const getEditableStatusOptions = (
  currentStatus,
  options = CP_STATUS_SELECT_OPTIONS,
) => {
  if (canChangeToAssigned(currentStatus)) {
    return options;
  }
  return options.filter(
    (opt) => getStrapiStatus(opt.value ?? opt.label) !== ASSIGNED_STRAPI,
  );
};
