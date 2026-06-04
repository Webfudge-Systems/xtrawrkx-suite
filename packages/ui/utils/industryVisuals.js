import {
  Building2,
  Briefcase,
  Cpu,
  Factory,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  ShoppingBag,
} from 'lucide-react'
import { canonicalIndustryValue, industryOptions } from '@webfudge/utils'

function humanizeIndustryLabel(stored) {
  if (!stored) return 'Other'
  return String(stored)
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const INDUSTRY_VISUALS = {
  technology: {
    Icon: Cpu,
    label: 'Technology',
    accentClass: 'text-violet-700',
    iconBgClass: 'bg-violet-100',
    iconRingClass: 'ring-violet-200/80',
    cardBorderClass: 'border-violet-100',
    cardGradientClass: 'from-violet-50/90 via-white to-white',
  },
  healthcare: {
    Icon: HeartPulse,
    label: 'Healthcare',
    accentClass: 'text-rose-700',
    iconBgClass: 'bg-rose-100',
    iconRingClass: 'ring-rose-200/80',
    cardBorderClass: 'border-rose-100',
    cardGradientClass: 'from-rose-50/90 via-white to-white',
  },
  finance: {
    Icon: Landmark,
    label: 'Finance',
    accentClass: 'text-sky-700',
    iconBgClass: 'bg-sky-100',
    iconRingClass: 'ring-sky-200/80',
    cardBorderClass: 'border-sky-100',
    cardGradientClass: 'from-sky-50/90 via-white to-white',
  },
  manufacturing: {
    Icon: Factory,
    label: 'Manufacturing',
    accentClass: 'text-amber-800',
    iconBgClass: 'bg-amber-100',
    iconRingClass: 'ring-amber-200/80',
    cardBorderClass: 'border-amber-100',
    cardGradientClass: 'from-amber-50/90 via-white to-white',
  },
  retail: {
    Icon: ShoppingBag,
    label: 'Retail',
    accentClass: 'text-fuchsia-700',
    iconBgClass: 'bg-fuchsia-100',
    iconRingClass: 'ring-fuchsia-200/80',
    cardBorderClass: 'border-fuchsia-100',
    cardGradientClass: 'from-fuchsia-50/90 via-white to-white',
  },
  education: {
    Icon: GraduationCap,
    label: 'Education',
    accentClass: 'text-indigo-700',
    iconBgClass: 'bg-indigo-100',
    iconRingClass: 'ring-indigo-200/80',
    cardBorderClass: 'border-indigo-100',
    cardGradientClass: 'from-indigo-50/90 via-white to-white',
  },
  'real-estate': {
    Icon: Home,
    label: 'Real Estate',
    accentClass: 'text-teal-700',
    iconBgClass: 'bg-teal-100',
    iconRingClass: 'ring-teal-200/80',
    cardBorderClass: 'border-teal-100',
    cardGradientClass: 'from-teal-50/90 via-white to-white',
  },
  consulting: {
    Icon: Briefcase,
    label: 'Consulting',
    accentClass: 'text-slate-700',
    iconBgClass: 'bg-slate-100',
    iconRingClass: 'ring-slate-200/80',
    cardBorderClass: 'border-slate-200',
    cardGradientClass: 'from-slate-50/90 via-white to-white',
  },
  other: {
    Icon: Building2,
    label: 'Other',
    accentClass: 'text-emerald-700',
    iconBgClass: 'bg-emerald-100',
    iconRingClass: 'ring-emerald-200/80',
    cardBorderClass: 'border-emerald-50',
    cardGradientClass: 'from-emerald-50/80 via-white to-white',
  },
}

/**
 * Icon, label, and Tailwind theme tokens for a stored industry value.
 * Used on lead-company and client-account detail/form pages in CRM and PM.
 */
export function getIndustryVisual(storedIndustry) {
  const key = canonicalIndustryValue(storedIndustry) || 'other'
  const normalized = String(key).toLowerCase()
  const visual = INDUSTRY_VISUALS[normalized] || INDUSTRY_VISUALS.other
  const fromOptions = industryOptions.find((o) => o.value === normalized)
  const label = fromOptions?.label || humanizeIndustryLabel(storedIndustry)
  return { ...visual, label, key: normalized }
}
