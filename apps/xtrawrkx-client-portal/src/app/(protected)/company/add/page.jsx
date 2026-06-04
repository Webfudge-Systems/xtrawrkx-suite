"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddCompanyMemberPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/company?add=1");
  }, [router]);

  return null;
}
