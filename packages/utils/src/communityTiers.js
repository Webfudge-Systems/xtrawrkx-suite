/**
 * XEN membership tiers — aligned with landing XenPage.jsx marketing data.
 */
export const XEN_MEMBERSHIP_TIERS = [
  {
    tier: 'X0',
    name: 'WA Member',
    description: 'Anyone interested in hardware startups; WhatsApp group only',
    price3Month: 'Free',
    price12Month: 'Free',
    totalHours: 4,
    isPaid: false,
    color: 'gray',
  },
  {
    tier: 'X1',
    name: 'Future Founders',
    description: 'Students or early-stage individuals with stable income sources',
    price3Month: '₹25,000',
    price12Month: '₹75,000',
    totalHours: 7,
    isPaid: true,
    color: 'blue',
  },
  {
    tier: 'X2',
    name: 'Early Stage Startup',
    description: 'No revenue, no investment, bootstrapped',
    price3Month: '₹1,00,000',
    price12Month: '₹3,00,000',
    totalHours: 14,
    isPaid: true,
    color: 'blue',
  },
  {
    tier: 'X3',
    name: 'Mature Startups & SMEs',
    description: 'Revenue < $1M ARR, early funding stage',
    price3Month: '₹2,00,000',
    price12Month: '₹6,00,000',
    totalHours: 28,
    isPaid: true,
    color: 'orange',
  },
  {
    tier: 'X4',
    name: 'Large Corporates',
    description: 'Revenue: $1M–$10M',
    price3Month: '₹4,00,000',
    price12Month: '₹12,00,000',
    totalHours: 56,
    isPaid: true,
    color: 'orange',
  },
  {
    tier: 'X5',
    name: 'MNCs',
    description: 'Revenue > $10M, global presence',
    price3Month: '₹8,00,000',
    price12Month: '₹24,00,000',
    totalHours: 112,
    isPaid: true,
    color: 'orange',
  },
];

export const COMMUNITY_ENUM_LABELS = {
  XEN: 'XEN',
  XEVFIN: 'XEV.FiN',
  XEVTG: 'XEVTG',
  XDD: 'xD&D',
};

export const PENDING_SUBMISSION_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_INFO'];

export function getXenTierByCode(tierCode) {
  if (!tierCode) return null;
  return XEN_MEMBERSHIP_TIERS.find((t) => t.tier === String(tierCode).toUpperCase()) || null;
}

export function membershipTypeFromTier(tierCode) {
  const tier = getXenTierByCode(tierCode);
  if (!tier) return 'FREE';
  return tier.isPaid ? 'PREMIUM' : 'FREE';
}

export function tierPerksSummary(tierCode) {
  const tier = getXenTierByCode(tierCode);
  if (!tier) return [];
  return [
    `${tier.totalHours} advisory hours / month`,
    tier.isPaid ? 'Paid membership with full XEN perks' : 'WhatsApp community access',
    tier.description,
  ];
}
