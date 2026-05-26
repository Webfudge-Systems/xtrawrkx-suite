/**
 * Fetches the public event catalog from the xtrawrkx website (Next.js app / Firebase),
 * same source as `client` PastEvents / UpcomingEvents.
 *
 * Also provides fetchUserRegistrations(email) to load "My Events" data.
 */

const websiteBase = () => {
  const raw =
    process.env.NEXT_PUBLIC_XTRAWRKX_WEBSITE_URL ||
    process.env.NEXT_PUBLIC_WEBSITE_URL ||
    "http://localhost:3000";
  return String(raw).replace(/\/$/, "");
};

function inferTicketType(priceStr) {
  const p = String(priceStr || "").trim().toLowerCase();
  if (!p || p === "free" || p === "0" || p === "₹0") return "Free";
  if (p.includes("vip")) return "VIP";
  if (p.includes("premium")) return "Premium";
  return "Standard";
}

/**
 * Map website API row → client-portal EventCard / detail panel shape.
 */
export function mapWebsiteEventToPortalEvent(row) {
  const base = websiteBase();
  const slug = row.slug || row.id;
  const dateIso = row.date || null;
  const dateForCard =
    dateIso && !Number.isNaN(new Date(dateIso).getTime())
      ? dateIso.split("T")[0]
      : new Date().toISOString().split("T")[0];

  const relImage = row.heroImage && String(row.heroImage).trim();
  const image =
    relImage && relImage.startsWith("http")
      ? relImage
      : relImage
        ? `${base}${relImage.startsWith("/") ? relImage : `/${relImage}`}`
        : `${base}/images/hero.png`;

  const price =
    row.price != null && String(row.price).trim() !== ""
      ? String(row.price)
      : "—";

  return {
    id: row.id,
    title: row.title || "Event",
    description: row.description || "",
    date: dateForCard,
    time: row.time && String(row.time).trim() ? row.time : "—",
    location: row.location || row.venue || "—",
    category: row.category || "Event",
    status: String(row.status || "upcoming").toLowerCase(),
    registrationStatus: "not_registered",
    ticketType: inferTicketType(price),
    price,
    capacity: Number(row.capacity) || 0,
    registered: Number(row.registered) || 0,
    image,
    websiteUrl: `${base}/events/${encodeURIComponent(slug)}`,
    registrationDetails: null,
    slug,
    season: row.season || "",
  };
}

export async function fetchWebsiteEventsCatalog() {
  const url = `${websiteBase()}/api/public/events`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      json?.error || json?.message || `Events request failed (${res.status})`;
    throw new Error(msg);
  }

  const rows = Array.isArray(json?.data) ? json.data : [];
  return rows.map(mapWebsiteEventToPortalEvent);
}

/**
 * Fetch registrations for a specific user email from the website API.
 * Returns an array of registration objects.
 */
export async function fetchUserRegistrations(email) {
  if (!email) return [];
  const url = `${websiteBase()}/api/public/registrations?email=${encodeURIComponent(
    email.trim().toLowerCase()
  )}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch the event catalog AND merge the user's registration status into each event.
 * Pass the logged-in user's email to populate "My Events" correctly.
 */
export async function fetchWebsiteEventsCatalogWithRegistrations(email) {
  const [events, registrations] = await Promise.all([
    fetchWebsiteEventsCatalog(),
    fetchUserRegistrations(email),
  ]);

  if (!registrations.length) return events;

  // Build a lookup: eventId → registration
  const regByEventId = {};
  for (const reg of registrations) {
    if (reg.eventId) {
      regByEventId[reg.eventId] = reg;
    }
  }

  return events.map((ev) => {
    const reg = regByEventId[ev.id] || regByEventId[ev.slug];
    if (!reg) return ev;

    const registrationStatus =
      reg.status === "confirmed"
        ? "confirmed"
        : reg.status === "attended"
        ? "attended"
        : "pending";

    return {
      ...ev,
      registrationStatus,
      registrationDetails: {
        registrationId: reg.registrationId,
        status: reg.status,
        paymentStatus: reg.paymentStatus,
        companyName: reg.companyName,
        totalCost: reg.totalCost,
        isFree: reg.isFree,
        registeredAt: reg.createdAt,
        registrationType: reg.registrationType,
      },
    };
  });
}
