const EMPTY_RESULT = {
  query: "",
  matches: [],
  hasStrongMatch: false,
};

export async function fetchSimilarCompanies(name, { limit = 5, signal } = {}) {
  const query = typeof name === "string" ? name.trim() : "";
  if (query.length < 2) {
    return { ...EMPTY_RESULT, query };
  }

  const params = new URLSearchParams({
    name: query,
    limit: String(limit),
  });

  const response = await fetch(`/api/public/company-suggestions?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      query,
      matches: [],
      hasStrongMatch: false,
      degraded: Boolean(data?.degraded),
    };
  }

  return {
    query: data?.query ?? query,
    matches: Array.isArray(data?.matches) ? data.matches : [],
    hasStrongMatch: Boolean(data?.hasStrongMatch),
    hasExactMatch: Boolean(data?.hasExactMatch),
  };
}
