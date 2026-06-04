/**
 * PM app base URL for cross-app links from CRM (projects, calendar).
 * Set NEXT_PUBLIC_PM_APP_URL in apps/crm/.env.local (e.g. http://localhost:3006).
 */
export function getPmAppBaseUrl() {
  return (process.env.NEXT_PUBLIC_PM_APP_URL || 'http://localhost:3006').replace(/\/$/, '');
}

export function pmProjectDetailUrl(slugOrId) {
  if (slugOrId == null || slugOrId === '') return getPmAppBaseUrl();
  return `${getPmAppBaseUrl()}/projects/${encodeURIComponent(String(slugOrId))}`;
}

export function pmAddProjectUrl(clientAccountId) {
  const base = `${getPmAppBaseUrl()}/projects/add`;
  if (clientAccountId == null || clientAccountId === '') return base;
  return `${base}?clientAccount=${encodeURIComponent(String(clientAccountId))}`;
}
