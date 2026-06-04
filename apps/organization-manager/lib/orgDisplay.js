export function orgStatusVariant(status) {
  const map = {
    trial: 'orange',
    active: 'active',
    suspended: 'danger',
    cancelled: 'cancelled',
  }
  return map[String(status || '').toLowerCase()] || 'default'
}

export function formatOrgStatus(status) {
  const s = String(status || 'unknown').toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatOrgIndustry(industry) {
  if (!industry) return '—'
  const s = String(industry).replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}
