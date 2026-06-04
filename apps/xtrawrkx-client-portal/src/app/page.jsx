"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      router.replace("/dashboard");
      return;
    }

    router.replace("/auth");
  }, [status, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4A74] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </main>
  );
}
