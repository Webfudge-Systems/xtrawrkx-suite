export const EMPTY_SECURITY_FORM = {
  requireMfa: false,
  sessionTimeoutMinutes: 480,
  passwordMinLength: 8,
  allowPasswordLogin: true,
  allowedEmailDomains: '',
}

export const SESSION_TIMEOUT_OPTIONS = [
  { value: '60', label: '1 hour' },
  { value: '240', label: '4 hours' },
  { value: '480', label: '8 hours' },
  { value: '1440', label: '24 hours' },
  { value: '10080', label: '7 days' },
]

export function securitySettingsToForm(settings = {}) {
  return {
    requireMfa: !!settings.requireMfa,
    sessionTimeoutMinutes: Number(settings.sessionTimeoutMinutes) || 480,
    passwordMinLength: Number(settings.passwordMinLength) || 8,
    allowPasswordLogin: settings.allowPasswordLogin !== false,
    allowedEmailDomains: Array.isArray(settings.allowedEmailDomains)
      ? settings.allowedEmailDomains.join(', ')
      : '',
  }
}

function normalizeDomainsInput(value) {
  return String(value || '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(',')
}

export function securityFormsEqual(a, b) {
  if (!a || !b) return false
  return (
    !!a.requireMfa === !!b.requireMfa &&
    !!a.allowPasswordLogin === !!b.allowPasswordLogin &&
    Number(a.sessionTimeoutMinutes) === Number(b.sessionTimeoutMinutes) &&
    Number(a.passwordMinLength) === Number(b.passwordMinLength) &&
    normalizeDomainsInput(a.allowedEmailDomains) === normalizeDomainsInput(b.allowedEmailDomains)
  )
}

export function buildSecuritySettingsPayload(form) {
  const domains = String(form.allowedEmailDomains || '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
  return {
    requireMfa: !!form.requireMfa,
    sessionTimeoutMinutes: Number(form.sessionTimeoutMinutes) || 480,
    passwordMinLength: Math.min(128, Math.max(6, Number(form.passwordMinLength) || 8)),
    allowPasswordLogin: form.allowPasswordLogin !== false,
    allowedEmailDomains: domains,
  }
}
