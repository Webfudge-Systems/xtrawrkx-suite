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
import { Button, FormSectionCard, Input, LoadingSpinner, Select } from '@webfudge/ui'
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
    <div className="min-h-full space-y-6 bg-white p-4 md:p-6">
      <AccountsPageHeader
        title="Organization Settings"
        subtitle="Workspace profile and app-level administration settings."
        breadcrumb={[{ label: 'Settings', href: '/settings' }]}
      />

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 p-12">
          <LoadingSpinner size="lg" message="Loading organization..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
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

            <FormSectionCard
              icon={Building2}
              title="Workspace profile"
              description="These fields are shared across Accounts, PM, and CRM."
              cardClassName="border border-gray-200 shadow-sm"
              iconContainerClassName="bg-orange-500"
            >
              <fieldset disabled={!canEdit || saving} className="space-y-5 disabled:opacity-90">
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

              {canEdit ? (
                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500">
                    {isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
                  </p>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="secondary" onClick={resetForm} disabled={!isDirty || saving}>
                      Discard
                    </Button>
                    <Button variant="primary" onClick={save} disabled={saving || !isDirty}>
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Saving…' : 'Save settings'}
                    </Button>
                  </div>
                </div>
              ) : null}
            </FormSectionCard>
          </div>

          <aside className="space-y-4">
            <div className="h-fit rounded-2xl border border-orange-100 bg-gradient-to-b from-orange-50/80 to-orange-50/30 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                <Settings className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">Who can edit</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Organization Admins, workspace owners, and users with manage access to CRM or PM settings can update
                this profile. Other members can use assigned apps without changing workspace details.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
                <Lock className="h-4 w-4 text-gray-500" />
                Your access
              </div>
              <p className="text-sm text-gray-600">
                Role: <span className="font-medium text-gray-900">{currentRole || '—'}</span>
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Profile editing:{' '}
                <span className={canEdit ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'}>
                  {canEdit ? 'Allowed' : 'View only'}
                </span>
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
