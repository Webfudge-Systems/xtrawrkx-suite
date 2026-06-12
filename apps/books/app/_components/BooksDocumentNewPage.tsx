'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'
import BooksEntityPageHeader from '@/app/_components/BooksEntityPageHeader'
import {
  useBooksBankStatementsStore,
  useBooksDocumentsStore,
} from '@/lib/mock-data/documents/stores'

type BooksDocumentNewPageProps = {
  variant: 'documents' | 'bank-statements'
}

export default function BooksDocumentNewPage({ variant }: BooksDocumentNewPageProps) {
  const router = useRouter()
  const { createDocument } = useBooksDocumentsStore()
  const { createStatement } = useBooksBankStatementsStore()

  const base = variant === 'documents' ? '/documents' : '/documents/bank-statements'
  const title = variant === 'documents' ? 'Document' : 'Bank Statement'

  const handleSubmitSuccess = useCallback(
    async (values: Record<string, string>) => {
      const name = values.name?.trim() || `${title}-${Date.now()}`
      const status = values.status?.trim() || 'Draft'
      const updatedAt = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      const payload = { name, status, updatedAt }
      const created =
        variant === 'documents' ? createDocument(payload) : createStatement(payload)
      router.replace(`${base}/${created.id}`)
    },
    [base, createDocument, createStatement, title, variant, router]
  )

  return (
    <div className="space-y-6">
      <BooksEntityPageHeader
        title={`New ${title}`}
        subtitle={`Upload or register a new ${title.toLowerCase()}.`}
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: title, href: base },
          { label: 'New' },
        ]}
      />
      <BooksCrmAddEntityPage
        theme="books"
        embedded
        submitLabel={`Create ${title}`}
        redirectOnCancelHref={base}
        onSubmitSuccess={handleSubmitSuccess}
        sections={[
          {
            icon: FileText,
            title: `${title} Details`,
            fields: [
              { key: 'name', type: 'input', label: 'File Name *', required: true, placeholder: 'report-may.pdf' },
              {
                key: 'status',
                type: 'select',
                label: 'Status',
                options: [
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Processed', label: 'Processed' },
                ],
              },
            ],
          },
        ]}
      />
    </div>
  )
}
