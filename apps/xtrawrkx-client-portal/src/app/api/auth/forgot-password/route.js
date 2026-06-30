import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, sendFirebasePasswordResetOobCode } from "@/lib/firebaseAdmin";
import {
  getPasswordResetContinueUrl,
  sendPortalPasswordResetEmail,
} from "@/lib/passwordResetEmail";

const GENERIC_SUCCESS = {
  ok: true,
  message:
    "If an account with that email exists, you will receive password reset instructions shortly.",
};

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email);

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const adminAuth = getFirebaseAdminAuth();
    const continueUrl = getPasswordResetContinueUrl(body.continueUrl);

    if (adminAuth) {
      try {
        const resetLink = await adminAuth.generatePasswordResetLink(email, {
          url: continueUrl,
          handleCodeInApp: true,
        });
        await sendPortalPasswordResetEmail({ email, resetLink });
        return NextResponse.json(GENERIC_SUCCESS);
      } catch (error) {
        const code = error?.code || error?.errorInfo?.code || "";
        if (code === "auth/user-not-found") {
          return NextResponse.json(GENERIC_SUCCESS);
        }
        console.error("Branded password reset email failed:", error);
      }
    }

    try {
      await sendFirebasePasswordResetOobCode(email);
    } catch (error) {
      const message = String(error?.message || "");
      if (message.includes("EMAIL_NOT_FOUND")) {
        return NextResponse.json(GENERIC_SUCCESS);
      }
      console.error("Firebase password reset fallback failed:", error);
    }

    return NextResponse.json(GENERIC_SUCCESS);
  } catch (error) {
    console.error("Forgot password API error:", error);
    return NextResponse.json(
      { error: "Unable to process your request right now. Please try again later." },
      { status: 500 }
    );
  }
}
