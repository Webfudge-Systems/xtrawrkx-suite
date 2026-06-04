import { NextResponse } from "next/server";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/src/config/firebase";

/** Firestore client SDK requires Node (not Edge). */
export const runtime = "nodejs";

function corsHeaders() {
  const raw =
    process.env.XTRAWRKX_CLIENT_PORTAL_ORIGIN ||
    process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL ||
    "*";
  const origin = String(raw).replace(/\/$/, "");
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function coerceDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (value.seconds != null) {
    return new Date(Number(value.seconds) * 1000);
  }
  return null;
}

function serializeEventDoc(docSnap) {
  const data = docSnap.data() || {};
  const dateObj = coerceDate(data.date);
  const dateIso =
    dateObj && !Number.isNaN(dateObj.getTime()) ? dateObj.toISOString() : null;

  const statusRaw = String(data.status || "").toLowerCase();
  const status =
    statusRaw === "completed"
      ? "completed"
      : statusRaw === "upcoming"
        ? "upcoming"
        : statusRaw || "upcoming";

  return {
    id: docSnap.id,
    slug: data.slug || docSnap.id,
    title: data.title || "Untitled",
    description: String(data.description || data.shortDescription || "").slice(
      0,
      4000
    ),
    category: data.category || "Event",
    location: data.location || "",
    venue: data.venue || "",
    time: data.time || "",
    status,
    date: dateIso,
    heroImage: data.heroImage || data.background || "",
    price:
      data.price != null && data.price !== ""
        ? String(data.price)
        : "",
    capacity: Number(data.capacity) || 0,
    registered:
      Number(data.registered ?? data.attendees ?? data.registrationCount) || 0,
    season: data.season || "",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

/**
 * Public catalog of events (same Firestore `events` collection as the xtrawrkx website).
 * Used by the client portal and other first-party apps.
 */
export async function GET() {
  try {
    let snapshot;
    try {
      snapshot = await getDocs(
        query(collection(db, "events"), orderBy("date", "desc"))
      );
    } catch {
      snapshot = await getDocs(collection(db, "events"));
    }

    let items = snapshot.docs.map(serializeEventDoc);
    items.sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return tb - ta;
    });

    return NextResponse.json(
      { data: items, meta: { count: items.length } },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Unable to load events.",
        data: [],
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
