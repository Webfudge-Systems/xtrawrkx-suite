import { convertToDate } from "./dateUtils";

/**
 * End of calendar day (local) for a date-only deadline.
 */
export function endOfRegistrationDeadlineDay(deadline) {
  const date = convertToDate(deadline);
  if (!date || Number.isNaN(date.getTime())) return null;
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Whether public registration is still open for an event document.
 */
export function isRegistrationOpen(event) {
  if (!event) return false;

  if (event.registrationEnabled === false) return false;

  const status = String(event.status || "").toLowerCase();
  if (status === "cancelled" || status === "completed") return false;

  if (!event.registrationDeadline) return true;

  const end = endOfRegistrationDeadlineDay(event.registrationDeadline);
  if (!end) return true;

  return Date.now() <= end.getTime();
}

export function getRegistrationClosedReason(event) {
  if (!event) return "Registration is not available for this event.";

  if (event.registrationEnabled === false) {
    return "Registration has been disabled for this event.";
  }

  const status = String(event.status || "").toLowerCase();
  if (status === "cancelled") {
    return "This event was cancelled. Registration is closed.";
  }
  if (status === "completed") {
    return "This event has ended. Registration is closed.";
  }

  if (event.registrationDeadline && !isRegistrationOpen(event)) {
    const formatted = formatRegistrationDeadline(event.registrationDeadline);
    return formatted
      ? `Registration closed on ${formatted}.`
      : "The registration deadline has passed.";
  }

  return "Registration is closed for this event.";
}

export function formatRegistrationDeadline(deadline) {
  const date = convertToDate(deadline);
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** `YYYY-MM-DD` for `<input type="date" />` */
export function toDateInputValue(value) {
  const date = convertToDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse admin date input to Firestore-friendly Date (end of selected day). */
export function parseRegistrationDeadlineInput(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  const parsed = new Date(`${trimmed}T23:59:59`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
