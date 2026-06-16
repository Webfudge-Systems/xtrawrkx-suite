"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Globe,
  Layers,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  SendHorizontal,
  User,
  Users,
  FileText,
} from "lucide-react";
import { Button, Input, Textarea, FormSectionCard, Select } from "@webfudge/ui";
import {
  XEN_MEMBERSHIP_TIERS,
  canonicalCompanyTypeValue,
  companyTypeSelectOptions,
  getLeadSubTypeSelectOptions,
} from "@webfudge/utils";
import { joinCommunityWithRequirements } from "@/lib/api/communityProgramService";
import {
  emptyCommunityJoinDefaults,
  resolveCommunityJoinDefaults,
} from "@/lib/communityJoinDefaults";

const SECTION_CARD_CLASS =
  "rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6";

const initialCommunityQuestions = {
  lookingFor: "",
  whyJoin: "",
  selectedTier: "X0",
};

export default function CommunityJoinForm({
  community,
  clientAccountId,
  accountDefaults,
  onSuccess,
  onCancel,
}) {
  const router = useRouter();
  const [details, setDetails] = useState(emptyCommunityJoinDefaults);
  const [form, setForm] = useState(initialCommunityQuestions);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    setForm(initialCommunityQuestions);
    const resolved = {
      ...emptyCommunityJoinDefaults(),
      ...(accountDefaults && Object.keys(accountDefaults).length
        ? accountDefaults
        : resolveCommunityJoinDefaults()),
    };
    resolved.companyType = canonicalCompanyTypeValue(resolved.companyType);
    setDetails(resolved);
  }, [community?.id, accountDefaults]);

  const companySubTypeOptions = useMemo(
    () => getLeadSubTypeSelectOptions(details.companyType, details.companySubType),
    [details.companyType, details.companySubType]
  );

  const setField = (field, value) => {
    setDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompanyTypeChange = (value) => {
    setDetails((prev) => ({
      ...prev,
      companyType: value,
      companySubType: "",
    }));
  };

  const setQuestion = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    router.push(community?.id ? `/communities/${community.id}` : "/communities");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!community?.strapiEnum) {
      setError("Community details are missing. Please go back and try again.");
      return;
    }
    if (!clientAccountId) {
      setError("Missing client account. Please sign out and sign in again.");
      return;
    }
    if (!form.lookingFor.trim() || !form.whyJoin.trim()) {
      setError("Please complete the two required community questions.");
      return;
    }

    const requirements = {
      ...details,
      lookingFor: form.lookingFor.trim(),
      whyJoin: form.whyJoin.trim(),
      communityName: community.name,
      communityEnum: community.strapiEnum,
      submittedAt: new Date().toISOString(),
      ...(community.strapiEnum === "XEN"
        ? {
            selectedTier: form.selectedTier,
            tier: form.selectedTier,
            tierName:
              XEN_MEMBERSHIP_TIERS.find((t) => t.tier === form.selectedTier)?.name ||
              form.selectedTier,
          }
        : {}),
    };

    setSubmitting(true);
    try {
      await joinCommunityWithRequirements({
        clientAccountId,
        communityEnum: community.strapiEnum,
        requirements,
      });
      if (onSuccess) {
        onSuccess(community);
      } else {
        router.push(`/communities?tab=pending`);
      }
    } catch (err) {
      setError(err.message || "Unable to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-5 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
            <div>
              <h4 className="mb-1 text-lg font-semibold text-red-900">
                Unable to submit application
              </h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : null}

      <FormSectionCard
        icon={Building2}
        title="Company information"
        description="Business identity and organization details"
        cardClassName={SECTION_CARD_CLASS}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Input
              label="Company name"
              value={details.company}
              onChange={(e) => setField("company", e.target.value)}
              placeholder="Enter company name"
              icon={Building2}
            />
          </div>
          <div>
            <Select
              label="Company type"
              value={details.companyType}
              onChange={handleCompanyTypeChange}
              options={companyTypeSelectOptions}
              placeholder="Select company type"
              icon={Layers}
            />
          </div>
          <div>
            <Select
              label="Sub-type"
              value={details.companySubType}
              onChange={(value) => setField("companySubType", value)}
              options={companySubTypeOptions}
              placeholder={
                details.companyType ? "Select sub-type" : "Select company type first"
              }
              disabled={!details.companyType}
              searchable
            />
          </div>
          <div>
            <Input
              label="Website"
              type="url"
              value={details.website}
              onChange={(e) => setField("website", e.target.value)}
              placeholder="https://company.com"
              icon={Globe}
            />
          </div>
          <div>
            <Input
              label="Company phone"
              type="tel"
              value={details.companyPhone}
              onChange={(e) => setField("companyPhone", e.target.value)}
              placeholder="+1 (555) 123-4567"
              icon={Phone}
            />
          </div>
          <div>
            <Input
              label="Company email"
              type="email"
              value={details.companyEmail}
              onChange={(e) => setField("companyEmail", e.target.value)}
              placeholder="contact@company.com"
              icon={Mail}
            />
          </div>
          <div className="lg:col-span-3">
            <Textarea
              label="Company description"
              rows={3}
              value={details.companyDescription}
              onChange={(e) => setField("companyDescription", e.target.value)}
              placeholder="Brief overview of your company"
            />
          </div>
        </div>
      </FormSectionCard>

      <FormSectionCard
        icon={User}
        title="Contact information"
        description="Your role and direct contact details"
        cardClassName={SECTION_CARD_CLASS}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Input
              label="Full name"
              value={details.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              placeholder="Your full name"
              icon={User}
            />
          </div>
          <div>
            <Input
              label="Role / title"
              value={details.jobTitle}
              onChange={(e) => setField("jobTitle", e.target.value)}
              placeholder="CEO, Founder, etc."
              icon={User}
            />
          </div>
          <div>
            <Input
              label="Phone"
              type="tel"
              value={details.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="+1 (555) 123-4567"
              icon={Phone}
            />
          </div>
          <div className="lg:col-span-2">
            <Input
              label="Address line 1"
              value={details.addressLine1}
              onChange={(e) => setField("addressLine1", e.target.value)}
              placeholder="Street address"
              icon={MapPin}
            />
          </div>
          <div>
            <Input
              label="Address line 2"
              value={details.addressLine2}
              onChange={(e) => setField("addressLine2", e.target.value)}
              placeholder="Suite, floor, etc."
            />
          </div>
          <div>
            <Input
              label="City"
              value={details.city}
              onChange={(e) => setField("city", e.target.value)}
              placeholder="City"
            />
          </div>
          <div>
            <Input
              label="State / province"
              value={details.state}
              onChange={(e) => setField("state", e.target.value)}
              placeholder="State or province"
            />
          </div>
          <div>
            <Input
              label="Country"
              value={details.country}
              onChange={(e) => setField("country", e.target.value)}
              placeholder="Country"
            />
          </div>
          <div>
            <Input
              label="Postal code"
              value={details.postalCode}
              onChange={(e) => setField("postalCode", e.target.value)}
              placeholder="ZIP / postal code"
            />
          </div>
        </div>
      </FormSectionCard>

      <FormSectionCard
        icon={Globe}
        title="Online presence & profile"
        description="Social links and background information"
        cardClassName={SECTION_CARD_CLASS}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Input
              label="LinkedIn"
              value={details.linkedin}
              onChange={(e) => setField("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/..."
              icon={Linkedin}
            />
          </div>
          <div>
            <Input
              label="X / Twitter"
              value={details.xProfile}
              onChange={(e) => setField("xProfile", e.target.value)}
              placeholder="https://x.com/..."
              icon={Globe}
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Interests"
              value={details.interests}
              onChange={(e) => setField("interests", e.target.value)}
              placeholder="Areas of interest"
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="Registration looking for"
              rows={2}
              value={details.registrationLookingFor}
              onChange={(e) => setField("registrationLookingFor", e.target.value)}
              placeholder="What you hope to gain from the network"
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="Bio"
              rows={3}
              value={details.bio}
              onChange={(e) => setField("bio", e.target.value)}
              placeholder="Short professional bio"
            />
          </div>
        </div>
      </FormSectionCard>

      {community?.strapiEnum === "XEN" ? (
        <FormSectionCard
          icon={Users}
          title="XEN membership tier"
          description="Choose your preferred tier. Paid tiers include advisory hours — final approval and billing are confirmed by your account manager."
          cardClassName={SECTION_CARD_CLASS}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {XEN_MEMBERSHIP_TIERS.map((tier) => {
              const selected = form.selectedTier === tier.tier;
              return (
                <label
                  key={tier.tier}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    selected
                      ? "border-orange-400 bg-gradient-to-br from-orange-50 to-white shadow-md ring-2 ring-orange-200"
                      : "border-gray-200 bg-white/80 hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <input
                    type="radio"
                    name="selectedTier"
                    value={tier.tier}
                    checked={selected}
                    onChange={(e) => setQuestion("selectedTier", e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected
                          ? "border-orange-500 bg-orange-500"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {selected ? (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">
                        {tier.tier}{" "}
                        <span className="font-medium text-gray-600">— {tier.name}</span>
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {tier.price12Month}/yr · {tier.totalHours} hrs/mo
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </FormSectionCard>
      ) : null}

      <FormSectionCard
        icon={FileText}
        title="Community application"
        description={`Tell us why you want to join ${community?.name || "this community"}`}
        cardClassName={SECTION_CARD_CLASS}
      >
        <div className="space-y-6">
          <Textarea
            label="What are you looking for in this community? *"
            required
            rows={3}
            value={form.lookingFor}
            onChange={(e) => setQuestion("lookingFor", e.target.value)}
            placeholder="Networking, hiring, funding, partnerships…"
          />
          <Textarea
            label={`Why do you want to join ${community?.name || "this community"}? *`}
            required
            rows={4}
            value={form.whyJoin}
            onChange={(e) => setQuestion("whyJoin", e.target.value)}
            placeholder="Share your goals and how this community fits"
          />
        </div>
      </FormSectionCard>

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={submitting}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="flex min-w-[180px] items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />
              Submitting…
            </>
          ) : (
            <>
              <SendHorizontal className="h-4 w-4" />
              Submit application
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
