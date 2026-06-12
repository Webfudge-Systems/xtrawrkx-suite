/**
 * Labels and Select options for assignee / owner pickers (CRM, PM).
 * Prefers first + last name; appends email only when multiple users share the same name.
 */

function trimStr(value) {
  return value != null ? String(value).trim() : '';
}

/**
 * @param {object | null | undefined} user
 * @returns {string}
 */
export function userSelectLabel(user) {
  if (!user || typeof user !== 'object') return 'Unknown';

  const fn = trimStr(user.firstName || user.firstname);
  const ln = trimStr(user.lastName || user.lastname);
  const full = [fn, ln].filter(Boolean).join(' ').trim();
  if (full) return full;

  const name = trimStr(user.name);
  if (name) return name;

  const username = trimStr(user.username);
  if (username && !username.includes('@')) return username;

  const email = trimStr(user.email);
  if (email) {
    const local = email.split('@')[0]?.trim();
    if (local) return local;
  }

  if (user.id != null) return `User ${user.id}`;
  return 'Unknown';
}

/**
 * @param {object[]} users
 * @param {{ includeUnassigned?: boolean, unassignedLabel?: string, sort?: boolean }} [options]
 * @returns {{ value: string, label: string }[]}
 */
export function buildUserSelectOptions(users, options = {}) {
  const {
    includeUnassigned = true,
    unassignedLabel = 'Unassigned',
    sort = true,
  } = options;

  const list = (Array.isArray(users) ? users : []).filter((u) => u?.id != null);
  const baseLabels = list.map((u) => userSelectLabel(u));
  const labelCounts = baseLabels.reduce((acc, label) => {
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  let rows = list.map((u) => {
    const base = userSelectLabel(u);
    const email = trimStr(u.email);
    const label =
      labelCounts[base] > 1 && email ? `${base} (${email})` : base;
    return { value: String(u.id), label };
  });

  if (sort) {
    rows = rows.sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    );
  }

  if (includeUnassigned) {
    return [{ value: '', label: unassignedLabel }, ...rows];
  }
  return rows;
}
