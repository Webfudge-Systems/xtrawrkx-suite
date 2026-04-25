import { z } from 'zod';
import { extractJsonObject } from './extractSchemas.js';

export const generateOutreachRequestSchema = z.object({
  linkedin: z.record(z.any()).optional(),
  enrichment: z.record(z.any()).optional(),
  insights: z.record(z.any()).optional(),
  persona: z.string().optional(),
  potential_needs: z.array(z.string()).optional(),
  linkedinProfileData: z.record(z.any()).optional(),
});

function toEmpty(str) {
  if (str == null) return '';
  return String(str).trim();
}

export function parseOutreachResponseFromAi(text) {
  const raw = extractJsonObject(text);
  const parsed = JSON.parse(raw);
  return {
    shortDm: toEmpty(parsed.shortDm),
    personalizedPitch: toEmpty(parsed.personalizedPitch),
    salesMessage: toEmpty(parsed.salesMessage),
  };
}
