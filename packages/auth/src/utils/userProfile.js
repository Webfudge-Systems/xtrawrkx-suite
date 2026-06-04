/**
 * Normalize Strapi / API user shapes (flat or { attributes }) for UI.
 * @param {object|null|undefined} user
 * @returns {object|null}
 */
export function flattenUser(user) {
  if (!user || typeof user !== 'object') return null
  if (user.attributes && typeof user.attributes === 'object') {
    return { ...user, ...user.attributes }
  }
  return user
}

/**
 * Display name: prefer DB first + last name, then name, username, email local part.
 * @param {object|null|undefined} user
 * @returns {string}
 */
export function resolveUserDisplayName(user) {
  const u = flattenUser(user)
  if (!u) return 'User'
  const fn = (u.firstName != null ? String(u.firstName) : '').trim()
  const ln = (u.lastName != null ? String(u.lastName) : '').trim()
  if (fn || ln) return [fn, ln].filter(Boolean).join(' ')
  if (u.name && String(u.name).trim()) return String(u.name).trim()
  if (u.username && String(u.username).trim()) return String(u.username).trim().split('@')[0]
  if (u.email) return u.email.split('@')[0]
  return 'User'
}

/**
 * Short name for greetings (first name when available).
 * @param {object|null|undefined} user
 * @returns {string}
 */
export function resolveUserGreetingName(user) {
  const u = flattenUser(user)
  if (!u) return 'there'
  const fn = (u.firstName != null ? String(u.firstName) : '').trim()
  if (fn) return fn
  const display = resolveUserDisplayName(user)
  return display.split(/\s+/)[0] || 'there'
}

/**
 * Initials from first/last name when present; otherwise from email local part.
 * @param {object|null|undefined} user
 * @returns {string}
 */
export function resolveUserInitials(user) {
  const u = flattenUser(user)
  if (!u) return 'U'
  const fn = (u.firstName != null ? String(u.firstName) : '').trim()
  const ln = (u.lastName != null ? String(u.lastName) : '').trim()
  if (fn && ln) return (fn.charAt(0) + ln.charAt(0)).toUpperCase()
  if (fn.length >= 2) return fn.slice(0, 2).toUpperCase()
  if (fn.length === 1 && ln) return (fn.charAt(0) + ln.charAt(0)).toUpperCase()
  if (u.email) {
    const local = u.email.split('@')[0] || ''
    if (local.length >= 2) return local.slice(0, 2).toUpperCase()
    return u.email.charAt(0).toUpperCase()
  }
  return 'U'
}

/**
 * Role label for UI (primaryRole, userRoles, or plugin role relation).
 * @param {object|null|undefined} user
 * @returns {string}
 */
export function resolveUserRole(user) {
  const userData = flattenUser(user)
  if (!userData) return 'User'

  if (userData.primaryRole) {
    const roleName =
      typeof userData.primaryRole === 'object'
        ? userData.primaryRole.name ||
          userData.primaryRole.attributes?.name ||
          userData.primaryRole.data?.attributes?.name ||
          userData.primaryRole.data?.name
        : userData.primaryRole
    if (roleName) return roleName
  }

  if (userData.userRoles && Array.isArray(userData.userRoles) && userData.userRoles.length > 0) {
    const firstRole = userData.userRoles[0]
    const roleName =
      typeof firstRole === 'object'
        ? firstRole.name ||
          firstRole.attributes?.name ||
          firstRole.data?.attributes?.name ||
          firstRole.data?.name
        : firstRole
    if (roleName) return roleName
  }

  if (userData.role) {
    const roleName =
      typeof userData.role === 'object'
        ? userData.role.name ||
          userData.role.attributes?.name ||
          userData.role.data?.attributes?.name ||
          userData.role.data?.name ||
          userData.role
        : userData.role
    if (roleName) {
      return roleName
    }
  }

  return 'User'
}
