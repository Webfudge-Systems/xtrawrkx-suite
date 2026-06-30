import { NextResponse } from "next/server";
import { confirmPasswordResetWithOobCode } from "@/src/lib/firebaseAdmin";
import { syncPortalPasswordToStrapi } from "@/src/lib/strapiWebsiteApi";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const oobCode = String(body.oobCode || "").trim();
    const password = String(body.password || "");

    if (!oobCode) {
      return NextResponse.json({ error: "Reset link is invalid or incomplete." }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const email = await confirmPasswordResetWithOobCode(oobCode, password);

    const strapiSync = email
      ? await syncPortalPasswordToStrapi(email, password)
      : { ok: false, skipped: true };

    return NextResponse.json({
      ok: true,
      email: email || null,
      strapiSync: {
        ok: strapiSync.ok === true,
        skipped: strapiSync.skipped === true,
      },
    });
  } catch (error) {
    console.error("Complete password reset error:", error);
    return NextResponse.json(
      { error: error.message || "Unable to reset your password." },
      { status: 400 }
    );
  }
}
