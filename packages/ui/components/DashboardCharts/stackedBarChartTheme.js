/** Shared color tokens for dashboard stacked bar charts */

export const STACK_SERIES = {
  overdue: {
    key: 'overdue',
    label: 'Overdue',
    color: '#ef4444',
    dot: 'bg-red-500',
    text: 'text-red-700',
    pill: 'bg-red-50 text-red-800 ring-red-200/80',
  },
  pending: {
    key: 'pending',
    label: 'Pending',
    color: '#ea580c',
    dot: 'bg-orange-500',
    text: 'text-orange-700',
    pill: 'bg-orange-50 text-orange-800 ring-orange-200/80',
  },
  completed: {
    key: 'completed',
    label: 'Completed',
    color: '#22c55e',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  },
}

export const STACK_ORDER = ['overdue', 'pending', 'completed']
