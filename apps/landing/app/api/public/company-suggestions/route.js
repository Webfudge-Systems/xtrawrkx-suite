import { NextResponse } from "next/server";
import { CMS_CONFIG } from "@/src/config/cms";

const STRAPI_API_URL =
  process.env.NEXT_PUBLIC_STRAPI_API_URL ||
  process.env.STRAPI_API_URL ||
  (process.env.NODE_ENV !== "production"
    ? "http://localhost:1337/api"
    : CMS_CONFIG.STRAPI_API_URL || "http://localhost:1337/api");

const buildBaseUrl = () =>
  STRAPI_API_URL.endsWith("/") ? STRAPI_API_URL.slice(0, -1) : STRAPI_API_URL;

const landingSignupSecret = () =>
  process.env.LANDING_SIGNUP_SECRET ||
  process.env.WEBSITE_SIGNUP_SECRET ||
  "";

const UPSTREAM_PATHS = [
  "/auth/website/similar-companies",
  "/client-accounts/similar-companies",
];

async function fetchSimilarFromStrapi(name, limit) {
  const baseUrl = buildBaseUrl();
  const headers = { Accept: "application/json" };
  const secret = landingSignupSecret();
  if (secret) {
    headers["x-landing-signup-secret"] = secret;
  }

  let lastError = null;

  for (const path of UPSTREAM_PATHS) {
    const url = new URL(`${baseUrl}${path}`);
    url.searchParams.set("name", name);
    url.searchParams.set("limit", limit);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (response.ok) {
      return {
        ok: true,
        data,
      };
    }

    lastError = {
      status: response.status,
      message:
        data?.error?.message ||
        data?.error ||
        `Upstream returned ${response.status}`,
      path,
    };
  }

  return { ok: false, error: lastError };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get("name") || searchParams.get("q") || "").trim();
  const limit = searchParams.get("limit") || "5";

  if (name.length < 2) {
    return NextResponse.json(
      { query: name, matches: [], hasStrongMatch: false, skipped: true },
      { status: 200 }
    );
  }

  try {
    const result = await fetchSimilarFromStrapi(name, limit);

    if (!result.ok) {
      console.error("[company-suggestions]", result.error);
      return NextResponse.json(
        {
          query: name,
          matches: [],
          hasStrongMatch: false,
          degraded: true,
        },
        { status: 200 }
      );
    }

    const data = result.data;
    return NextResponse.json({
      query: data?.query ?? name,
      matches: Array.isArray(data?.matches) ? data.matches : [],
      hasStrongMatch: Boolean(data?.hasStrongMatch),
      hasExactMatch: Boolean(data?.hasExactMatch),
    });
  } catch (error) {
    console.error("[company-suggestions]", error);
    return NextResponse.json(
      {
        query: name,
        matches: [],
        hasStrongMatch: false,
        degraded: true,
      },
      { status: 200 }
    );
  }
}
