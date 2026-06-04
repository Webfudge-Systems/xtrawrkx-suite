/**
 * Client portal communities — Strapi enums must match
 * `community-submission` / `community-membership` schema (XEN, XEVFIN, XEVTG, XDD).
 */

export const communityAvatarClass = {
  "blue-500": "bg-blue-500",
  "green-500": "bg-green-500",
  "purple-500": "bg-purple-500",
  "pink-500": "bg-pink-500",
};

export function avatarClassFor(colorKey) {
  return communityAvatarClass[colorKey] || "bg-xtrawrkx-500";
}

export const STRAPI_COMMUNITY = {
  XEN: "XEN",
  XEVFIN: "XEVFIN",
  XEVTG: "XEVTG",
  XDD: "XDD",
};

export const COMMUNITIES_LIST = [
  {
    id: 1,
    strapiEnum: STRAPI_COMMUNITY.XEN,
    name: "XEN",
    fullName: "XEN Entrepreneurs Network",
    category: "Business Division",
    description:
      "Early-stage startup community focused on innovation and growth",
    members: 1247,
    tier: "Premium",
    status: "Active",
    tags: ["Startup Support", "Networking", "Mentorship"],
    logo: "/images/logos/xen-logo.png",
    color: "blue-500",
    isMember: false,
    userTier: null,
    userTierName: null,
    canUpgrade: false,
    nextTier: null,
    nextTierName: null,
    monthlyEvents: 8,
    activeDiscussions: 23,
    successStoriesCount: 156,
    joinDate: null,
    memberSince: null,
    benefits: [
      "Weekly networking events",
      "1-on-1 mentorship sessions",
      "Pitch deck reviews",
      "Co-founder matching",
    ],
  },
  {
    id: 2,
    strapiEnum: STRAPI_COMMUNITY.XEVFIN,
    name: "XEV.FiN",
    fullName: "XEV Financial Network",
    category: "Investment Division",
    description:
      "Investment & funding network for entrepreneurs and investors",
    members: 523,
    tier: "Elite",
    status: "Active",
    tags: ["Investment", "Funding", "Due Diligence"],
    logo: "/images/logos/xevfin-logo.png",
    color: "green-500",
    isMember: false,
    userTier: null,
    userTierName: null,
    canUpgrade: false,
    nextTier: null,
    nextTierName: null,
    monthlyEvents: 4,
    activeDiscussions: 12,
    successStoriesCount: 89,
    joinDate: null,
    memberSince: null,
    benefits: [
      "Investor pitch sessions",
      "Due diligence workshops",
      "Term sheet negotiations",
      "Portfolio management",
    ],
  },
  {
    id: 3,
    strapiEnum: STRAPI_COMMUNITY.XEVTG,
    name: "XEVTG",
    fullName: "XEV Tech Guild",
    category: "Tech Division",
    description: "Tech talent marketplace for professionals and companies",
    members: 2156,
    tier: "Standard",
    status: "Active",
    tags: ["Tech Talent", "Remote Work", "Skill Development"],
    logo: "/images/logos/xevtg-logo.png",
    color: "purple-500",
    isMember: false,
    userTier: null,
    userTierName: null,
    canUpgrade: false,
    nextTier: null,
    nextTierName: null,
    monthlyEvents: 12,
    activeDiscussions: 45,
    successStoriesCount: 234,
    joinDate: null,
    memberSince: null,
    benefits: [
      "Skill assessment tests",
      "Job matching algorithm",
      "Remote work opportunities",
      "Tech mentorship",
    ],
  },
  {
    id: 4,
    strapiEnum: STRAPI_COMMUNITY.XDD,
    name: "xD&D",
    fullName: "Design & Development Community",
    category: "Creative Division",
    description: "Design & development community for creators and builders",
    members: 892,
    tier: "Standard",
    status: "Active",
    tags: ["Design", "Development", "Portfolio"],
    logo: "/images/logos/xdd-logo.png",
    color: "pink-500",
    isMember: false,
    userTier: null,
    userTierName: null,
    canUpgrade: false,
    nextTier: null,
    nextTierName: null,
    monthlyEvents: 6,
    activeDiscussions: 18,
    successStoriesCount: 67,
    joinDate: null,
    memberSince: null,
    benefits: [
      "Portfolio reviews",
      "Design critiques",
      "Collaboration projects",
      "Creative workshops",
    ],
  },
];

export function getCommunityById(id) {
  const numeric = Number(id);
  return COMMUNITIES_LIST.find((c) => c.id === numeric) || null;
}
