import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

function ResetPasswordFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
      Loading...
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
