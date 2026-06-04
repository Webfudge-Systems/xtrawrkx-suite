'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Container, Card, PageHeader, Button } from '@webfudge/ui'

export default function SalesAccountDetailPage() {
  const params = useParams()
  const id = params.id

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-full">
      <PageHeader
        title={`Account #${id}`}
        subtitle="View and edit account"
        breadcrumb={[
          { label: 'Sales', href: '/sales' },
          { label: 'Accounts', href: '/sales/accounts' },
          { label: id, href: `/sales/accounts/${id}` },
        ]}
      />
      <Container>
        <Card variant="default" padding title="Overview">
          <p className="text-gray-500">Account detail will appear here.</p>
          <Button as={Link} href={`/sales/accounts/${id}/edit`} variant="outline" className="mt-4">
            Edit
          </Button>
        </Card>
      </Container>
    </div>
  )
}
