import admin from "firebase-admin";

let initialized = false;

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (error) {
      console.error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON:", error.message);
      return null;
    }
  }
  return null;
}

export function getFirebaseAdminAuth() {
  const serviceAccount = getServiceAccount();
  if (!serviceAccount) return null;

  if (!initialized) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    initialized = true;
  }

  return admin.auth();
}

export async function sendFirebasePasswordResetOobCode(email) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("Firebase API key is not configured.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || "Unable to send password reset email.";
    throw new Error(message);
  }

  return data;
}

const FIREBASE_RESET_ERRORS = {
  INVALID_OOB_CODE: "This reset link is invalid or has expired.",
  EXPIRED_OOB_CODE: "This reset link has expired. Request a new one from the sign-in page.",
  WEAK_PASSWORD: "Password must be at least 6 characters long.",
  USER_DISABLED: "This account has been disabled.",
};

export async function confirmPasswordResetWithOobCode(oobCode, newPassword) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("Firebase API key is not configured.");
  }
  if (!oobCode) {
    throw new Error("Reset link is invalid or incomplete.");
  }
  if (!newPassword || String(newPassword).length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oobCode, newPassword }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = data?.error?.message || "UNKNOWN";
    throw new Error(FIREBASE_RESET_ERRORS[code] || "Unable to reset your password.");
  }

  return String(data?.email || "").trim().toLowerCase();
}

export async function verifyPasswordResetOobCode(oobCode) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("Firebase API key is not configured.");
  }
  if (!oobCode) {
    throw new Error("Reset link is invalid or incomplete.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oobCode }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = data?.error?.message || "UNKNOWN";
    throw new Error(FIREBASE_RESET_ERRORS[code] || "This reset link is invalid or has expired.");
  }

  return String(data?.email || "").trim().toLowerCase();
}
