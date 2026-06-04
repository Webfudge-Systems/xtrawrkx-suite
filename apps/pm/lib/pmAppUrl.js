/**
 * PM app base URL for in-app links. Defaults to same-origin relative paths.
 * Set NEXT_PUBLIC_PM_APP_URL only when an absolute base is required (e.g. emails).
 */
export function getPmAppBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_PM_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return '';
}

export function pmProjectDetailUrl(slugOrId) {
  const base = getPmAppBaseUrl();
  if (slugOrId == null || slugOrId === '') return base || '/';
  return `${base}/projects/${encodeURIComponent(String(slugOrId))}`;
}

export function pmAddProjectUrl(clientAccountId) {
  const base = `${getPmAppBaseUrl()}/projects/add`;
  if (clientAccountId == null || clientAccountId === '') return base;
  return `${base}?clientAccount=${encodeURIComponent(String(clientAccountId))}`;
}
