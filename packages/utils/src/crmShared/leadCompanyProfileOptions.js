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
