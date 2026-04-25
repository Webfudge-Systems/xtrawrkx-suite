export const ENRICHMENT_MERGE_SYSTEM_PROMPT = `You merge LinkedIn-derived profile data with optional web search results to produce enrichment fields and sales insights.

Rules:
- Do not invent URLs or social handles. For website, Twitter, YouTube: only use values clearly supported by search result titles, links, or snippets (or leave empty string).
- For company: prefer the current/most relevant employer from LinkedIn experience when present; otherwise use search evidence. Use a single concise company name, or "".
- insights.persona: one concise label. Prefer one of: Creator, Founder, Freelancer, Agency Owner, Executive, Employee, Student, Investor, Other (or another short accurate label if none fit).
- insights.industry: short industry label from LinkedIn + search, or "".
- insights.lead_score: exactly one of: High, Medium, Low (assess fit for B2B SaaS / CRM / marketing tooling).
- insights.potential_needs: subset from: CRM, Marketing automation, Funnel, Personal branding. Only include needs with reasonable evidence; empty array if none. No duplicates.

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "enrichment": {
    "website": "",
    "twitter": "",
    "youtube": "",
    "company": ""
  },
  "insights": {
    "persona": "",
    "industry": "",
    "lead_score": "",
    "potential_needs": []
  }
}`;

export function buildEnrichmentMergeUserPayload(linkedinProfile, searchMeta) {
  return JSON.stringify(
    {
      linkedinProfile,
      webSearch: {
        query: searchMeta.query,
        provider: searchMeta.provider,
        results: searchMeta.results,
      },
    },
    null,
    2,
  );
}
