import { redirect } from 'next/navigation'

/**
 * Legacy route: `/my-tasks/add` now opens the create-task modal on `/my-tasks`.
 * Preserves optional `?status=` for default status.
 */
export default function AddTaskRedirectPage({ searchParams }) {
  const qs = new URLSearchParams()
  qs.set('createTask', '1')
  const status = searchParams?.status
  if (typeof status === 'string' && status) {
    qs.set('status', status)
  }
  redirect(`/my-tasks?${qs.toString()}`)
}
