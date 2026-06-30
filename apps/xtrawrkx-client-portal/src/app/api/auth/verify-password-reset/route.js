import { NextResponse } from "next/server";
import { verifyPasswordResetOobCode } from "@/lib/firebaseAdmin";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const oobCode = String(body.oobCode || "").trim();

    if (!oobCode) {
      return NextResponse.json({ error: "Reset link is invalid or incomplete." }, { status: 400 });
    }

    const email = await verifyPasswordResetOobCode(oobCode);
    return NextResponse.json({ ok: true, email });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }
}
