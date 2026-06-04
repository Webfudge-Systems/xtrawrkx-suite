import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  FileText,
  Megaphone,
  Receipt,
  ShoppingCart,
  UserPlus,
  Wallet,
} from 'lucide-react'

export type HomeActivityItem = {
  id: string
  group: 'Today' | 'Yesterday' | 'This week'
  module: 'Sales' | 'Purchases' | 'Banking' | 'Contacts' | 'Accountant'
  title: string
  description: string
  actor: string
  timeLabel: string
  amountLabel?: string
  Icon: LucideIcon
}

export type HomeAnnouncement = {
  id: string
  category: 'Product' | 'Events' | 'Maintenance'
  badge: 'New' | 'Webinar' | 'Update' | 'Tip'
  title: string
  summary: string
  dateLabel: string
  ctaLabel: string
  featured?: boolean
}

export type HomeRecentUpdate = {
  id: string
  module: string
  recordLabel: string
  recordId: string
  action: 'Created' | 'Updated' | 'Deleted' | 'Emailed' | 'Paid'
  user: string
  dateLabel: string
  timeLabel: string
  details: string
}

export const HOME_ACTIVITY_MOCK: HomeActivityItem[] = [
  {
    id: 'a1',
    group: 'Today',
    module: 'Sales',
    title: 'Invoice INV-2026-0142 sent',
    description: 'Sent to Acme Corp · Due 15 Jun 2026',
    actor: 'You',
    timeLabel: '10:42 AM',
    amountLabel: '₹48,500.00',
    Icon: FileText,
  },
  {
    id: 'a2',
    group: 'Today',
    module: 'Banking',
    title: 'Payment received',
    description: 'HDFC Operating · Matched to INV-2026-0138',
    actor: 'System',
    timeLabel: '9:15 AM',
    amountLabel: '₹22,000.00',
    Icon: Wallet,
  },
  {
    id: 'a3',
    group: 'Today',
    module: 'Purchases',
    title: 'Bill BILL-0091 recorded',
    description: 'CloudHost Services · Category: Software',
    actor: 'Priya Sharma',
    timeLabel: '8:03 AM',
    amountLabel: '₹12,400.00',
    Icon: ShoppingCart,
  },
  {
    id: 'a4',
    group: 'Yesterday',
    module: 'Contacts',
    title: 'Customer created',
    description: 'Northwind Traders · GSTIN added',
    actor: 'You',
    timeLabel: '4:28 PM',
    Icon: UserPlus,
  },
  {
    id: 'a5',
    group: 'Yesterday',
    module: 'Sales',
    title: 'Estimate EST-0044 accepted',
    description: 'Converted to sales order SO-0088',
    actor: 'Rahul Mehta',
    timeLabel: '2:11 PM',
    amountLabel: '₹1,05,000.00',
    Icon: Receipt,
  },
  {
    id: 'a6',
    group: 'Yesterday',
    module: 'Accountant',
    title: 'Manual journal posted',
    description: 'JE-2026-003 · Prepaid expense adjustment',
    actor: 'You',
    timeLabel: '11:50 AM',
    Icon: Banknote,
  },
  {
    id: 'a7',
    group: 'This week',
    module: 'Purchases',
    title: 'Vendor payment initiated',
    description: 'Office Supplies Co. · NEFT scheduled',
    actor: 'You',
    timeLabel: 'Mon, 9:00 AM',
    amountLabel: '₹8,750.00',
    Icon: ShoppingCart,
  },
  {
    id: 'a8',
    group: 'This week',
    module: 'Banking',
    title: 'Bank feed categorized',
    description: '18 transactions auto-matched',
    actor: 'System',
    timeLabel: 'Sun, 6:30 PM',
    Icon: Wallet,
  },
]

