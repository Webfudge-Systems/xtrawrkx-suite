'use client'

import Link from 'next/link'
import { Container, Card, PageHeader, Button, Input } from '@webfudge/ui'

export default function NewSalesAccountPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 min-h-full">
      <PageHeader
        title="New Account"
        subtitle="Add a new sales account"
        breadcrumb={[
          { label: 'Sales', href: '/sales' },
          { label: 'Accounts', href: '/sales/accounts' },
          { label: 'New', href: '/sales/accounts/new' },
        ]}
      />
      <Container>
        <Card variant="default" padding title="Details">
          <form className="space-y-4 max-w-lg">
            <Input label="Account name" placeholder="Acme Inc." />
            <Input label="Primary contact" placeholder="Name" />
            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="primary">Save</Button>
              <Button as={Link} href="/sales/accounts" variant="outline">Cancel</Button>
            </div>
          </form>
        </Card>
      </Container>
    </div>
  )
}
