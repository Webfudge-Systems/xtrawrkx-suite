/**
 * Industry and company type options for lead company and client account forms
 * across PM and CRM.
 *
 * Values are stored as-is on the backend.
 */

export const INDUSTRY_OTHER_VALUE = 'other';

/** Browser cache key for custom industries added via forms (merged into dropdowns). */
export const CUSTOM_INDUSTRIES_STORAGE_KEY = 'webfudge_custom_industries';

export const industryOptions = [
  { value: 'technology', label: 'Technology' },
  { value: 'software-saas', label: 'Software & SaaS' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'e-commerce', label: 'E-commerce' },
  { value: 'education', label: 'Education' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'media-entertainment', label: 'Media & Entertainment' },
  { value: 'logistics-transportation', label: 'Logistics & Transportation' },
  { value: INDUSTRY_OTHER_VALUE, label: 'Other' },
];

const PRESET_VALUE_SET = new Set(industryOptions.map((o) => o.value));

export function isPresetIndustryValue(value) {
  const v = (value || '').trim();
  return v !== '' && PRESET_VALUE_SET.has(v);
}

export function industryDisplayLabel(stored) {
  const raw = (stored || '').trim();
  if (!raw) return '';
  const canonical = canonicalIndustryValue(raw);
  const preset = industryOptions.find((o) => o.value === canonical);
  if (preset) return preset.label;
  return raw;
}

/** Preset list + custom values from accounts/leads/cache, sorted; "Other" stays last. */
export function buildIndustrySelectOptions(extraStored = []) {
  const customs = [];
  const seen = new Set();

  const addCustom = (raw) => {
    const v = (raw || '').trim();
    if (!v || v.toLowerCase() === 'other') return;
    const canonical = canonicalIndustryValue(v);
    if (PRESET_VALUE_SET.has(canonical)) return;
    const value = v;
    const label = industryDisplayLabel(v);
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    customs.push({ value, label });
  };

  for (const raw of extraStored) addCustom(raw);

  customs.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  const presets = industryOptions.filter((o) => o.value !== INDUSTRY_OTHER_VALUE);
  const other = industryOptions.find((o) => o.value === INDUSTRY_OTHER_VALUE);
  return [...presets, ...customs, ...(other ? [other] : [])];
}

export function readCachedCustomIndustries() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_INDUSTRIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => typeof v === 'string' && v.trim());
  } catch {
    return [];
  }
}

export function rememberCustomIndustry(label) {
  const v = (label || '').trim();
  if (!v || isPresetIndustryValue(v) || v.toLowerCase() === 'other') return;
  if (typeof window === 'undefined') return;
  const existing = readCachedCustomIndustries();
  const key = v.toLowerCase();
  if (existing.some((e) => e.trim().toLowerCase() === key)) return;
  try {
    window.localStorage.setItem(
      CUSTOM_INDUSTRIES_STORAGE_KEY,
      JSON.stringify([v, ...existing].slice(0, 50))
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export const companyTypes = [
  { id: 'startup-corporate', name: 'Startup and Corporates' },
  { id: 'investor', name: 'Investors' },
  { id: 'enablers-academia', name: 'Enablers & Academia' },
];

export const companyTypeSelectOptions = companyTypes.map((t) => ({
  value: t.id,
  label: t.name,
}));

/** Map saved free-text / label casing to canonical option value for controlled selects. */
export function canonicalIndustryValue(stored) {
  const v = (stored || '').trim();
  if (!v) return '';
  const lower = v.toLowerCase();
  const hit = industryOptions.find(
    (o) =>
      o.value === lower ||
      o.label.toLowerCase() === lower ||
      o.value === v ||
      o.label.toLowerCase() === v.toLowerCase()
  );
  return hit ? hit.value : v;
}

/** Split stored industry into select value + optional custom text when "Other" was used. */
export function industryFormFromStored(stored) {
  const raw = (stored || '').trim();
  if (!raw) return { industry: '', industryOther: '' };
  const canonical = canonicalIndustryValue(raw);
  const preset = industryOptions.find((o) => o.value === canonical);
  if (preset && canonical !== INDUSTRY_OTHER_VALUE) {
    return { industry: canonical, industryOther: '' };
  }
  if (canonical === INDUSTRY_OTHER_VALUE && raw.toLowerCase() === 'other') {
    return { industry: INDUSTRY_OTHER_VALUE, industryOther: '' };
  }
  if (canonical === INDUSTRY_OTHER_VALUE) {
    return { industry: INDUSTRY_OTHER_VALUE, industryOther: raw };
  }
  return { industry: raw, industryOther: '' };
}

/** Value persisted on create/update from form select + optional custom field. */
export function resolveIndustryForSave(industrySelect, industryOther) {
  const select = (industrySelect || '').trim();
  if (select === INDUSTRY_OTHER_VALUE) {
    return (industryOther || '').trim();
  }
  return select;
}

export function canonicalCompanyTypeValue(stored) {
  const v = (stored || '').trim();
  if (!v) return '';
  if (companyTypes.some((t) => t.id === v)) return v;
  const hit = companyTypes.find((t) => t.name.toLowerCase() === v.toLowerCase());
  return hit ? hit.id : v;
}

/** Sub-types per lead company type — matches landing signup / event registration. */
export const LEAD_COMPANY_SUB_TYPES = {
  'startup-corporate': [
    'EV 2W',
    'EV 3W',
    'EV OEM',
    'EV 4W',
    'Motor OEM',
    'Motor Controller OEM',
    'Batteries',
    'Charging Infra',
    'Drones',
    'AGVs',
    'Consumer electronics',
    'Incubator / accelerator',
    'Power electronics',
    'Other OE',
    'Group',
    'EV Fleet',
    'E-commerce companies',
    '3rd party logistics',
    'Vehicle Smarts',
    'Swapping',
    'EV Leasing',
    'EV Rentals',
    'EV NBFC',
    'Power electronics+Vechicle smart',
    'Electronics Components',
    '1DL/MDL',
    'Franchisee',
    'Smart Battery',
    'Dealer',
    'Motor Parts',
    'Spare Part',
    'Traditional Auto',
    'Smart Electronic',
    'Mech Parts',
    'Energy Storing',
    'Automotive Parts_ EV manufacturers',
    'IOT',
    'Inverter',
    'Aggregator',
  ],
  investor: [
    'Future Founder',
    'Private Lender P2P',
    'Angel',
    'Angel Network',
    'Micro VC',
    'VC',
    'Family Office',
    'Private Equity PE',
    'Debt',
    'WC Working Capital',
    'NBFC',
    'Bill discounting',
    'Investment Bank',
    'Banks',
    'Asset Investor',
    'Asset Financier',
    'Asset Leasing',
    'Op Franchisee',
    'Franchise Network',
    'Incubation Center',
    'Accelerator',
    'Industry body',
    'Gov Body',
    'Gov Policy',
    'Alternative Investment Platform',
    'Strategic investor',
    'CVC',
    'HNI',
  ],
  'enablers-academia': [
    'Incubator',
    'Accelerator',
    'Venture Studio',
    'Academia',
    'Government Office',
    'Mentor',
    'Investment Banker',
  ],
};

export function getLeadSubTypeSelectOptions(companyTypeId, storedValue = '') {
  const options = (LEAD_COMPANY_SUB_TYPES[companyTypeId] || []).map((label) => ({
    value: label,
    label,
  }));
  const v = (storedValue || '').trim();
  if (v && !options.some((o) => o.value === v)) {
    return [{ value: v, label: v }, ...options];
  }
  return options;
}
