"use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import Container from "@/src/components/layout/Container";
import PublicProtectedRoute from "@/src/components/auth/PublicProtectedRoute";
import ProfileCommunityCard from "@/src/components/profile/ProfileCommunityCard";
import Button from "@/src/components/common/Button";
import { usePublicAuth } from "@/src/contexts/PublicAuthContext";
import { communityPortalService } from "@/src/services/communityPortalService";
import { commonToasts } from "@/src/utils/toast";

const profileSections = [
  {
    key: "personal",
    title: "Personal",
    icon: "solar:user-id-bold",
    fields: [
      { key: "firstName", label: "First name" },
      { key: "lastName", label: "Last name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "displayName", label: "Display name" },
    ],
  },
  {
    key: "company",
    title: "Company Information",
    icon: "solar:buildings-bold",
    fields: [
      { key: "companyName", label: "Company name" },
      { key: "companyEmail", label: "Company email" },
      { key: "companyPhone", label: "Company phone" },
      { key: "industry", label: "Industry" },
      { key: "jobTitle", label: "Role / title" },
      { key: "companyType", label: "Company type" },
      { key: "companySubType", label: "Sub-type" },
      { key: "website", label: "Website" },
      { key: "companyDescription", label: "Company description", fullWidth: true },
    ],
  },
  {
    key: "address",
    title: "Address Information",
    icon: "solar:map-point-bold",
    fields: [
      { key: "addressLine1", label: "Address line 1" },
      { key: "addressLine2", label: "Address line 2" },
      { key: "city", label: "City" },
      { key: "state", label: "State / region" },
      { key: "country", label: "Country" },
      { key: "postalCode", label: "Postal code" },
      { key: "location", label: "Location summary", fullWidth: true },
    ],
  },
  {
    key: "social",
    title: "Social & Additional Information",
    icon: "solar:link-circle-bold",
    fields: [
      { key: "linkedin", label: "LinkedIn" },
      { key: "xProfile", label: "X / Twitter" },
      { key: "interests", label: "Interests / focus areas" },
      { key: "lookingFor", label: "Looking for" },
      { key: "bio", label: "Short bio", fullWidth: true },
    ],
  },
];

export default function ProfilePage() {
  const { profile, signOut, profileBusy, updateUserProfile } = usePublicAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    company: "",
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    industry: "",
    companyType: "",
    companySubType: "",
    website: "",
    companyDescription: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    jobTitle: "",
    location: "",
    linkedin: "",
    xProfile: "",
    interests: "",
    lookingFor: "",
    bio: "",
  });

  const displayName =
    profile?.displayName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "xtrawrkx member";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const profileFormDefaults = useMemo(
    () => ({
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      phone: profile?.phone || "",
      company: profile?.company || "",
      companyName: profile?.companyName || profile?.company || "",
      companyEmail: profile?.companyEmail || "",
      companyPhone: profile?.companyPhone || "",
      industry: profile?.industry || "",
      companyType: profile?.companyType || "",
      companySubType: profile?.companySubType || "",
      website: profile?.website || "",
      companyDescription: profile?.companyDescription || "",
      addressLine1: profile?.addressLine1 || "",
      addressLine2: profile?.addressLine2 || "",
      city: profile?.city || "",
      state: profile?.state || "",
      country: profile?.country || "",
      postalCode: profile?.postalCode || "",
      jobTitle: profile?.jobTitle || "",
      location: profile?.location || "",
      linkedin: profile?.linkedin || "",
      xProfile: profile?.xProfile || "",
      interests: profile?.interests || "",
      lookingFor: profile?.lookingFor || "",
      bio: profile?.bio || "",
    }),
    [profile]
  );

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleStartEditing = () => {
    setEditForm(profileFormDefaults);
    setIsEditing(true);
  };

  const handleSaveEdits = async () => {
    try {
      await updateUserProfile({
        ...editForm,
        company: editForm.companyName || editForm.company,
        location:
          editForm.location ||
          [editForm.city, editForm.state, editForm.country]
            .filter(Boolean)
            .join(", "),
        displayName: [editForm.firstName, editForm.lastName]
          .filter(Boolean)
          .join(" "),
      });
      setIsEditing(false);
      commonToasts.saveSuccess();
    } catch (error) {
      commonToasts.saveError();
    }
  };

  const handleOpenCompanyPortal = () => {
    communityPortalService.openClientPortalDashboard({
      email: profile?.email?.trim() || "",
      newTab: true,
    });
  };

  return (
    <PublicProtectedRoute>
      <main className="bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_42%)] pb-20 pt-28">
        <Container className="space-y-8">
          <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
            <div className="relative h-64 overflow-hidden sm:h-80">
              <video
                src="/mountain_hero.webm"
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/20 to-sky-300/5" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-white/90">
                  Profile
                </span>
                <h1 className="mt-4 max-w-2xl font-heading text-4xl text-white sm:text-5xl">
                  Welcome, {profile?.firstName || displayName}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                  Your account is now connected to the public site. Review your
                  profile details and continue into the right community flow.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-6 px-6 pb-8 pt-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <div className="-mt-16 flex h-24 w-24 items-center justify-center rounded-[1.75rem] border-4 border-white bg-gradient-to-br from-brand-primary to-brand-secondary text-2xl font-semibold text-white shadow-xl sm:h-28 sm:w-28">
                  {initials || "XM"}
                </div>
                <div className="pt-1 sm:pb-2">
                  <h2 className="text-2xl font-semibold leading-tight text-slate-900">
                    {displayName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {profile?.jobTitle || "Community member"}
                    {profile?.company ? ` at ${profile.company}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">{profile?.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <Button
                  text={isEditing ? "Save Changes" : "Edit Profile"}
                  type="secondary"
                  hideArrow
                  onClick={isEditing ? handleSaveEdits : handleStartEditing}
                  disabled={profileBusy}
                  className="min-w-[160px] justify-center"
                />
                <Button
                  text="Open your company portal"
                  type="secondary"
                  onClick={handleOpenCompanyPortal}
                  disabled={profileBusy}
                  className="min-w-[160px] justify-center"
                />
                <Button
                  text="Logout"
                  type="primary"
                  hideArrow
                  onClick={async () => {
                    try {
                      await signOut();
                      commonToasts.logoutSuccess();
                      window.location.href = "/";
                    } catch (error) {
                      commonToasts.somethingWentWrong();
                    }
                  }}
                  className="min-w-[130px] justify-center"
                />
              </div>
            </div>
          </section>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.5fr)_360px]">
            <section className="rounded-[1.75rem] border border-white/80 bg-white/95 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                  <Icon icon="solar:user-id-bold" width={22} />
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-primary">
                    profile dossier
                  </p>
                  <h3 className="text-2xl font-semibold text-slate-900">
                    Registration details
                  </h3>
                </div>
              </div>

              {isEditing ? (
                <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-slate-50/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900">
                        Edit profile
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Update the details shown in your profile overview.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        First name
                      </span>
                      <input
                        name="firstName"
                        value={editForm.firstName}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Last name
                      </span>
                      <input
                        name="lastName"
                        value={editForm.lastName}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Phone
                      </span>
                      <input
                        name="phone"
                        value={editForm.phone}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Company
                      </span>
                      <input
                        name="companyName"
                        value={editForm.companyName}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Company email
                      </span>
                      <input
                        name="companyEmail"
                        value={editForm.companyEmail}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Company phone
                      </span>
                      <input
                        name="companyPhone"
                        value={editForm.companyPhone}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Industry
                      </span>
                      <input
                        name="industry"
                        value={editForm.industry}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Role / title
                      </span>
                      <input
                        name="jobTitle"
                        value={editForm.jobTitle}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Company type
                      </span>
                      <input
                        name="companyType"
                        value={editForm.companyType}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Sub-type
                      </span>
                      <input
                        name="companySubType"
                        value={editForm.companySubType}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Website
                      </span>
                      <input
                        name="website"
                        value={editForm.website}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Company description
                      </span>
                      <textarea
                        name="companyDescription"
                        value={editForm.companyDescription}
                        onChange={handleEditChange}
                        className="input min-h-24 resize-none"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Address line 1
                      </span>
                      <input
                        name="addressLine1"
                        value={editForm.addressLine1}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Address line 2
                      </span>
                      <input
                        name="addressLine2"
                        value={editForm.addressLine2}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        City
                      </span>
                      <input
                        name="city"
                        value={editForm.city}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        State / region
                      </span>
                      <input
                        name="state"
                        value={editForm.state}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Country
                      </span>
                      <input
                        name="country"
                        value={editForm.country}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Postal code
                      </span>
                      <input
                        name="postalCode"
                        value={editForm.postalCode}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        LinkedIn
                      </span>
                      <input
                        name="linkedin"
                        value={editForm.linkedin}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        X / Twitter
                      </span>
                      <input
                        name="xProfile"
                        value={editForm.xProfile}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Location
                      </span>
                      <input
                        name="location"
                        value={editForm.location}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Focus areas
                      </span>
                      <input
                        name="interests"
                        value={editForm.interests}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Looking for
                      </span>
                      <input
                        name="lookingFor"
                        value={editForm.lookingFor}
                        onChange={handleEditChange}
                        className="input"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Short bio
                      </span>
                      <textarea
                        name="bio"
                        value={editForm.bio}
                        onChange={handleEditChange}
                        className="input min-h-28 resize-none"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 space-y-6">
                {profileSections.map((section) => (
                  <article key={section.key} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-brand-primary shadow-sm">
                        <Icon icon={section.icon} width={18} />
                      </span>
                      <h4 className="text-base font-semibold text-slate-900">{section.title}</h4>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {section.fields.map((field) => (
                        <div
                          key={field.key}
                          className={`rounded-xl border border-slate-100 bg-white px-4 py-3 ${
                            field.fullWidth ? "sm:col-span-2" : ""
                          }`}
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {field.label}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-700 break-words">
                            {profile?.[field.key] || "Not provided yet"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <div className="self-start">
              <ProfileCommunityCard />
            </div>
          </div>
        </Container>
      </main>
    </PublicProtectedRoute>
  );
}
