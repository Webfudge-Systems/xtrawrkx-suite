/** Mirrors apps/backend/src/constants/rbac-app-matrix.js for UI labels. */

export const ACCESS_OPTIONS = [
  { value: 'none', label: 'No access' },
  { value: 'read', label: 'Read' },
  { value: 'write', label: 'Write' },
  { value: 'manage', label: 'Manage (full)' },
]

export const CRM_MODULES = {
  dashboard: 'Dashboard',
  leads: 'Leads',
  companies: 'Lead companies',
  contacts: 'Contacts',
  deals: 'Deals & pipeline',
  client_accounts: 'Client accounts',
  client_projects: 'Client projects',
  client_invoices: 'Invoices',
  proposals: 'Proposals',
  meetings: 'Meetings',
  calendar: 'Calendar',
  analytics: 'Analytics',
  settings: 'Settings',
}

export const PM_MODULES = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  tasks: 'Tasks',
  my_tasks: 'My tasks',
  inbox: 'Inbox & messages',
  calendar: 'Calendar',
  analytics: 'Analytics',
  settings: 'Settings',
}

export function emptyPermissionsDraft() {
  const crm = { modules: {} }
  Object.keys(CRM_MODULES).forEach((k) => {
    crm.modules[k] = { access: 'read' }
  })
  const pm = { modules: {} }
  Object.keys(PM_MODULES).forEach((k) => {
    pm.modules[k] = { access: 'read' }
  })
  return { crm, pm }
}
