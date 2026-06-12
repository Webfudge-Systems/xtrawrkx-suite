'use client'

import Link from 'next/link'
import { Badge, Button, Card } from '@webfudge/ui'
import {
  BarChart3,
  BookOpen,
  Briefcase,
  CreditCard,
  DollarSign,
  ExternalLink,
  Globe,
  Headphones,
  Mail,
  MonitorPlay,
  Package,
  Play,
  Presentation,
  Sparkles,
  Wallet,
} from 'lucide-react'

const setupTasks = [
  {
    icon: BookOpen,
    modules: ['Accountant'] as const,
    title: 'Configure Chart of Accounts',
    description:
      'Define your account types in Books so journals, reports, and the general ledger stay aligned with how you operate.',
    primary: 'Open Chart of Accounts',
    href: '/accountant/chart-of-accounts',
    highlight: false,
  },
  {
    icon: Wallet,
    modules: ['Accountant'] as const,
    title: 'Enter Opening Balances',
    description:
      'Post opening balances via manual journals so your Books balances match bank and real-world positions on day one.',
    primary: 'Open Manual Journals',
    href: '/accountant/manual-journals',
    highlight: true,
  },
  {
    icon: CreditCard,
    modules: ['Banking'] as const,
    title: 'Connect Banking & Payments',
    description:
      'Link bank accounts in Books and reconcile payments against invoices, bills, and expenses.',
    primary: 'Open Banking',
    href: '/banking',
    highlight: false,
  },
  {
    icon: Globe,
    modules: ['Sales', 'Purchases'] as const,
    title: 'Invite Customers & Vendors',
    description:
      'Start from Sales → Customers and Purchases → Vendors so invoices, bills, and portal links use the right parties.',
    primary: 'Customers',
    href: '/sales/customers',
    highlight: false,
    secondaryHref: '/purchases/vendors',
    secondaryLabel: 'Vendors',
  },
  {
    icon: Sparkles,
    modules: ['Sales'] as const,
    title: 'Invoice Follow-ups & Reminders',
    description:
      'Use the Invoices workspace to track statuses and follow up on receivables as your Books data grows.',
    primary: 'Open Invoices',
    href: '/sales/invoices',
    highlight: false,
  },
  {
    icon: Headphones,
    modules: ['Accountant'] as const,
    title: 'Lock Periods & Controls',
    description:
      'Use transaction locking and accountant tools so closing periods and approvals match your Books policy.',
    primary: 'Transaction locking',
    href: '/accountant/transaction-locking',
    highlight: false,
  },
] as const

const booksQuickLinks = [
  { label: 'Items & inventory', href: '/items/all', icon: Package },
  { label: 'Sales hub', href: '/sales/customers', icon: DollarSign },
  { label: 'Purchases hub', href: '/purchases/vendors', icon: Briefcase },
  { label: 'System analytics', href: '/reports', icon: BarChart3 },
]

