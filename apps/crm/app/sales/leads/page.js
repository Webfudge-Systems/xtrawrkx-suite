'use client'

import Link from 'next/link'
import { Container, Card, PageHeader, Button, Table, EmptyState } from '@webfudge/ui'
import { Plus, Target } from 'lucide-react'

const columns = [{ key: 'name', title: 'Name' }, { key: 'company', title: 'Company' }, { key: 'stage', title: 'Stage' }]
const data = []

export default function LeadsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 min-h-full">
      <PageHeader
        title="Leads"
        subtitle="Manage and qualify leads"
        breadcrumb={[{ label: 'Sales', href: '/sales' }, { label: 'Leads', href: '/sales/leads' }]}
      />
      <Container>
        <Card variant="default" padding={false}>
          {data.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No leads yet"
              description="Add your first lead to get started."
              action={
                <Button as={Link} href="/sales/lead-companies/new" variant="primary">
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Add Lead
                </Button>
              }
            />
          ) : (
            <Table columns={columns} data={data} />
          )}
        </Card>
      </Container>
    </div>
  )
}
