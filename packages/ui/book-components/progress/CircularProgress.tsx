'use client'

import { useEffect, useState } from 'react'
import { Card } from '@webfudge/ui'

export type CircularProgressProps = {
  title?: string
  current: number
  goal: number
  currencySymbol?: string
  className?: string
}

function formatInr(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)
}

export function CircularProgress({
  title = 'Budget',
  current,
  goal,
  currencySymbol = '₹',
  className,
}: CircularProgressProps) {
  const pct = goal > 0 ? Math.min(100, Math.max(0, (current / goal) * 100)) : 0
  const [displayPct, setDisplayPct] = useState(0)

  useEffect(() => {
    const t = requestAnimationFrame(() => setDisplayPct(pct))
    return () => cancelAnimationFrame(t)
  }, [pct])

  const circumference = 2 * Math.PI * 44
  const offset = circumference - (displayPct / 100) * circumference

  return (
    <Card variant="elevated" padding className={className}>
      <p className="mb-4 text-sm font-medium text-gray-500">{title}</p>
      <div className="relative mx-auto flex aspect-square max-w-[220px] items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <defs>
            <linearGradient id="books-progress-orange" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          <circle className="text-gray-100" cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="url(#books-progress-orange)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-2xl font-bold tracking-tight text-gray-900">
            {currencySymbol}
            {formatInr(current)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            of {currencySymbol}
            {formatInr(goal)}
          </p>
          <p className="mt-2 text-sm font-semibold text-orange-600">{Math.round(displayPct)}%</p>
        </div>
      </div>
    </Card>
  )
}

export default CircularProgress
