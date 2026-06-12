'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase } from 'lucide-react'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'
import BooksEntityPageHeader from '@/app/_components/BooksEntityPageHeader'
import { buildProjectFromForm } from '@/lib/mock-data/time-tracking/seeds'
import { useBooksProjectsStore } from '@/lib/mock-data/time-tracking/stores'

const BASE = '/time-tracking/projects'

export default function BooksProjectNewPage() {
  const router = useRouter()
  const { createProject } = useBooksProjectsStore()

  const handleSubmitSuccess = useCallback(
    async (values: Record<string, string>) => {
      const created = createProject(buildProjectFromForm(values))
      router.replace(`${BASE}/${created.id}`)
    },
    [createProject, router]
  )

  const sections = useMemo(
    () => [
      {
        icon: Briefcase,
        title: 'Project Details',
        fields: [
          { key: 'name', type: 'input' as const, label: 'Project Name *', required: true, placeholder: 'Project name' },
          { key: 'customerName', type: 'input' as const, label: 'Customer *', required: true, placeholder: 'Customer name' },
          {
            key: 'billingMethod',
            type: 'select' as const,
            label: 'Billing Method',
            options: [
              { value: 'FixedCost', label: 'Fixed Cost' },
              { value: 'DailyRatePerUser', label: 'Daily Rate Per User' },
              { value: 'BasedOnTasks', label: 'Based On Tasks' },
            ],
          },
          { key: 'budget', type: 'input' as const, label: 'Budget', placeholder: '0', inputType: 'number' as const },
          {
            key: 'status',
            type: 'select' as const,
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'archived', label: 'Archived' },
            ],
          },
        ],
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <BooksEntityPageHeader
        title="New Project"
        subtitle="Create a project to track time and billing."
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Projects', href: BASE },
          { label: 'New' },
        ]}
      />
      <BooksCrmAddEntityPage
        theme="books"
        embedded
        sections={sections}
        submitLabel="Create Project"
        redirectOnCancelHref={BASE}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  )
}