export default function BooksGettingStartedPanel() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mb-2 flex justify-center">
          <Badge variant="orange" size="sm">
            Books
          </Badge>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Welcome to Fudge Books</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
          Set up Sales, Purchases, Banking, and Accountant workflows in one place—then track invoices, bills, and cash with
          Books.
        </p>
      </div>

      <Card
        variant="elevated"
        padding={false}
        className="overflow-hidden border border-orange-100/80 bg-gradient-to-br from-orange-50/90 via-white to-amber-50/40 p-5 sm:p-6"
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="orange" size="sm">
            Overview
          </Badge>
          <span className="text-xs text-gray-500">Books workspace</span>
        </div>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
          <Link
            href="https://www.youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex aspect-video w-full shrink-0 cursor-pointer flex-col items-center justify-center rounded-2xl border border-orange-200/80 bg-white/80 shadow-inner transition hover:border-orange-300 lg:max-w-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition group-hover:scale-105">
              <Play className="h-8 w-8 pl-1" fill="currentColor" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-800">Fudge Books overview</p>
            <p className="text-xs text-gray-500">Placeholder · connect your help video later</p>
          </Link>
          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Getting started with Books</h3>
            <p className="text-sm leading-relaxed text-gray-600">
              See how Books ties together <strong className="font-medium text-gray-800">Sales</strong>,{' '}
              <strong className="font-medium text-gray-800">Purchases</strong>,{' '}
              <strong className="font-medium text-gray-800">Banking</strong>, and{' '}
              <strong className="font-medium text-gray-800">Accountant</strong> so invoices, bills, and reports stay in sync.
            </p>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              More Books videos
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {setupTasks.map((task) => {
          const Icon = task.icon
          const secondary = 'secondaryHref' in task ? task : null
          return (
            <Card
              key={task.title}
              variant="elevated"
              padding={false}
              className={`flex flex-col p-5 ${task.highlight ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-50' : 'border border-gray-100'}`}
            >
              <div className="mb-2 flex flex-wrap gap-1.5">
                {task.modules.map((m) => (
                  <Badge key={m} variant="orange" size="sm" className="font-medium">
                    {m}
                  </Badge>
                ))}
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-md">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">{task.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{task.description}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                <Button variant="primary" size="sm" as={Link} href={task.href} className="text-xs sm:text-sm">
                  {task.primary}
                </Button>
                {secondary && secondary.secondaryHref ? (
                  <Button variant="outline" size="sm" as={Link} href={secondary.secondaryHref} className="text-xs sm:text-sm">
                    {secondary.secondaryLabel}
                  </Button>
                ) : null}
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  <Play className="h-3.5 w-3.5" />
                  Watch &amp; Learn
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Jump to Books modules</p>
        <div className="flex flex-wrap gap-3">
          {booksQuickLinks.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50/50"
              >
                <Icon className="h-4 w-4 shrink-0 text-orange-500" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card variant="elevated" padding={false} className="overflow-hidden border border-emerald-100/80 bg-gradient-to-br from-emerald-50/50 to-white p-5">
          <div className="mb-2">
            <Badge variant="success" size="sm">
              Books · Alerts
            </Badge>
          </div>
          <div className="flex gap-4">
            <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80">
              <MonitorPlay className="h-10 w-10 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Stay on top of Books activity</h4>
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                <li>Watch overdue invoices and bills from Sales and Purchases</li>
                <li>Align reminders with your Books approval and locking rules</li>
                <li>Centralize updates for your team in this workspace</li>
              </ul>
            </div>
          </div>
        </Card>
        <Card variant="elevated" padding={false} className="overflow-hidden border border-orange-100/80 bg-gradient-to-br from-orange-50/40 to-white p-5">
          <div className="mb-2">
            <Badge variant="orange" size="sm">
              Books · Branding
            </Badge>
          </div>
          <div className="flex gap-4">
            <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-xl bg-orange-100/80">
              <Sparkles className="h-10 w-10 text-orange-700" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Branded invoices & estimates</h4>
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                <li>Match estimates, invoices, and credit notes to your brand in Books</li>
                <li>Keep tax and bank details consistent across documents</li>
                <li>Reuse templates as you scale Sales and Purchases volume</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-8 sm:grid-cols-3">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <Mail className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Books support</p>
            <p className="mt-1 text-xs text-gray-600">
              Email{' '}
              <a href="mailto:support@webfudge.com" className="font-medium text-orange-600 hover:underline">
                support@webfudge.com
              </a>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <Presentation className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Rollout &amp; training</p>
            <p className="mt-1 text-xs text-gray-600">Ask your org admin for a walkthrough of Books modules and permissions.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <MonitorPlay className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">What&apos;s new</p>
            <p className="mt-1 text-xs text-[var(--books-text-secondary,#6b7280)]">
              Product updates appear under Home → Recent Updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
