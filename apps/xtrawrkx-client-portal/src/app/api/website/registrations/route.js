import { NextResponse } from "next/server";
import { fetchWebsiteUpstream } from "@/lib/websiteUrl";

export const dynamic = "force-dynamic";

/** Proxy GET /api/public/registrations from the xtrawrkx marketing site. */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "A valid email query parameter is required.", data: [] },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetchWebsiteUpstream(
      `/api/public/registrations?email=${encodeURIComponent(email)}`
    );
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
