import { NextResponse } from "next/server";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/src/config/firebase";

export const runtime = "nodejs";

function corsHeaders() {
  const raw =
    process.env.XTRAWRKX_CLIENT_PORTAL_ORIGIN ||
    process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL ||
    "*";
  return {
    "Access-Control-Allow-Origin": String(raw).replace(/\/$/, ""),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function coerceDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === "function") {
    try {
      return value.toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (typeof value === "string") return value;
  if (value.seconds != null)
    return new Date(Number(value.seconds) * 1000).toISOString();
  return null;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

/**
 * GET /api/public/registrations?email=user@example.com
 *
 * Returns all event_registrations for the given primaryContactEmail.
 * Used by the client portal to populate "My Events".
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "A valid email query parameter is required.", data: [] },
      { status: 400, headers: corsHeaders() }
    );
  }

  try {
    let snapshot;
    try {
      snapshot = await getDocs(
        query(
          collection(db, "event_registrations"),
          where("primaryContactEmail", "==", email),
          orderBy("createdAt", "desc")
        )
      );
    } catch {
      // Fallback if composite index not ready
      snapshot = await getDocs(
        query(
          collection(db, "event_registrations"),
          where("primaryContactEmail", "==", email)
        )
      );
    }

    const registrations = snapshot.docs.map((docSnap) => {
      const d = docSnap.data() || {};
      return {
        registrationId: docSnap.id,
        eventId: d.eventId || "",
        eventTitle: d.eventTitle || "",
        eventDate: coerceDate(d.eventDate) || coerceDate(d.createdAt),
        eventLocation: d.eventLocation || "",
        status: d.status || "pending",
        paymentStatus: d.paymentStatus || "pending",
        registrationType: d.registrationType || "individual",
        companyName: d.companyName || "",
        totalCost: d.totalCost ?? 0,
        isFree: d.isFree ?? false,
        createdAt: coerceDate(d.createdAt),
      };
    });

    return NextResponse.json(
      { data: registrations, meta: { count: registrations.length } },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to load registrations.", data: [] },
      { status: 500, headers: corsHeaders() }
    );
  }
}
