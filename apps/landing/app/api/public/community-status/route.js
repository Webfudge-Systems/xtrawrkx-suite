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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required to fetch community status." },
        { status: 400 }
      );
    }

    const secret = landingSignupSecret();
    if (!secret && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          error:
            "Community status is not configured. Set LANDING_SIGNUP_SECRET on the marketing site (Vercel) to match Strapi.",
        },
        { status: 503 }
      );
    }

    const headers = { Accept: "application/json" };
    if (secret) {
      headers["x-landing-signup-secret"] = secret;
    }

    const url = `${buildBaseUrl()}/client-accounts/public-community-status?email=${encodeURIComponent(
      email
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data?.error?.message ||
        data?.error ||
        (response.status === 403
          ? "Website signup authentication failed. Ensure LANDING_SIGNUP_SECRET matches on Vercel (landing) and Railway (Strapi)."
          : "Unable to load community status.");

      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to fetch community status." },
      { status: 500 }
    );
  }
}
