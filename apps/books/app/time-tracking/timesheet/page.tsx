'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Table, Tabs } from '@webfudge/ui'
import { booksApi } from '@/lib/api'
import type { TimeEntry } from '@/lib/types'

export default function TimesheetPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [timerRunning, setTimerRunning] = useState(false)

  useEffect(() => {
    booksApi.fetchTimeEntries().then((res) => setEntries(res.data ?? [])).catch(() => setEntries([]))
  }, [])

  const table = useMemo(
    () => (
      <Card className="p-0 overflow-hidden">
        <Table
          variant="modernEmbedded"
          columns={[
            { key: 'date', title: 'Date' },
            { key: 'projectId', title: 'Project' },
            { key: 'task', title: 'Task' },
            { key: 'hours', title: 'Hours' },
            { key: 'billable', title: 'Billable', render: (v: boolean) => (v ? 'Yes' : 'No') },
          ]}
          data={entries}
        />
      </Card>
    ),
    [entries]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Timesheet</h1>
        <div className="flex gap-2">
          <Button variant={timerRunning ? 'secondary' : 'primary'} onClick={() => setTimerRunning((v) => !v)}>
            {timerRunning ? 'Stop Timer' : 'Start Timer'}
          </Button>
          <Button>Generate Invoice from Billable Time</Button>
        </div>
      </div>
      <Tabs
        tabs={[
          { id: 'weekly', label: 'Weekly', content: table },
          { id: 'daily', label: 'Daily', content: table },
        ]}
      />
    </div>
  )
}
