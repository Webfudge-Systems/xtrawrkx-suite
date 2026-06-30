'use strict';

/**
 * Verify email/password against Firebase Auth (same credentials as landing site).
 * Uses Identity Toolkit REST API — requires FIREBASE_WEB_API_KEY or NEXT_PUBLIC_FIREBASE_API_KEY.
 */
async function verifyFirebasePassword(email, password) {
  const apiKey =
    process.env.FIREBASE_WEB_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return false;

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) return false;

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password: String(password),
          returnSecureToken: false,
        }),
      }
    );

    if (!response.ok) return false;
    const data = await response.json().catch(() => ({}));
    return Boolean(data?.email || data?.localId);
  } catch {
    return false;
  }
}

module.exports = {
  verifyFirebasePassword,
};
