/** Normalize Strapi meta (object or occasional JSON string). */
export function parseActivityMeta(meta) {
  if (meta == null) return null;
  if (typeof meta === 'string') {
    try {
      return JSON.parse(meta);
    } catch {
      return null;
    }
  }
  return typeof meta === 'object' ? meta : null;
}

function actorHasDisplayFields(actor) {
  if (!actor || typeof actor !== 'object') return false;
  const fromName = [actor.firstName, actor.lastName].filter(Boolean).join(' ').trim();
  return Boolean(
    actor.name?.trim() ||
      fromName ||
      actor.username?.trim() ||
      actor.email?.trim() ||
      actor.id != null
  );
}

/**
 * Resolve display actor from a CRM activity / chat row.
 * Client portal comments often store the contact on meta.clientActor with actor null.
 */
export function resolveActivityActor(row) {
  if (!row || typeof row !== 'object') return null;

  const actor = row.actor;
  if (actorHasDisplayFields(actor)) return actor;

  const meta = parseActivityMeta(row.meta);
  const clientActor = meta?.clientActor;
  if (actorHasDisplayFields(clientActor)) return clientActor;

  if (actor && typeof actor === 'object') return actor;
  return null;
}

/** Human-readable sender name for timeline + chat. */
export function activityActorLabel(actor) {
  if (!actor || typeof actor !== 'object') return 'User';
  const fromName = [actor.firstName, actor.lastName].filter(Boolean).join(' ').trim();
  return (
    actor.name?.trim() ||
    fromName ||
    actor.username?.trim() ||
    actor.email?.split('@')[0]?.trim() ||
    (actor.id != null ? `User ${actor.id}` : 'User')
  );
}

export function activityActorInitials(actor) {
  const name = activityActorLabel(actor);
  const parts = name.split(/[\s._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'U';
}
