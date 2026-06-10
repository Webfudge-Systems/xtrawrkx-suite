'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, User } from 'lucide-react'
import { Button, FormSectionCard, Input } from '@webfudge/ui'
import PlatformPageHeader from '../../../components/PlatformPageHeader'
import platformService from '../../../lib/platformService'

export default function NewOrganizationPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerFirstName: '',
    ownerLastName: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const ownerEmail = form.ownerEmail.trim()
    if (!name || !ownerEmail) return

    setSubmitting(true)
    setError('')
    try {
      const org = await platformService.createOrganization({
        name,
        ownerEmail,
        ownerPassword: form.ownerPassword.trim() || undefined,
        ownerFirstName: form.ownerFirstName.trim() || undefined,
        ownerLastName: form.ownerLastName.trim() || undefined,
      })
      router.push(`/organizations/${org.id}`)
    } catch (err) {
      setError(err?.message || 'Failed to create organization')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6">
      <PlatformPageHeader
        title="Create organization"
        subtitle="Add a new company and set up the primary owner for that organization."
        breadcrumb={[
          { label: 'Organizations', href: '/organizations' },
          { label: 'Create' },
        ]}
      />

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <FormSectionCard
          icon={Building2}
          title="Company"
          description="Name for this organization. A unique slug is generated automatically."
        >
          <Input
            label="Organization name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Acme Operations"
            required
          />
        </FormSectionCard>

        <FormSectionCard
          icon={User}
          title="Primary owner"
          description="Owner for this company. A new account is created when the email is not already registered."
        >
          <div className="space-y-4">
            <Input
              label="Owner email"
              type="email"
              value={form.ownerEmail}
              onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
              placeholder="admin@company.com"
              required
            />
            <Input
              label="Owner password"
              type="password"
              value={form.ownerPassword}
              onChange={(e) => setForm((f) => ({ ...f, ownerPassword: e.target.value }))}
              placeholder="Required for new accounts (min 8 characters)"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                value={form.ownerFirstName}
                onChange={(e) => setForm((f) => ({ ...f, ownerFirstName: e.target.value }))}
              />
              <Input
                label="Last name"
                value={form.ownerLastName}
                onChange={(e) => setForm((f) => ({ ...f, ownerLastName: e.target.value }))}
              />
            </div>
          </div>
        </FormSectionCard>

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Link href="/organizations">
            <Button type="button" variant="secondary" className="w-full sm:w-auto">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting || !form.name.trim() || !form.ownerEmail.trim()}
            className="w-full sm:w-auto"
          >
            {submitting ? 'Creating…' : 'Create organization'}
          </Button>
        </div>
      </form>
    </div>
  )
}
