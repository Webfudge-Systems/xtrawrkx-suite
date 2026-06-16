'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Badge,
  EmptyState,
  LoadingSpinner,
  Select,
  Textarea,
} from '@webfudge/ui';
import {
  COMMUNITY_ENUM_LABELS,
  PENDING_SUBMISSION_STATUSES,
  XEN_MEMBERSHIP_TIERS,
  getXenTierByCode,
} from '@webfudge/utils';
import strapiClient from '../lib/strapiClient';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function ClientAccountCommunitiesPanel({ accountId, canWrite = false }) {
  const [submissions, setSubmissions] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [approveTier, setApproveTier] = useState('X0');

  const load = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const [subRes, memRes] = await Promise.all([
        strapiClient.get('/community-submissions/list-for-client', {
          clientAccountId: accountId,
        }),
        strapiClient.get('/community-memberships/list-for-client', {
          clientAccountId: accountId,
          status: 'ACTIVE',
        }),
      ]);
      setSubmissions(Array.isArray(subRes?.data) ? subRes.data : []);
      setMemberships(Array.isArray(memRes?.data) ? memRes.data : []);
    } catch (e) {
      console.error('Failed to load community data', e);
      setSubmissions([]);
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = submissions.filter((s) => {
    const status = s.attributes?.status || s.status;
    return PENDING_SUBMISSION_STATUSES.includes(status);
  });

  const handleApprove = async (submission) => {
    const attrs = submission.attributes || submission;
    const isXen = attrs.community === 'XEN';
    setActionId(submission.id);
    try {
      await strapiClient.post('/community-submissions/approve', {
        id: submission.id,
        reviewNotes: reviewNotes.trim() || undefined,
        ...(isXen ? { tier: approveTier, membershipType: approveTier === 'X0' ? 'FREE' : 'PREMIUM' } : {}),
      });
      setReviewNotes('');
      await load();
    } catch (e) {
      alert(e.message || 'Approval failed');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (submission) => {
    setActionId(submission.id);
    try {
      await strapiClient.post('/community-submissions/reject', {
        id: submission.id,
        rejectionReason: reviewNotes.trim() || 'Application not approved at this time.',
      });
      setReviewNotes('');
      await load();
    } catch (e) {
      alert(e.message || 'Rejection failed');
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="rounded-xl p-5">
        <h3 className="mb-1 text-lg font-semibold text-gray-900">Active memberships</h3>
        <p className="mb-4 text-sm text-gray-500">
          Clients are onboarded to communities only after CRM approval — not automatically on signup.
        </p>
        {memberships.length === 0 ? (
          <EmptyState title="No active memberships" description="Approve a pending application to activate access." />
        ) : (
          <div className="space-y-3">
            {memberships.map((m) => {
              const attrs = m.attributes || m;
              const community = attrs.community;
              const tierCode = attrs.membershipData?.tier || attrs.membershipData?.selectedTier;
              const tier = community === 'XEN' ? getXenTierByCode(tierCode) : null;
              return (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-gray-900">{COMMUNITY_ENUM_LABELS[community] || community}</p>
                    <p className="text-sm text-gray-500">
                      {attrs.membershipType || 'FREE'}
                      {tier ? ` · ${tier.tier} ${tier.name}` : ''}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card variant="elevated" className="rounded-xl p-5">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Pending applications</h3>
        {pending.length === 0 ? (
          <EmptyState title="No pending applications" description="New community join requests will appear here." />
        ) : (
          <div className="space-y-4">
            {pending.map((submission) => {
              const attrs = submission.attributes || submission;
              const data = attrs.submissionData || {};
              const isXen = attrs.community === 'XEN';
              const requestedTier = data.selectedTier || data.tier;
              return (
                <div key={submission.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {COMMUNITY_ENUM_LABELS[attrs.community] || attrs.community}
                      </p>
                      <p className="text-sm text-gray-600">
                        Submitted {formatDate(attrs.createdAt)}
                        {requestedTier ? ` · Tier ${requestedTier}` : ''}
                      </p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800">{attrs.status}</Badge>
                  </div>
                  {data.whyJoin ? (
                    <p className="mb-2 text-sm text-gray-700">
                      <span className="font-medium">Why join:</span> {data.whyJoin}
                    </p>
                  ) : null}
                  {data.lookingFor ? (
                    <p className="mb-3 text-sm text-gray-700">
                      <span className="font-medium">Looking for:</span> {data.lookingFor}
                    </p>
                  ) : null}
                  {canWrite ? (
                    <div className="space-y-3 border-t border-amber-200/80 pt-3">
                      {isXen ? (
                        <Select
                          label="Approve tier (XEN)"
                          value={approveTier}
                          onChange={setApproveTier}
                          options={XEN_MEMBERSHIP_TIERS.map((t) => ({
                            value: t.tier,
                            label: `${t.tier} — ${t.name} (${t.price12Month}/yr)`,
                          }))}
                        />
                      ) : null}
                      <Textarea
                        label="Review notes"
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={2}
                        placeholder="Optional notes for the client team…"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => handleApprove(submission)}
                          disabled={actionId === submission.id}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(submission)}
                          disabled={actionId === submission.id}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
