/** Sortable column metadata per CRM table context. */

export const LEAD_COMPANY_SORT_COLUMNS = [
  { key: 'companyName', label: 'Company name' },
  { key: 'status',      label: 'Status' },
  { key: 'source',      label: 'Source' },
  { key: 'dealValue',   label: 'Deal value' },
  { key: 'contactsCount', label: 'Contacts' },
  { key: 'assignedTo',  label: 'Assigned to' },
  { key: 'type',        label: 'Type' },
  { key: 'industry',    label: 'Industry' },
  { key: 'score',       label: 'Score' },
  { key: 'healthScore', label: 'Health score' },
  { key: 'city',        label: 'City' },
  { key: 'country',     label: 'Country' },
  { key: 'createdAt',   label: 'Created' },
  { key: 'updatedAt',   label: 'Last updated' },
];

export const CONTACT_SORT_COLUMNS = [
  { key: 'name',        label: 'Name' },
  { key: 'email',       label: 'Email' },
  { key: 'phone',       label: 'Phone' },
  { key: 'jobTitle',    label: 'Job title' },
  { key: 'company',     label: 'Company' },
  { key: 'source',      label: 'Source' },
  { key: 'assignedTo',  label: 'Assigned to' },
  { key: 'city',        label: 'City' },
  { key: 'country',     label: 'Country' },
  { key: 'createdAt',   label: 'Created' },
  { key: 'updatedAt',   label: 'Last updated' },
];

export const DEAL_SORT_COLUMNS = [
  { key: 'deal',              label: 'Deal name' },
  { key: 'value',             label: 'Value' },
  { key: 'stage',             label: 'Stage' },
  { key: 'priority',          label: 'Priority' },
  { key: 'probability',       label: 'Probability' },
  { key: 'company',           label: 'Company' },
  { key: 'owner',             label: 'Owner' },
  { key: 'expectedCloseDate', label: 'Close date' },
  { key: 'createdAt',         label: 'Created' },
  { key: 'updatedAt',         label: 'Last updated' },
];

export const SORT_COLUMNS_BY_ENTITY = {
  leadCompany: LEAD_COMPANY_SORT_COLUMNS,
  contact:     CONTACT_SORT_COLUMNS,
  deal:        DEAL_SORT_COLUMNS,
};

export function sortableKeysForEntity(entity) {
  return (SORT_COLUMNS_BY_ENTITY[entity] || []).map((c) => c.key);
}
