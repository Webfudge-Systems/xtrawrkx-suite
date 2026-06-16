"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingSpinner } from "@webfudge/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { PortalPageShell } from "@/components/layout/PortalPageShell";
import CommunityJoinForm from "@/components/communities/CommunityJoinForm";
import { getCommunityById } from "@/data/communitiesCatalog";
import { resolveCommunityJoinDefaults } from "@/lib/communityJoinDefaults";
import {
  isPendingSubmissionStatus,
  listActiveMembershipsForClient,
  listSubmissionsForClient,
} from "@/lib/api/communityProgramService";
import { strapiClient } from "@/lib/strapiClient";

export default function CommunityJoinPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params?.id;
  const community = useMemo(
    () => (communityId != null ? getCommunityById(communityId) : null),
    [communityId]
  );

  const [loading, setLoading] = useState(true);
  const [clientAccountId, setClientAccountId] = useState(null);
  const [accountDefaults, setAccountDefaults] = useState({});
  const [blockedReason, setBlockedReason] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const id = strapiClient.getCurrentAccountId();
      if (!cancelled) {
        setClientAccountId(id);
        setAccountDefaults(resolveCommunityJoinDefaults());
      }

      if (!community?.strapiEnum || !id) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const [memberships, submissions] = await Promise.all([
          listActiveMembershipsForClient(id),
          listSubmissionsForClient(id),
        ]);
        if (cancelled) return;

        const isMember = memberships.some(
          (m) => String(m.community || "").toUpperCase() === community.strapiEnum
        );
        const isPending = submissions.some(
          (s) =>
            String(s.community || "").toUpperCase() === community.strapiEnum &&
            isPendingSubmissionStatus(s.status)
        );

        if (isMember) {
          setBlockedReason("You are already a member of this community.");
        } else if (isPending) {
          setBlockedReason("Your application is already pending review.");
        }
      } catch {
        /* allow form if status check fails */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [community?.strapiEnum]);

  if (!community) {
    return (
      <PortalPageShell>
        <PageHeader
          title="Community not found"
          subtitle="This program may no longer be available."
          showBack
          onBack={() => router.push("/communities")}
        />
      </PortalPageShell>
    );
  }

  return (
    <PortalPageShell>
      <PageHeader
        title={`Join ${community.name}`}
        subtitle="Review and update your registration details, then submit your application for review."
        showBack
        onBack={() => router.push(`/communities/${community.id}`)}
        breadcrumb={[
          { label: "Communities", href: "/communities" },
          { label: community.name, href: `/communities/${community.id}` },
          { label: "Join" },
        ]}
      />

      {loading ? (
        <div className="flex justify-center rounded-xl border border-gray-200 bg-white py-16">
          <LoadingSpinner size="lg" message="Loading registration…" />
        </div>
      ) : blockedReason ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-medium">{blockedReason}</p>
          <button
            type="button"
            onClick={() => router.push(`/communities/${community.id}`)}
            className="mt-3 text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            Back to community
          </button>
        </div>
      ) : (
        <CommunityJoinForm
          community={community}
          clientAccountId={clientAccountId}
          accountDefaults={accountDefaults}
          onSuccess={() => router.push("/communities?tab=pending")}
        />
      )}
    </PortalPageShell>
  );
}
