"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Card,
  Button,
  InfoRow,
  InfoSection,
  Input,
  ProgressBar,
  Textarea,
} from "@webfudge/ui";
import {
  Building2,
  Briefcase,
  Globe,
  Link as LinkIcon,
  MapPin,
  MessageSquare,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PortalPageHeader";
import { PortalPageShell } from "@/components/layout/PortalPageShell";
import { Badge } from "@webfudge/ui";
import { resolveCommunityJoinDefaults } from "@/lib/communityJoinDefaults";
import { updateSettingsProfile } from "@/lib/api/settingsService";
import { useRouter } from "next/navigation";

function formatValue(value) {
  if (value === null || value === undefined) return "—";
  const str = String(value).trim();
  return str ? str : "—";
}

function getPrimaryContact(contacts = []) {
  return (
    contacts.find((c) => c?.isPrimaryContact) ||
    contacts.find((c) => c?.contactRole === "PRIMARY_CONTACT") ||
    contacts[0] ||
    null
  );
}

function getContactFullName(contact) {
  if (!contact) return "";
  const first = String(contact.firstName || "").trim();
  const last = String(contact.lastName || "").trim();
  const fromParts = `${first} ${last}`.trim();
  return fromParts || String(contact.name || "").trim();
}

function hasText(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

function computeProfileCompletion(values) {
  const requiredKeys = [
    "fullName",
    "email",
    "phone",
    "jobTitle",
    "bio",
    "company",
    "industry",
    "companyEmail",
    "companyPhone",
    "website",
    "companyType",
    "companySubType",
    "companyDescription",
    "addressLine1",
    "city",
    "state",
    "country",
  ];

  const filled = requiredKeys.reduce(
    (acc, key) => acc + (hasText(values?.[key]) ? 1 : 0),
    0
  );
  return Math.round((filled / requiredKeys.length) * 100);
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    try {
      const rawAccount = localStorage.getItem("client_account");
      const rawContacts = localStorage.getItem("client_contacts");

      const parsedAccount = rawAccount ? JSON.parse(rawAccount) : null;
      const parsedContacts = rawContacts ? JSON.parse(rawContacts) : [];

      if (!cancelled) {
        setAccount(parsedAccount);
        setContacts(Array.isArray(parsedContacts) ? parsedContacts : []);
        setLoading(false);
      }
    } catch (e) {
      if (!cancelled) {
        console.error("Failed to load profile details:", e);
        setLoading(false);
      }
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const defaults = useMemo(() => {
    if (!account) return null;
    try {
      return resolveCommunityJoinDefaults(account);
    } catch {
      return null;
    }
  }, [account]);

  const primaryContact = useMemo(
    () => getPrimaryContact(contacts),
    [contacts]
  );

  const personalEmail = primaryContact?.email || account?.email || "";
  const personalPhone =
    primaryContact?.phone || defaults?.phone || account?.phone || "";

  const fullAddress = useMemo(() => {
    if (!defaults) return "—";
    const parts = [
      defaults.addressLine1,
      defaults.addressLine2,
      defaults.city,
      defaults.state,
      defaults.postalCode,
      defaults.country,
    ]
      .map((p) => (p === null || p === undefined ? "" : String(p).trim()))
      .filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  }, [defaults]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldEdit = sessionStorage.getItem("portal_profile_edit") === "1";
    if (!shouldEdit) return;
    sessionStorage.removeItem("portal_profile_edit");
    setEditMode(true);
  }, []);

  const completionModel = useMemo(() => {
    if (!defaults) return null;
    return {
      fullName: defaults?.fullName || getContactFullName(primaryContact) || "",
      email: personalEmail || "",
      phone: personalPhone || "",
      jobTitle: defaults?.jobTitle || "",
      bio: defaults?.bio || "",
      company: defaults?.company || "",
      industry: account?.industry || "",
      companyEmail: defaults?.companyEmail || "",
      companyPhone: defaults?.companyPhone || "",
      website: defaults?.website || "",
      companyType: defaults?.companyType || "",
      companySubType: defaults?.companySubType || "",
      companyDescription: defaults?.companyDescription || "",
      addressLine1: defaults?.addressLine1 || "",
      city: defaults?.city || "",
      state: defaults?.state || "",
      country: defaults?.country || "",
    };
  }, [defaults, primaryContact, personalEmail, personalPhone, account]);

  const completionPercent = computeProfileCompletion(
    editMode && draft ? draft : completionModel
  );

  useEffect(() => {
    if (!editMode) return;
    if (!defaults || !account) return;

    const nextDraft = {
      fullName: defaults?.fullName || getContactFullName(primaryContact) || "",
      email: personalEmail || "",
      phone: personalPhone || "",
      jobTitle: defaults?.jobTitle || "",
      bio: defaults?.bio || "",
      company: defaults?.company || account?.companyName || "",
      industry: account?.industry || "",
      companyEmail: defaults?.companyEmail || "",
      companyPhone: defaults?.companyPhone || "",
      website: defaults?.website || "",
      companyType: defaults?.companyType || "",
      companySubType: defaults?.companySubType || "",
      companyDescription: defaults?.companyDescription || "",
      addressLine1: defaults?.addressLine1 || "",
      addressLine2: defaults?.addressLine2 || "",
      city: defaults?.city || "",
      state: defaults?.state || "",
      postalCode: defaults?.postalCode || "",
      country: defaults?.country || "",
      linkedin: defaults?.linkedin || "",
      xProfile: defaults?.xProfile || "",
      interests: defaults?.interests || "",
      registrationLookingFor: defaults?.registrationLookingFor || "",
    };
    setDraft(nextDraft);
  }, [editMode, defaults, account, primaryContact, personalEmail, personalPhone]);

  const handleCancelEdit = () => {
    setEditMode(false);
    setDraft(null);
  };

  const handleInlineDraftChange = (key, value) => {
    setDraft((prev) => ({ ...(prev || {}), [key]: value }));
  };

  const handleSaveEdit = async () => {
    if (!draft || !account) return;
    setSaving(true);
    try {
      const primary = getPrimaryContact(contacts);
      const nameParts = String(draft.fullName || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const nextFirstName = nameParts[0] || "";
      const nextLastName = nameParts.slice(1).join(" ");

      const nextContacts = (contacts || []).map((c) => {
        if (!primary || c.id !== primary.id) return c;
        return {
          ...c,
          firstName: nextFirstName,
          lastName: nextLastName,
          phone: draft.phone || c.phone,
          jobTitle: draft.jobTitle || c.jobTitle,
        };
      });

      const nextAccount = { ...(account || {}) };

      const existingOnboarding =
        nextAccount.onboardingData &&
        typeof nextAccount.onboardingData === "object"
          ? { ...nextAccount.onboardingData }
          : nextAccount.attributes?.onboardingData &&
              typeof nextAccount.attributes.onboardingData === "object"
            ? { ...nextAccount.attributes.onboardingData }
            : {};

      const onboardingData = {
        ...existingOnboarding,
        bio: draft.bio,
        phone: draft.phone,
        jobTitle: draft.jobTitle,
        company: draft.company,
        companyName: draft.company,
        signupCompany: draft.company,
        companyEmail: draft.companyEmail,
        companyPhone: draft.companyPhone,
        website: draft.website,
        companyType: draft.companyType,
        companySubType: draft.companySubType,
        companyDescription: draft.companyDescription,
        linkedin: draft.linkedin,
        xProfile: draft.xProfile,
        interests: draft.interests,
        lookingFor: draft.registrationLookingFor,
        addressLine1: draft.addressLine1,
        addressLine2: draft.addressLine2,
        city: draft.city,
        state: draft.state,
        postalCode: draft.postalCode,
        country: draft.country,
      };

      // Preserve existing preferences if present
      onboardingData.preferences = existingOnboarding.preferences || {};

      if (nextAccount.attributes && typeof nextAccount.attributes === "object") {
        nextAccount.attributes = {
          ...nextAccount.attributes,
          onboardingData,
        };
      } else {
        nextAccount.onboardingData = onboardingData;
      }

      nextAccount.industry = draft.industry;
      nextAccount.phone = draft.phone;
      nextAccount.companyName = draft.company;

      if (typeof window !== "undefined") {
        localStorage.setItem("client_account", JSON.stringify(nextAccount));
        localStorage.setItem(
          "client_contacts",
          JSON.stringify(nextContacts)
        );
      }

      // 4) Persist to backend (best-effort)
      try {
        await updateSettingsProfile({
          onboardingData,
          contact: {
            firstName: nextFirstName,
            lastName: nextLastName,
            phone: draft.phone,
            jobTitle: draft.jobTitle,
          },
        });
      } catch (err) {
        console.warn("Backend profile update failed:", err);
      }

      setAccount(nextAccount);
      setContacts(nextContacts);
      setEditMode(false);
      setDraft(null);
    } catch (err) {
      console.error("Profile save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PortalPageShell>
        <PageHeader title="Complete Profile" subtitle="" showSearch={false} showActions={false} />
        <div className="py-16 text-center text-gray-500">Loading…</div>
      </PortalPageShell>
    );
  }

  return (
    <PortalPageShell>
      <PageHeader
        title="Complete Profile"
        subtitle="Review your company and personal details"
        showSearch={false}
        showActions={false}
      />

      <Card variant="elevated" className="mb-6 rounded-xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Profile completion
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Fill required details to reach 100%.
                </p>
              </div>
              <div className="shrink-0 text-sm font-semibold text-gray-900">
                {completionPercent}%
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar value={completionPercent} label={false} className="w-full" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!defaults?.website && !draft?.website}
              as={draft?.website || defaults?.website ? "a" : "button"}
              href={draft?.website || defaults?.website ? (draft?.website || defaults?.website) : undefined}
              target={(draft?.website || defaults?.website) ? "_blank" : undefined}
              rel={(draft?.website || defaults?.website) ? "noreferrer" : undefined}
            >
              Open website
            </Button>

            <Button type="button" variant="outline" onClick={() => router.push("/events")}>
              View Events
            </Button>

            <Button type="button" variant="secondary" onClick={() => router.push("/settings")}>
              Settings
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/company")}
            >
              Company
            </Button>

            {!editMode ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setEditMode(true)}
              >
                {completionPercent >= 100 ? "Edit Profile" : "Complete Profile"}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="primary"
                  disabled={saving}
                  onClick={handleSaveEdit}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Personal details */}
        <Card variant="elevated" className="rounded-xl lg:col-span-1">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 border border-orange-100">
              <User className="h-5 w-5 text-brand-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900">Personal</h2>
              <p className="mt-1.5 text-base text-gray-500">
                Primary contact information.
              </p>
            </div>
          </div>

          <InfoSection title="Basics" icon={User} isFirst>
            <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-1">
              {!editMode ? (
                <>
                  <InfoRow
                    label="Full name"
                    value={formatValue(
                      defaults?.fullName || getContactFullName(primaryContact)
                    )}
                    icon={User}
                  />
                  <InfoRow
                    label="Email"
                    value={formatValue(personalEmail)}
                    icon={Mail}
                  />
                  <InfoRow
                    label="Phone"
                    value={formatValue(personalPhone)}
                    icon={Phone}
                  />
                  <InfoRow
                    label="Job title"
                    value={formatValue(defaults?.jobTitle)}
                    icon={Briefcase}
                  />
                </>
              ) : (
                <>
                  <Input
                    label="Full name"
                    value={draft?.fullName || ""}
                    onChange={(e) =>
                      handleInlineDraftChange("fullName", e.target.value)
                    }
                  />
                  <Input
                    label="Email"
                    value={draft?.email || ""}
                    disabled
                    onChange={() => {}}
                  />
                  <Input
                    label="Phone"
                    value={draft?.phone || ""}
                    onChange={(e) =>
                      handleInlineDraftChange("phone", e.target.value)
                    }
                  />
                  <Input
                    label="Job title"
                    value={draft?.jobTitle || ""}
                    onChange={(e) =>
                      handleInlineDraftChange("jobTitle", e.target.value)
                    }
                  />
                </>
              )}
            </div>
          </InfoSection>

          <section className="border-t border-gray-100 pt-4">
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Bio
              </h3>
            </div>
            {!editMode ? (
              <p className="whitespace-pre-wrap text-base font-normal leading-relaxed text-gray-800">
                {defaults?.bio ? defaults.bio : "—"}
              </p>
            ) : (
              <Textarea
                label="Bio"
                rows={5}
                value={draft?.bio || ""}
                onChange={(e) => handleInlineDraftChange("bio", e.target.value)}
              />
            )}
          </section>
        </Card>

        {/* Company details */}
        <Card variant="elevated" className="rounded-xl lg:col-span-2">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 border border-orange-100">
              <Building2 className="h-5 w-5 text-brand-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900">Company</h2>
              <p className="mt-1.5 text-base text-gray-500">
                Your organization profile details.
              </p>
            </div>
          </div>

          <InfoSection title="Overview" icon={Building2} isFirst>
            {!editMode ? (
              <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <InfoRow
                  label="Company"
                  value={formatValue(defaults?.company)}
                  icon={Building2}
                />
                <InfoRow
                  label="Industry"
                  value={formatValue(account?.industry)}
                  icon={Globe}
                />
                <InfoRow
                  label="Company email"
                  value={formatValue(defaults?.companyEmail)}
                  icon={Mail}
                />
                <InfoRow
                  label="Company phone"
                  value={formatValue(defaults?.companyPhone)}
                  icon={Phone}
                />
                <InfoRow
                  label="Website"
                  value={formatValue(defaults?.website)}
                  icon={Globe}
                />
                <InfoRow
                  label="Company type"
                  value={formatValue(defaults?.companyType)}
                  icon={Building2}
                />
                <InfoRow
                  label="Company sub-type"
                  value={formatValue(defaults?.companySubType)}
                  icon={Building2}
                />
              </div>
            ) : (
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Company"
                  value={draft?.company || ""}
                  onChange={(e) => handleInlineDraftChange("company", e.target.value)}
                />
                <Input
                  label="Industry"
                  value={draft?.industry || ""}
                  onChange={(e) => handleInlineDraftChange("industry", e.target.value)}
                />
                <Input
                  label="Company email"
                  value={draft?.companyEmail || ""}
                  onChange={(e) => handleInlineDraftChange("companyEmail", e.target.value)}
                />
                <Input
                  label="Company phone"
                  value={draft?.companyPhone || ""}
                  onChange={(e) => handleInlineDraftChange("companyPhone", e.target.value)}
                />
                <Input
                  label="Website"
                  value={draft?.website || ""}
                  onChange={(e) => handleInlineDraftChange("website", e.target.value)}
                />
                <Input
                  label="Company type"
                  value={draft?.companyType || ""}
                  onChange={(e) => handleInlineDraftChange("companyType", e.target.value)}
                />
                <Input
                  label="Company sub-type"
                  value={draft?.companySubType || ""}
                  onChange={(e) => handleInlineDraftChange("companySubType", e.target.value)}
                />
              </div>
            )}
          </InfoSection>

          <section className="border-t border-gray-100 pt-4">
            <div className="mb-2 flex items-center gap-2">
              <MapPin className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Address
              </h3>
            </div>
            {!editMode ? (
              <p className="text-base font-normal leading-relaxed text-gray-800 whitespace-pre-wrap">
                {fullAddress}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Address line 1"
                  value={draft?.addressLine1 || ""}
                  onChange={(e) =>
                    handleInlineDraftChange("addressLine1", e.target.value)
                  }
                />
                <Input
                  label="Address line 2"
                  value={draft?.addressLine2 || ""}
                  onChange={(e) =>
                    handleInlineDraftChange("addressLine2", e.target.value)
                  }
                />
                <Input
                  label="City"
                  value={draft?.city || ""}
                  onChange={(e) => handleInlineDraftChange("city", e.target.value)}
                />
                <Input
                  label="State"
                  value={draft?.state || ""}
                  onChange={(e) =>
                    handleInlineDraftChange("state", e.target.value)
                  }
                />
                <Input
                  label="Postal code"
                  value={draft?.postalCode || ""}
                  onChange={(e) =>
                    handleInlineDraftChange("postalCode", e.target.value)
                  }
                />
                <Input
                  label="Country"
                  value={draft?.country || ""}
                  onChange={(e) =>
                    handleInlineDraftChange("country", e.target.value)
                  }
                />
              </div>
            )}
          </section>

          <section className="border-t border-gray-100 pt-4">
            <div className="mb-2 flex items-center gap-2">
              <LinkIcon className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Links & interests
              </h3>
            </div>

            {!editMode ? (
              <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                    LinkedIn
                  </p>
                  <p className="text-base text-gray-800 whitespace-pre-wrap">
                    {defaults?.linkedin ? defaults.linkedin : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                    X Profile
                  </p>
                  <p className="text-base text-gray-800 whitespace-pre-wrap">
                    {defaults?.xProfile ? defaults.xProfile : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                    Interests
                  </p>
                  <p className="text-base text-gray-800 whitespace-pre-wrap">
                    {defaults?.interests ? defaults.interests : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                    Looking for
                  </p>
                  <p className="text-base text-gray-800 whitespace-pre-wrap">
                    {defaults?.registrationLookingFor
                      ? defaults.registrationLookingFor
                      : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="LinkedIn"
                  value={draft?.linkedin || ""}
                  onChange={(e) =>
                    handleInlineDraftChange("linkedin", e.target.value)
                  }
                />
                <Input
                  label="X Profile"
                  value={draft?.xProfile || ""}
                  onChange={(e) =>
                    handleInlineDraftChange("xProfile", e.target.value)
                  }
                />
                <Input
                  label="Interests"
                  value={draft?.interests || ""}
                  onChange={(e) =>
                    handleInlineDraftChange("interests", e.target.value)
                  }
                />
                <Input
                  label="Looking for"
                  value={draft?.registrationLookingFor || ""}
                  onChange={(e) =>
                    handleInlineDraftChange(
                      "registrationLookingFor",
                      e.target.value
                    )
                  }
                />
              </div>
            )}
          </section>

          <section className="border-t border-gray-100 pt-4">
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Company description
              </h3>
            </div>
            {!editMode ? (
              <p className="whitespace-pre-wrap text-base font-normal leading-relaxed text-gray-800">
                {defaults?.companyDescription ? defaults.companyDescription : "—"}
              </p>
            ) : (
              <Textarea
                label="Company description"
                rows={5}
                value={draft?.companyDescription || ""}
                onChange={(e) =>
                  handleInlineDraftChange(
                    "companyDescription",
                    e.target.value
                  )
                }
              />
            )}
          </section>
        </Card>

        {/* Contacts */}
        <Card variant="elevated" className="rounded-xl lg:col-span-3">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
              <p className="mt-1.5 text-base text-gray-500">
                People associated with your organization.
              </p>
            </div>
            <Badge variant="gray" className="!bg-gray-100 !text-gray-600 !border-0 w-fit">
              {contacts.length} contact{contacts.length === 1 ? "" : "s"}
            </Badge>
          </div>

          {contacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No contacts found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {contacts.map((c) => {
                const name = getContactFullName(c) || "Contact";
                const initials = name.charAt(0).toUpperCase();
                const role =
                  c.isPrimaryContact || c.contactRole === "PRIMARY_CONTACT"
                    ? "Primary Contact"
                    : c.role || c.contactRole || "Member";

                return (
                  <div
                    key={c.id || c.email || name}
                    className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
                  >
                    <Avatar
                      size="sm"
                      fallback={initials}
                      className="!h-10 !w-10 bg-gray-500 text-white font-semibold ring-2 ring-white"
                      alt={name}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {c.email || "No email"}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          variant="gray"
                          className="!bg-white !text-gray-600 !border-gray-200 w-fit"
                        >
                          {role}
                        </Badge>
                        {c.phone ? (
                          <span className="text-xs text-gray-500">
                            {String(c.phone).trim()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </PortalPageShell>
  );
}

