/**
 * Build a URL-safe slug from a project name (unique suffix avoids collisions).
 */
export function buildProjectSlug(name) {
  const base =
    String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "project";
  return `${base}-${Date.now()}`;
}
