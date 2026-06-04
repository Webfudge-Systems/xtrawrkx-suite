import { NextResponse } from "next/server";
import { fetchWebsiteUpstream } from "@/lib/websiteUrl";

export const dynamic = "force-dynamic";

/** Proxy GET /api/public/events from the xtrawrkx marketing site. */
export async function GET() {
  try {
    const upstream = await fetchWebsiteUpstream("/api/public/events");
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Unable to load events.",
        data: [],
      },
      { status: 503 }
    );
  }
}
