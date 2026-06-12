'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'
import BooksEntityPageHeader from '@/app/_components/BooksEntityPageHeader'
import { useBooksProjectsStore, useBooksTimeEntriesStore } from '@/lib/mock-data/time-tracking/stores'

const BASE = '/time-tracking/timesheet'

export default function BooksTimeEntryNewPage() {
  const router = useRouter()
  const { projects } = useBooksProjectsStore()
  const { createTimeEntry } = useBooksTimeEntriesStore()

  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: String(p.id), label: p.name })),
    [projects]
  )

  const handleSubmitSuccess = useCallback(
    async (values: Record<string, string>) => {
      const projectId = Number(values.projectId) || projects[0]?.id || 1
      const project = projects.find((p) => p.id === projectId)
      const created = createTimeEntry({
        projectId,
        projectName: project?.name ?? 'Project',
        task: values.task?.trim() || 'General',
        userId: 1,
        date: values.date || new Date().toISOString().slice(0, 10),
        hours: Number(values.hours) || 0,
        billable: values.billable !== 'false',
        invoiced: false,
      })
      router.replace(`${BASE}/${created.id}`)
    },
    [createTimeEntry, projects, router]
  )

  return (
    <div className="space-y-6">
      <BooksEntityPageHeader
        title="New Time Entry"
        subtitle="Log hours against a project."
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Timesheet', href: BASE },
          { label: 'New' },
        ]}
      />
      <BooksCrmAddEntityPage
        theme="books"
        embedded
        submitLabel="Log Time"
        redirectOnCancelHref={BASE}
        onSubmitSuccess={handleSubmitSuccess}
        sections={[
          {
            icon: Clock,
            title: 'Time Entry',
            fields: [
              { key: 'date', type: 'input', label: 'Date *', required: true, inputType: 'date' },
              { key: 'projectId', type: 'select', label: 'Project *', required: true, options: projectOptions },
              { key: 'task', type: 'input', label: 'Task *', required: true, placeholder: 'What did you work on?' },
              { key: 'hours', type: 'input', label: 'Hours *', required: true, placeholder: '2', inputType: 'number' },
              {
                key: 'billable',
                type: 'select',
                label: 'Billable',
                options: [
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ],
              },
            ],
          },
        ]}
      />
    </div>
  )
}
