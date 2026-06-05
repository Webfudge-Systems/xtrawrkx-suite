/** Sortable column metadata per PM table context. */

export const TASK_SORT_COLUMNS = [
  { key: 'name', label: 'Task name' },
  { key: 'project', label: 'Project' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'assigner', label: 'Reporter' },
  { key: 'assignees', label: 'Assignees' },
  { key: 'startDate', label: 'Start date' },
  { key: 'dueDate', label: 'Due date' },
  { key: 'tags', label: 'Tags' },
  { key: 'description', label: 'Description' },
  { key: 'createdAt', label: 'Created' },
  { key: 'updatedAt', label: 'Last updated' },
  { key: 'recurrence', label: 'Repeat' },
];

export const PROJECT_SORT_COLUMNS = [
  { key: 'name', label: 'Project name' },
  { key: 'status', label: 'Status' },
  { key: 'progress', label: 'Progress' },
  { key: 'projectManager', label: 'Owner' },
  { key: 'endDate', label: 'Due date' },
  { key: 'startDate', label: 'Start date' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'client', label: 'Client' },
  { key: 'budget', label: 'Budget' },
  { key: 'description', label: 'Description' },
  { key: 'createdAt', label: 'Created' },
  { key: 'updatedAt', label: 'Last updated' },
];

export const CLIENT_ACCOUNT_SORT_COLUMNS = [
  { key: 'company', label: 'Company' },
  { key: 'primaryContact', label: 'Primary contact' },
  { key: 'healthScore', label: 'Health score' },
  { key: 'dealValue', label: 'Deal value' },
  { key: 'contactsCount', label: 'Contacts' },
  { key: 'location', label: 'Location' },
  { key: 'industry', label: 'Industry' },
  { key: 'assignedTo', label: 'Account manager' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
  { key: 'updatedAt', label: 'Updated' },
  { key: 'accountType', label: 'Account type' },
  { key: 'billingCycle', label: 'Billing cycle' },
  { key: 'website', label: 'Website' },
];

export const CONTACT_SORT_COLUMNS = [
  { key: 'contact', label: 'Contact' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
];

export const DEAL_SORT_COLUMNS = [
  { key: 'deal', label: 'Deal' },
  { key: 'value', label: 'Value' },
  { key: 'stage', label: 'Stage' },
  { key: 'priority', label: 'Priority' },
  { key: 'owner', label: 'Owner' },
  { key: 'expectedCloseDate', label: 'Close date' },
];

export const INVOICE_SORT_COLUMNS = [
  { key: 'invoice', label: 'Invoice' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'invoiceDate', label: 'Date' },
  { key: 'dueDate', label: 'Due' },
  { key: 'deal', label: 'Deal' },
];

export const ACCOUNT_PROJECT_SORT_COLUMNS = [
  { key: 'project', label: 'Project' },
  { key: 'status', label: 'Status' },
  { key: 'manager', label: 'Manager' },
  { key: 'budget', label: 'Budget' },
  { key: 'dates', label: 'Timeline' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'sourceDeal', label: 'Source deal' },
];

export const SORT_COLUMNS_BY_ENTITY = {
  task: TASK_SORT_COLUMNS,
  project: PROJECT_SORT_COLUMNS,
  clientAccount: CLIENT_ACCOUNT_SORT_COLUMNS,
  contact: CONTACT_SORT_COLUMNS,
  deal: DEAL_SORT_COLUMNS,
  invoice: INVOICE_SORT_COLUMNS,
  accountProject: ACCOUNT_PROJECT_SORT_COLUMNS,
};

export function sortableKeysForEntity(entity) {
  return (SORT_COLUMNS_BY_ENTITY[entity] || []).map((c) => c.key);
}
