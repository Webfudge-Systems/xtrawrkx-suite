'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  Save,
  Shield,
} from 'lucide-react'
import { authService } from '@webfudge/auth'
import { Button, Card, Checkbox, Input, LoadingSpinner, Select } from '@webfudge/ui'
import AccountsPageHeader from '../../components/AccountsPageHeader'
import { isOrganizationAdmin } from '../../lib/accountsAccess'
import { organizationService } from '../../lib/api'
import {
  buildSecuritySettingsPayload,
  EMPTY_SECURITY_FORM,
  securityFormsEqual,
  securitySettingsToForm,
  SESSION_TIMEOUT_OPTIONS,
} from '../../lib/securitySettings'

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

function roleDisplayLabel(org, fallbackRole) {
  return (
    org?.currentRole ||
    fallbackRole?.name ||
    org?.currentRoleCode ||
    fallbackRole?.code ||
    ''
  )
}

export default function SecurityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [canManage, setCanManage] = useState(false)
  const [currentRole, setCurrentRole] = useState('')
  const [form, setForm] = useState({ ...EMPTY_SECURITY_FORM })
  const [savedForm, setSavedForm] = useState({ ...EMPTY_SECURITY_FORM })

  const isDirty = useMemo(() => !securityFormsEqual(form, savedForm), [form, savedForm])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setMessage('')

    const clientAdmin = isOrganizationAdmin()
    const clientRole = authService.getCurrentOrgRole()

    if (!clientAdmin) {
      router.replace('/unauthorized')
      return
    }

    setCanManage(true)
    setCurrentRole(roleDisplayLabel(null, clientRole))

    try {
      let org = null
      try {
        const orgResponse = await organizationService.getCurrent()
        org = orgResponse?.data ?? orgResponse
        setCurrentRole(roleDisplayLabel(org, clientRole))
        if (org?.canManageSecuritySettings === false && !clientAdmin) {
          router.replace('/unauthorized')
          return
        }
        setCanManage(Boolean(org?.canManageSecuritySettings ?? clientAdmin))
      } catch (orgErr) {
        if (!clientAdmin) throw orgErr
        setCanManage(true)
      }

      try {
        const securityPayload = await organizationService.getSecuritySettings()
        const settings = securityPayload?.data ?? securityPayload ?? {}
        const nextForm = securitySettingsToForm(settings)
        setForm(nextForm)
        setSavedForm(nextForm)
      } catch (settingsErr) {
        if (!clientAdmin) throw settingsErr
        const defaults = securitySettingsToForm({})
        setForm(defaults)
        setSavedForm(defaults)
        setError(settingsErr?.message || 'Failed to load security settings')
      }
    } catch (err) {
      setCanManage(clientAdmin)
      setError(err?.message || 'Failed to load security settings')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  const setField = (key, value) => {
    setMessage('')
    setError('')
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    if (!canManage) return
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const payload = buildSecuritySettingsPayload(form)
      await organizationService.updateSecuritySettings(payload)
      const nextForm = securitySettingsToForm(payload)
      setForm(nextForm)
      setSavedForm(nextForm)
      setMessage('Security settings saved successfully.')
    } catch (err) {
      setError(err?.message || 'Failed to save security settings')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setForm(savedForm)
    setError('')
    setMessage('')
  }

  return (
    <div className="min-h-full space-y-4 bg-white p-4">
      <AccountsPageHeader
        title="Security"
        subtitle="Authentication policies, session controls, and access restrictions."
        breadcrumb={[{ label: 'Security', href: '/security' }]}
      />

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-gray-100 bg-gray-50/80 py-16">
          <LoadingSpinner size="lg" message="Loading security settings..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {error ? <StatusBanner variant="error">{error}</StatusBanner> : null}
            {message ? <StatusBanner variant="success">{message}</StatusBanner> : null}

            <Card
              glass
              title="Authentication"
              subtitle="Control how users sign in to your organization."
              actions={<Lock className="h-5 w-5 text-gray-500" />}
            >
              <fieldset
                disabled={!canManage || saving}
                className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 disabled:opacity-90"
              >
                <Checkbox
                  label="Require multi-factor authentication (MFA)"
                  checked={form.requireMfa}
                  onChange={(checked) => setField('requireMfa', checked)}
                />
                <Checkbox
                  label="Allow email/password login"
                  checked={form.allowPasswordLogin}
                  onChange={(checked) => setField('allowPasswordLogin', checked)}
                />
                <Input
                  label="Minimum password length"
                  type="number"
                  min={6}
                  max={128}
                  value={String(form.passwordMinLength)}
                  onChange={(e) => setField('passwordMinLength', e.target.value)}
                />
              </fieldset>
            </Card>

            <Card
              glass
              title="Sessions"
              subtitle="Manage session lifetime for workspace apps."
              actions={<Shield className="h-5 w-5 text-gray-500" />}
            >
              <fieldset
                disabled={!canManage || saving}
                className="rounded-xl border border-gray-200 bg-white p-4 disabled:opacity-90"
              >
                <Select
                  label="Session timeout"
                  value={String(form.sessionTimeoutMinutes)}
                  onChange={(v) => setField('sessionTimeoutMinutes', Number(v))}
                  options={SESSION_TIMEOUT_OPTIONS}
                />
              </fieldset>
            </Card>

            <Card
              glass
              title="Email domain restrictions"
              subtitle="Limit invitations to specific email domains (comma-separated). Leave empty to allow any domain."
              actions={<Mail className="h-5 w-5 text-gray-500" />}
            >
              <fieldset
                disabled={!canManage || saving}
                className="rounded-xl border border-gray-200 bg-white p-4 disabled:opacity-90"
              >
                <Input
                  placeholder="example.com, company.org"
                  value={form.allowedEmailDomains}
                  onChange={(e) => setField('allowedEmailDomains', e.target.value)}
                />
              </fieldset>
            </Card>

            {canManage ? (
              <Card
                glass
                title="Save changes"
                subtitle={isDirty ? 'You have unsaved security settings.' : 'All changes are saved.'}
                actions={<Save className="h-5 w-5 text-gray-500" />}
              >
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <Button variant="secondary" onClick={resetForm} disabled={!isDirty || saving}>
                    Discard
                  </Button>
                  <Button variant="primary" onClick={save} disabled={saving || !isDirty}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving…' : 'Save security settings'}
                  </Button>
                </div>
              </Card>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="h-fit rounded-2xl border border-orange-100 bg-gradient-to-b from-orange-50/90 to-white p-5 shadow-[0_3px_16px_rgba(15,23,42,0.06)]">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm ring-1 ring-orange-100">
                <Shield className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700/90">
                Policy access
              </p>
              <h3 className="mb-2 mt-1 text-base font-semibold text-gray-900">Who can manage</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Only organization Admins can view and update authentication policies, session timeouts, and email domain
                restrictions for this workspace.
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
                  <dt className="text-sm text-gray-600">Security settings</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        canManage
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-amber-200 bg-amber-50 text-amber-800'
                      }`}
                    >
                      {canManage ? 'Can edit' : 'View only'}
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
