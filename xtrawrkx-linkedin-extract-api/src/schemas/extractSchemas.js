import { z } from 'zod';

export const extractRequestSchema = z.object({
  url: z.string().min(1, 'url is required'),
  html: z.string().min(1, 'html is required'),
  title: z.string().optional(),
  capturedAt: z.string().optional(),
});

const recordArray = z.preprocess(
  (v) => (Array.isArray(v) ? v : []),
  z.array(z.record(z.any())),
);

function toEmptyString(v) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function normalizeExperienceItem(item) {
  if (!item || typeof item !== 'object') {
    return { title: '', company: '', duration: '', description: '' };
  }
  const duration =
    toEmptyString(item.duration) ||
    [item.startDate, item.endDate].filter(Boolean).map(String).join(' – ');
  return {
    title: toEmptyString(item.title),
    company: toEmptyString(item.company),
    duration: toEmptyString(duration),
    description: toEmptyString(item.description),
  };
}

function normalizeEducationItem(item) {
  if (!item || typeof item !== 'object') {
    return { institution: '', degree: '', duration: '' };
  }
  const duration =
    toEmptyString(item.duration) ||
    [item.startDate, item.endDate].filter(Boolean).map(String).join(' – ');
  return {
    institution: toEmptyString(item.institution || item.school),
    degree: toEmptyString(item.degree || item.field),
    duration: toEmptyString(duration),
  };
}

function hasAnyExperienceField(e) {
  return !!(e.title || e.company || e.duration || e.description);
}

function hasAnyEducationField(e) {
  return !!(e.institution || e.degree || e.duration);
}

function dedupeSkillsCaseInsensitive(skills) {
  const seen = new Set();
  const out = [];
  for (const raw of skills) {
    const s = String(raw).trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

const skillsArray = z.preprocess((v) => {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      if (typeof x === 'string') return x;
      if (x && typeof x === 'object' && typeof x.name === 'string') return x.name;
      return null;
    })
    .filter(Boolean);
}, z.array(z.string()));

export const linkedInProfileSchema = z
  .object({
    name: z.string().default(''),
    headline: z.string().default(''),
    location: z.string().nullable().optional(),
    about: z.string().nullable().optional(),
    experience: recordArray,
    education: recordArray,
    skills: skillsArray,
    followers: z.union([z.string(), z.number()]).nullable().optional(),
    connections: z.union([z.string(), z.number()]).nullable().optional(),
  })
  .transform((data) => {
    const experience = (data.experience || [])
      .map(normalizeExperienceItem)
      .filter(hasAnyExperienceField);
    const education = (data.education || [])
      .map(normalizeEducationItem)
      .filter(hasAnyEducationField);
    const skills = dedupeSkillsCaseInsensitive(
      (data.skills || []).map((s) => String(s).trim()).filter(Boolean),
    );

    return {
      name: toEmptyString(data.name),
      headline: toEmptyString(data.headline),
      location: toEmptyString(data.location),
      about: toEmptyString(data.about),
      followers: toEmptyString(data.followers),
      connections: toEmptyString(data.connections),
      experience,
      education,
      skills,
    };
  });

export function parseProfileFromAiJson(text) {
  const raw = extractJsonObject(text);
  const parsed = JSON.parse(raw);
  return linkedInProfileSchema.parse(parsed);
}

/**
 * Pull first JSON object from model output (handles ```json fences).
 */
export function extractJsonObject(text) {
  if (!text || typeof text !== 'string') {
    throw new SyntaxError('Empty AI response');
  }
  let s = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(s);
  if (fence) {
    s = fence[1].trim();
  }
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new SyntaxError('No JSON object in AI response');
  }
  return s.slice(start, end + 1);
}
