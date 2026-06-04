export const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'services', label: 'Services' },
  { value: 'other', label: 'Other' },
]

export const COMPANY_SIZE_OPTIONS = [
  { value: 'size_1_10', label: '1–10 employees' },
  { value: 'size_11_50', label: '11–50 employees' },
  { value: 'size_51_200', label: '51–200 employees' },
  { value: 'size_201_500', label: '201–500 employees' },
  { value: 'size_500_plus', label: '500+ employees' },
]

export const EMPTY_ORGANIZATION_FORM = {
  name: '',
  companyEmail: '',
  companyPhone: '',
  website: '',
  industry: '',
  size: '',
}

/** Map API organization row to form state (enum null → ''). */
export function organizationToForm(org) {
  if (!org) return { ...EMPTY_ORGANIZATION_FORM }
  return {
    name: org.name || '',
    companyEmail: org.companyEmail || '',
    companyPhone: org.companyPhone || '',
    website: org.website || '',
    industry: org.industry || '',
    size: org.size || '',
  }
}

const OPTIONAL_NULL_FIELDS = ['companyEmail', 'companyPhone', 'website', 'industry', 'size']

/** Strapi rejects blank strings on email/enumeration fields — send null instead. */
export function buildOrganizationSettingsPayload(form) {
  const data = {}
  const name = String(form?.name ?? '').trim()
  if (name) data.name = name

  OPTIONAL_NULL_FIELDS.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(form || {}, key)) return
    const raw = form[key]
    if (raw == null || (typeof raw === 'string' && raw.trim() === '')) {
      data[key] = null
    } else {
      data[key] = typeof raw === 'string' ? raw.trim() : raw
    }
  })

  return data
}

export function validateOrganizationForm(form) {
  const errors = {}
  const name = String(form?.name ?? '').trim()
  if (!name) errors.name = 'Organization name is required'

  const email = String(form?.companyEmail ?? '').trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.companyEmail = 'Enter a valid company email'
  }

  const website = String(form?.website ?? '').trim()
  if (website && !/^https?:\/\//i.test(website) && !/^[a-z0-9.-]+\.[a-z]{2,}/i.test(website)) {
    errors.website = 'Enter a valid website URL (e.g. https://example.com)'
  }

  return errors
}

export function formsEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}
