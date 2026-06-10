'use client'

import { useMemo } from 'react'
import { Select } from '@webfudge/ui'

function getUserLabel(user) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
  if (fullName) return fullName
  if (user?.username) return user.username
  if (user?.email) return user.email
  return 'Unknown User'
}

function getUserOptionLabel(user) {
  const name = getUserLabel(user)
  if (user?.email && user.email !== name) {
    return `${name} (${user.email})`
  }
  return name
}

export default function TransferUserSelect({
  users = [],
  excludeUserId,
  value,
  onChange,
  disabled = false,
  label = 'Transfer assignments to',
  helperText = 'Leads, deals, projects, tasks, client accounts, and other open work will move to this user.',
}) {
  const options = useMemo(() => {
    return users
      .filter((user) => {
        if (excludeUserId == null) return true
        return String(user?.id) !== String(excludeUserId)
      })
      .map((user) => ({
        value: String(user.id),
        label: getUserOptionLabel(user),
      }))
  }, [excludeUserId, users])

  return (
    <div className="space-y-1.5">
      <Select
        label={label}
        value={value}
        onChange={onChange}
        disabled={disabled || options.length === 0}
        placeholder="Select a user..."
        searchPlaceholder="Search users..."
        searchable
        options={options}
      />
      {helperText ? <p className="text-xs text-gray-500">{helperText}</p> : null}
      {options.length === 0 ? (
        <p className="text-xs text-amber-700">No other active users are available to receive assignments.</p>
      ) : null}
    </div>
  )
}
