// Simple client-side export helpers for the portal.
// Intentionally lightweight (no dependencies) so it works in Next.js client components.

const escapeCsvCell = (value) => {
  if (value === null || value === undefined) return "";

  let str;
  if (typeof value === "string") str = value;
  else if (typeof value === "number" || typeof value === "boolean") str = String(value);
  else str = JSON.stringify(value);

  // Normalize newlines (keep CSV valid)
  str = str.replace(/\r?\n/g, " ");

  // CSV escaping: quote if it contains comma, quote, or newline; double quotes inside.
  const needsQuoting = /[",]/.test(str);
  if (needsQuoting) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

export const exportItemsToCSV = (items, { filename = "export.csv", columns } = {}) => {
  if (typeof window === "undefined") return;

  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) {
    window.alert("No data available to export.");
    return;
  }

  const sample = columns
    ? list
    : // Cap the amount of data we inspect for columns to keep it snappy.
      list.slice(0, 500);

  const resolvedColumns =
    columns && Array.isArray(columns)
      ? columns
      : Array.from(
          new Set(
            sample.flatMap((item) => (item && typeof item === "object" ? Object.keys(item) : []))
          )
        );

  const headerRow = resolvedColumns.map(escapeCsvCell).join(",");
  const rows = list.map((item) =>
    resolvedColumns.map((key) => escapeCsvCell(item?.[key])).join(",")
  );

  const csv = [headerRow, ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};

