/**
 * Build display timeline rows from organization payload (fallback when no audit rows exist).
 */

const FIELD_LABELS = {
  name: 'Name',
  status: 'Status',
  billingCycle: 'Billing cycle',
  companyEmail: 'Company email',
  slug: 'Workspace slug',
}

function labelForField(key) {
  return FIELD_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim()
}

function formatValue(val) {
  if (val == null || val === '') return '(empty)'
  return String(val)
}

function makeChange(key, from, to) {
  return {
    key,
    label: labelForField(key),
    before: formatValue(from),
    after: formatValue(to),
  }
}

export function buildOrgActivityItems(org) {
  if (!org) return []

  const items = []

  if (org.createdAt) {
    items.push({
      id: `created-${org.id}`,
      action: 'create',
      createdAt: org.createdAt,
      summary: `Organization "${org.name || 'Untitled'}" was created`,
      meta: {
        changes: org.status ? [makeChange('status', null, org.status)] : [],
      },
    })
  }

  if (
    org.updatedAt &&
    org.createdAt &&
    new Date(org.updatedAt).getTime() > new Date(org.createdAt).getTime() + 60_000
  ) {
    items.push({
      id: `updated-${org.id}`,
      action: 'update',
      createdAt: org.updatedAt,
      summary: 'Organization profile was updated',
    })
  }

  const subs = Array.isArray(org.subscriptions) ? org.subscriptions : []
  subs.forEach((sub) => {
    const appName = sub.app?.name || sub.app?.slug || 'App'
    const at = sub.createdAt || sub.updatedAt
    if (!at) return
    items.push({
      id: `sub-${sub.id}`,
      action: 'create',
      createdAt: at,
      summary: `Subscription added for ${appName}`,
      meta: {
        changes: [
          makeChange('status', null, sub.status || 'trial'),
          makeChange('billingCycle', null, sub.billingCycle || '—'),
        ],
      },
    })
  })

  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}
