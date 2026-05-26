"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { joinCommunityWithRequirements } from "@/lib/api/communityProgramService";

const initialForm = {
  lookingFor: "",
  whyJoin: "",
};

export default function CommunityJoinRequirementsModal({
  isOpen,
  onClose,
  community,
  clientAccountId,
  accountDefaults = {},
  onSuccess,
}) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingDetails, setEditingDetails] = useState(false);
  const [details, setDetails] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setEditingDetails(false);
    setForm(initialForm);
    setDetails({
      company: accountDefaults.company || "",
      companyEmail: accountDefaults.companyEmail || "",
      jobTitle: accountDefaults.jobTitle || "",
      phone: accountDefaults.phone || "",
      companyPhone: accountDefaults.companyPhone || "",
      industry: accountDefaults.industry || "",
      website: accountDefaults.website || "",
      companyType: accountDefaults.companyType || "",
      companySubType: accountDefaults.companySubType || "",
      companyDescription: accountDefaults.companyDescription || "",
      addressLine1: accountDefaults.addressLine1 || "",
      addressLine2: accountDefaults.addressLine2 || "",
      city: accountDefaults.city || "",
      state: accountDefaults.state || "",
      country: accountDefaults.country || "",
      postalCode: accountDefaults.postalCode || "",
      linkedin: accountDefaults.linkedin || "",
      xProfile: accountDefaults.xProfile || "",
      interests: accountDefaults.interests || "",
      registrationLookingFor: accountDefaults.registrationLookingFor || "",
      bio: accountDefaults.bio || "",
    });
  }, [isOpen, accountDefaults]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  const readOnlyRows = useMemo(
    () => [
      ["Company", details.company || "Not provided"],
      ["Company email", details.companyEmail || "Not provided"],
      ["Role / title", details.jobTitle || "Not provided"],
      ["Phone", details.phone || "Not provided"],
      ["Company phone", details.companyPhone || "Not provided"],
      ["Industry", details.industry || "Not provided"],
      ["Website", details.website || "Not provided"],
      ["Company type", details.companyType || "Not specified"],
      ["Sub-type", details.companySubType || "Not specified"],
      ["Company description", details.companyDescription || "Not provided"],
      ["Address line 1", details.addressLine1 || "Not provided"],
      ["Address line 2", details.addressLine2 || "Not provided"],
      ["City", details.city || "Not provided"],
      ["State / region", details.state || "Not provided"],
      ["Country", details.country || "Not provided"],
      ["Postal code", details.postalCode || "Not provided"],
      ["Address", [details.addressLine1, details.addressLine2, details.city, details.state, details.country, details.postalCode].filter(Boolean).join(", ") || "Not provided"],
      ["LinkedIn", details.linkedin || "Not provided"],
      ["X / Twitter", details.xProfile || "Not provided"],
      ["Interests", details.interests || "Not provided"],
      ["Registration looking for", details.registrationLookingFor || "Not provided"],
      ["Bio", details.bio || "Not provided"],
    ],
    [details]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!community?.strapiEnum) {
      setError("Community details are missing. Please close and try again.");
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
    };

    setSubmitting(true);
    try {
      await joinCommunityWithRequirements({
        clientAccountId,
        communityEnum: community.strapiEnum,
        requirements,
      });
      onSuccess?.(community);
      onClose();
    } catch (err) {
      setError(err.message || "Unable to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Join ${community?.name || "Community"}`}
      size="lg"
    >
      <p className="text-sm text-gray-600 mb-4">
        Your registration details are prefilled from onboarding. Review them
        before applying; only the two community-specific answers are required.
        Your account manager will review the application before membership is
        activated.
      </p>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">
              Client document details
            </h4>
            <button
              type="button"
              onClick={() => setEditingDetails((prev) => !prev)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white"
            >
              {editingDetails ? "Lock details" : "Edit details"}
            </button>
          </div>

          {editingDetails ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input name="company" value={details.company} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Company" />
              <input name="companyEmail" value={details.companyEmail} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Company email" />
              <input name="jobTitle" value={details.jobTitle} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Role / title" />
              <input name="phone" value={details.phone} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Phone" />
              <input name="companyPhone" value={details.companyPhone} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Company phone" />
              <input name="industry" value={details.industry} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Industry" />
              <input name="companyType" value={details.companyType} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Company type" />
              <input name="companySubType" value={details.companySubType} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Sub-type" />
              <input name="website" value={details.website} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" placeholder="Website" />
              <textarea name="companyDescription" value={details.companyDescription} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" placeholder="Company description" rows={2} />
              <input name="addressLine1" value={details.addressLine1} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" placeholder="Address line 1" />
              <input name="addressLine2" value={details.addressLine2} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" placeholder="Address line 2" />
              <input name="city" value={details.city} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="City" />
              <input name="state" value={details.state} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="State / region" />
              <input name="country" value={details.country} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Country" />
              <input name="postalCode" value={details.postalCode} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Postal code" />
              <input name="linkedin" value={details.linkedin} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="LinkedIn" />
              <input name="xProfile" value={details.xProfile} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="X / Twitter" />
              <input name="interests" value={details.interests} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" placeholder="Interests" />
              <textarea name="registrationLookingFor" value={details.registrationLookingFor} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" placeholder="Registration looking for" rows={2} />
              <textarea name="bio" value={details.bio} onChange={handleDetailsChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" placeholder="Bio" rows={2} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {readOnlyRows.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
                  <p className="text-sm text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What are you looking for in this community?{" "}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            name="lookingFor"
            value={form.lookingFor}
            onChange={handleChange}
            rows={2}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Networking, hiring, funding, partnerships…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Why do you want to join {community?.name || "this community"}?{" "}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            name="whyJoin"
            value={form.whyJoin}
            onChange={handleChange}
            rows={3}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-xtrawrkx-500 text-white hover:bg-xtrawrkx-600 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