export const HOME_ANNOUNCEMENTS_MOCK: HomeAnnouncement[] = [
  {
    id: 'n1',
    category: 'Product',
    badge: 'New',
    title: 'Bulk update for chart of accounts',
    summary:
      'Update multiple accounts, descriptions, and parent accounts in one pass—similar to Zoho Books bulk update, tuned for agency books.',
    dateLabel: 'May 24, 2026',
    ctaLabel: 'Learn more',
    featured: true,
  },
  {
    id: 'n2',
    category: 'Events',
    badge: 'Webinar',
    title: 'Closing books faster for service businesses',
    summary: 'Live session on receivables, WIP, and month-end checklist for Books users.',
    dateLabel: 'Jun 4, 2026 · 3:00 PM IST',
    ctaLabel: 'Register',
  },
  {
    id: 'n3',
    category: 'Product',
    badge: 'Update',
    title: 'Improved bank reconciliation matching',
    summary: 'Smarter rules for INR and multi-currency accounts with clearer mismatch hints.',
    dateLabel: 'May 18, 2026',
    ctaLabel: 'View details',
  },
  {
    id: 'n4',
    category: 'Maintenance',
    badge: 'Tip',
    title: 'Scheduled maintenance — reporting APIs',
    summary: 'Brief read-only window on Reports export APIs. Dashboard and invoicing stay available.',
    dateLabel: 'May 30, 2026 · 1:00–2:00 AM IST',
    ctaLabel: 'See status',
  },
]

export const HOME_RECENT_UPDATES_MOCK: HomeRecentUpdate[] = [
  {
    id: 'u1',
    module: 'Sales',
    recordLabel: 'Invoice',
    recordId: 'INV-2026-0142',
    action: 'Emailed',
    user: 'You',
    dateLabel: 'May 27, 2026',
    timeLabel: '10:42 AM',
    details: 'Sent to billing@acmecorp.com',
  },
  {
    id: 'u2',
    module: 'Purchases',
    recordLabel: 'Bill',
    recordId: 'BILL-0091',
    action: 'Created',
    user: 'Priya Sharma',
    dateLabel: 'May 27, 2026',
    timeLabel: '8:03 AM',
    details: 'Vendor: CloudHost Services',
  },
  {
    id: 'u3',
    module: 'Banking',
    recordLabel: 'Transaction',
    recordId: 'TXN-88421',
    action: 'Updated',
    user: 'System',
    dateLabel: 'May 27, 2026',
    timeLabel: '9:15 AM',
    details: 'Category set to Customer Payment',
  },
  {
    id: 'u4',
    module: 'Contacts',
    recordLabel: 'Customer',
    recordId: 'CUS-0198',
    action: 'Created',
    user: 'You',
    dateLabel: 'May 26, 2026',
    timeLabel: '4:28 PM',
    details: 'Northwind Traders',
  },
  {
    id: 'u5',
    module: 'Sales',
    recordLabel: 'Estimate',
    recordId: 'EST-0044',
    action: 'Updated',
    user: 'Rahul Mehta',
    dateLabel: 'May 26, 2026',
    timeLabel: '2:11 PM',
    details: 'Status changed to Accepted',
  },
  {
    id: 'u6',
    module: 'Accountant',
    recordLabel: 'Manual Journal',
    recordId: 'JE-2026-003',
    action: 'Created',
    user: 'You',
    dateLabel: 'May 26, 2026',
    timeLabel: '11:50 AM',
    details: '2 line items · ₹24,000.00',
  },
  {
    id: 'u7',
    module: 'Items',
    recordLabel: 'Item',
    recordId: 'SVC-STRATEGY',
    action: 'Updated',
    user: 'You',
    dateLabel: 'May 25, 2026',
    timeLabel: '3:05 PM',
    details: 'Selling price revised',
  },
  {
    id: 'u8',
    module: 'Purchases',
    recordLabel: 'Vendor Payment',
    recordId: 'VP-2201',
    action: 'Paid',
    user: 'You',
    dateLabel: 'May 24, 2026',
    timeLabel: '9:00 AM',
    details: 'Office Supplies Co.',
  },
]

export const HOME_ACTIVITY_FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'sales', label: 'Sales' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'banking', label: 'Banking' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'accountant', label: 'Accountant' },
] as const

export const HOME_ANNOUNCEMENT_FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'product', label: 'Product' },
  { id: 'events', label: 'Events' },
  { id: 'maintenance', label: 'Maintenance' },
] as const

export const HOME_UPDATES_FILTER_TABS = [
  { id: 'all', label: 'All modules' },
  { id: 'sales', label: 'Sales' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'banking', label: 'Banking' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'accountant', label: 'Accountant' },
] as const

export const HOME_ANNOUNCEMENT_ICON = Megaphone
