'use client'

import { BookOpen, FileText, TrendingUp, Users } from 'lucide-react'
import BooksAccountantListShell from '../_components/BooksAccountantListShell'
import BooksChartPlaceholderCard from '../_components/BooksChartPlaceholderCard'

export default function ManualJournalsPage() {
  return (
    <BooksAccountantListShell
      kpis={[
        { title: 'All Journals', value: 0, subtitle: 'No entries', icon: BookOpen, colorScheme: 'orange' },
        { title: 'Draft', value: 0, subtitle: 'No drafts', icon: FileText, colorScheme: 'orange' },
        { title: 'Posted', value: 0, subtitle: 'No posted', icon: TrendingUp, colorScheme: 'orange' },
        { title: 'Users', value: 0, subtitle: 'No activity', icon: Users, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All Journals', count: 0 },
        { key: 'draft', label: 'Draft', count: 0 },
        { key: 'posted', label: 'Posted', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      topBlocks={
        <>
          <BooksChartPlaceholderCard title="Posting Trend" />
          <BooksChartPlaceholderCard title="Entries by Type" />
        </>
      }
      columns={[
        { key: 'date', label: 'DATE' },
        { key: 'journalNumber', label: 'JOURNAL#' },
        { key: 'referenceNumber', label: 'REFERENCE' },
        { key: 'status', label: 'STATUS' },
        { key: 'notes', label: 'NOTES' },
      ]}
      data={[]}
      emptyIcon={BookOpen}
      emptyTitle="No manual journals found"
      emptyDescription="Manual journals will appear here when created"
      addHref="/accountant/manual-journals/new"
      addLabel="Add Manual Journal"
    />
  )
}
