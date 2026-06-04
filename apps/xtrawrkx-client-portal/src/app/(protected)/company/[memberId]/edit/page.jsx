"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditCompanyMemberPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params?.memberId;

  useEffect(() => {
    if (memberId) {
      router.replace(`/company?edit=${memberId}`);
    } else {
      router.replace("/company");
    }
  }, [router, memberId]);

  return null;
}
