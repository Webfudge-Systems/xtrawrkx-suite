'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Globe,
  Lock,
  Mail,
  Phone,
  Save,
  Settings,
} from 'lucide-react'
import { Button, Card, Input, LoadingSpinner, Select } from '@webfudge/ui'
import AccountsPageHeader from '../../components/AccountsPageHeader'
import { organizationService } from '../../lib/api'
import {
  COMPANY_SIZE_OPTIONS,
  EMPTY_ORGANIZATION_FORM,
  formsEqual,
  INDUSTRY_OPTIONS,
  organizationToForm,
  validateOrganizationForm,
} from '../../lib/organizationSettings'

function StatusBanner({ variant, children }) {
  const styles =
    variant === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : variant === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-red-200 bg-red-50 text-red-800'

  const Icon = variant === 'success' ? CheckCircle2 : AlertCircle

  return (
    <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${styles}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [canEdit, setCanEdit] = useState(false)
  const [currentRole, setCurrentRole] = useState('')
  const [form, setForm] = useState({ ...EMPTY_ORGANIZATION_FORM })
  const [savedForm, setSavedForm] = useState({ ...EMPTY_ORGANIZATION_FORM })

  const isDirty = useMemo(() => !formsEqual(form, savedForm), [form, savedForm])

  const loadOrganization = useCallback(async () => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const response = await organizationService.getCurrent()
      const org = response?.data ?? response
      if (!org) {
        setError('Organization not found for this workspace.')
        return
      }
      const nextForm = organizationToForm(org)
      setForm(nextForm)
      setSavedForm(nextForm)
      setCanEdit(Boolean(org.canEditOrganizationSettings))
      setCurrentRole(org.currentRole || org.currentRoleCode || '')
    } catch (e) {
      setError(e?.message || 'Unable to load organization settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrganization()
  }, [loadOrganization])

  const setField = (key, value) => {
    setMessage('')
    setError('')
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    const validation = validateOrganizationForm(form)
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation)
      setError('Fix the highlighted fields before saving.')
      return
    }

    try {
      setSaving(true)
      setMessage('')
      setError('')
      setFieldErrors({})
      const response = await organizationService.updateSettings(form)
      const updated = response?.data ?? response
      const nextForm = organizationToForm(updated?.id ? updated : form)
      setForm(nextForm)
      setSavedForm(nextForm)
      setMessage('Organization settings saved successfully.')
    } catch (e) {
      setError(e?.message || 'Unable to save organization settings')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setForm(savedForm)
    setFieldErrors({})
    setError('')
    setMessage('')
  }

  return (
    <div className="min-h-full space-y-4 bg-white p-4">
      <AccountsPageHeader
        title="Organization Settings"
        subtitle="Workspace profile and app-level administration settings."
        breadcrumb={[{ label: 'Organization', href: '/settings' }]}
      />

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-gray-100 bg-gray-50/80 py-16">
          <LoadingSpinner size="lg" message="Loading organization..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {!canEdit ? (
              <StatusBanner variant="warning">
                <p className="font-medium">View-only access</p>
                <p className="mt-1 text-amber-800/90">
                  Your role ({currentRole || 'Member'}) cannot change workspace settings. Contact an organization Admin
                  or the workspace owner to update this profile.
                </p>
              </StatusBanner>
            ) : null}

            {error ? <StatusBanner variant="error">{error}</StatusBanner> : null}
            {message ? <StatusBanner variant="success">{message}</StatusBanner> : null}

            <Card
              glass
              title="Workspace profile"
              subtitle="These fields are shared across Accounts, PM, and CRM."
              actions={<Building2 className="h-5 w-5 text-gray-500" />}
            >
              <fieldset
                disabled={!canEdit || saving}
                className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 disabled:opacity-90 md:p-5"
              >
                <Input
                  label="Organization name"
                  required
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  error={fieldErrors.name}
                  placeholder="Your company or team name"
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Input
                    label="Company email"
                    type="email"
                    icon={Mail}
                    value={form.companyEmail}
                    onChange={(e) => setField('companyEmail', e.target.value)}
                    error={fieldErrors.companyEmail}
                    placeholder="hello@company.com"
                  />
                  <Input
                    label="Company phone"
                    type="tel"
                    icon={Phone}
                    value={form.companyPhone}
                    onChange={(e) => setField('companyPhone', e.target.value)}
                    error={fieldErrors.companyPhone}
                    placeholder="+1 555 000 0000"
                  />
                </div>

                <Input
                  label="Website"
                  type="url"
                  icon={Globe}
                  value={form.website}
                  onChange={(e) => setField('website', e.target.value)}
                  error={fieldErrors.website}
                  placeholder="https://company.com"
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Select
                    label="Industry"
                    value={form.industry}
                    onChange={(v) => setField('industry', v)}
                    placeholder="Select industry"
                    options={INDUSTRY_OPTIONS}
                    error={fieldErrors.industry}
                  />
                  <Select
                    label="Company size"
                    value={form.size}
                    onChange={(v) => setField('size', v)}
                    placeholder="Select size"
                    options={COMPANY_SIZE_OPTIONS}
                    error={fieldErrors.size}
                  />
                </div>
              </fieldset>
            </Card>

            {canEdit ? (
              <Card
                glass
                title="Save changes"
                subtitle={isDirty ? 'You have unsaved workspace profile changes.' : 'All changes are saved.'}
                actions={<Save className="h-5 w-5 text-gray-500" />}
              >
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <Button variant="secondary" onClick={resetForm} disabled={!isDirty || saving}>
                    Discard
                  </Button>
                  <Button variant="primary" onClick={save} disabled={saving || !isDirty}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving…' : 'Save settings'}
                  </Button>
                </div>
              </Card>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="h-fit rounded-2xl border border-orange-100 bg-gradient-to-b from-orange-50/90 to-white p-5 shadow-[0_3px_16px_rgba(15,23,42,0.06)]">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm ring-1 ring-orange-100">
                <Settings className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700/90">
                Workspace profile
              </p>
              <h3 className="mb-2 mt-1 text-base font-semibold text-gray-900">Who can edit</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Organization Admins, workspace owners, and users with manage access to CRM or PM settings can update
                this profile. Other members can use assigned apps without changing workspace details.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_3px_16px_rgba(15,23,42,0.06)]">
              <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                  <Lock className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">Your access</h3>
                  <p className="text-xs text-gray-500">Role and permissions for this workspace</p>
                </div>
              </div>

              <dl className="space-y-2.5">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/90 px-3.5 py-3">
                  <dt className="text-sm text-gray-600">Role</dt>
                  <dd className="truncate text-sm font-semibold text-gray-900">{currentRole || '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/90 px-3.5 py-3">
                  <dt className="text-sm text-gray-600">Profile editing</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        canEdit
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-amber-200 bg-amber-50 text-amber-800'
                      }`}
                    >
                      {canEdit ? 'Allowed' : 'View only'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
