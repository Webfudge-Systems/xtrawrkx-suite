'use client'

import { ClipboardList, FileText, Target, Users } from 'lucide-react'
import BooksAccountantListShell from '../_components/BooksAccountantListShell'
import BooksChartPlaceholderCard from '../_components/BooksChartPlaceholderCard'

export default function BulkUpdatePage() {
  return (
    <BooksAccountantListShell
      kpis={[
        { title: 'All Jobs', value: 0, subtitle: 'No jobs', icon: ClipboardList, colorScheme: 'orange' },
        { title: 'Queued', value: 0, subtitle: 'No queued', icon: Target, colorScheme: 'orange' },
        { title: 'Completed', value: 0, subtitle: 'No completed', icon: FileText, colorScheme: 'orange' },
        { title: 'Users', value: 0, subtitle: 'No activity', icon: Users, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All', count: 0 },
        { key: 'queued', label: 'Queued', count: 0 },
        { key: 'completed', label: 'Completed', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      topBlocks={
        <>
          <BooksChartPlaceholderCard title="Bulk Update Activity" />
          <BooksChartPlaceholderCard title="Most Updated Fields" />
        </>
      }
      columns={[
        { key: 'jobId', label: 'JOB ID' },
        { key: 'module', label: 'MODULE' },
        { key: 'status', label: 'STATUS' },
        { key: 'createdAt', label: 'CREATED' },
        { key: 'updatedAt', label: 'UPDATED' },
      ]}
      data={[]}
      emptyIcon={ClipboardList}
      emptyTitle="No bulk updates found"
      emptyDescription="Bulk update jobs will appear here when created"
      addHref="/accountant/bulk-update/new"
      addLabel="Add Bulk Update"
    />
  )
}
