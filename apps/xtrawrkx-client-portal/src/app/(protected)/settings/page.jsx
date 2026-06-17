"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Shield,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  FolderKanban,
  MessageSquare,
  Lock,
} from "lucide-react";
import { Button, Card, Checkbox, Input, LoadingSpinner } from "@webfudge/ui";
import { PageHeader } from "@/components/layout/PortalPageHeader";
import { PortalPageShell } from "@/components/layout/PortalPageShell";
import {
  changeSettingsPassword,
  fetchSettingsProfile,
  updateSettingsProfile,
} from "@/lib/api/settingsService";

const settingsCategories = [
  {
    id: "notifications",
    name: "Notifications",
    icon: Bell,
    description: "Configure notification preferences",
  },
  {
    id: "security",
    name: "Security",
    icon: Shield,
    description: "Password and security settings",
  },
];

const notificationOptions = [
  {
    key: "email",
    label: "Email notifications",
    description: "Receive updates by email",
    icon: Mail,
  },
  {
    key: "projectUpdates",
    label: "Project updates",
    description: "Alerts when project status changes",
    icon: FolderKanban,
  },
  {
    key: "messages",
    label: "Messages",
    description: "New messages from your team",
    icon: MessageSquare,
  },
];

const emptyProfile = {
  notifications: {
    email: true,
    projectUpdates: true,
    messages: true,
  },
};

function StatusBanner({ type, message }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div
      className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
        isError
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {isError ? (
        <AlertCircle className="h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      )}
      {message}
    </div>
  );
}

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState("notifications");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [profile, setProfile] = useState(emptyProfile);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchSettingsProfile();
        if (!cancelled && data.profile) {
          setProfile({
            ...emptyProfile,
            ...data.profile,
            notifications: {
              ...emptyProfile.notifications,
              ...(data.profile.notifications || {}),
            },
          });
        }
      } catch (err) {
        if (!cancelled) {
          setStatus({
            type: "error",
            message: err.message || "Failed to load settings",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNotificationChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: "", message: "" });
    try {
      if (activeCategory === "security") {
        if (!passwordForm.currentPassword) {
          throw new Error("Enter your current password");
        }
        if (!passwordForm.newPassword) {
          throw new Error("Enter a new password");
        }
        if (passwordForm.newPassword.length < 8) {
          throw new Error("New password must be at least 8 characters");
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          throw new Error("New passwords do not match");
        }

        await changeSettingsPassword(
          passwordForm.currentPassword,
          passwordForm.newPassword
        );
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setStatus({
          type: "success",
          message: "Password changed successfully",
        });
        return;
      }

      const data = await updateSettingsProfile({
        notifications: profile.notifications,
      });
      if (data.profile) {
        setProfile((prev) => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            ...(data.profile.notifications || {}),
          },
        }));
      }
      setStatus({
        type: "success",
        message: "Notification preferences saved",
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const activeCategoryMeta = settingsCategories.find(
    (c) => c.id === activeCategory
  );

  return (
    <PortalPageShell>
      <PageHeader
        title="Settings"
        subtitle="Manage your account settings and preferences"
        showSearch={false}
        showActions={false}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card variant="elevated" padding={false} className="rounded-xl p-4">
            <h3 className="mb-4 px-1 font-semibold text-gray-900">Categories</h3>

            <nav className="space-y-2">
              {settingsCategories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      setActiveCategory(category.id);
                      setStatus({ type: "", message: "" });
                    }}
                    className={`group flex w-full items-center space-x-3 rounded-xl border p-3 transition-colors ${
                      isActive
                        ? "border-brand-primary/20 bg-brand-primary/10"
                        : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border bg-gray-50 ${
                        isActive
                          ? "border-brand-primary/20 bg-white"
                          : "border-gray-200 group-hover:border-gray-300"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isActive
                            ? "text-brand-primary"
                            : "text-gray-400 group-hover:text-gray-600"
                        }`}
                      />
                    </span>

                    <div className="min-w-0">
                      <p
                        className={`truncate font-medium ${
                          isActive ? "text-brand-primary" : "text-gray-900"
                        }`}
                      >
                        {category.name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {category.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card variant="elevated" padding={false} className="overflow-hidden rounded-xl">
            <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeCategoryMeta?.name || "Settings"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {activeCategoryMeta?.description}
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={saving || loading}
                className="shrink-0"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>

            <div className="p-6">
              <StatusBanner type={status.type} message={status.message} />

              {loading ? (
                <div className="flex justify-center py-16">
                  <LoadingSpinner size="lg" message="Loading settings…" />
                </div>
              ) : activeCategory === "notifications" ? (
                <div className="space-y-3">
                  {notificationOptions.map((item) => {
                    const Icon = item.icon;
                    const checked = Boolean(
                      profile.notifications?.[item.key]
                    );

                    return (
                      <Card
                        key={item.key}
                        variant="elevated"
                        className="rounded-xl !p-0"
                      >
                        <div className="flex items-start justify-between gap-4 p-4">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                              <Icon className="h-5 w-5 text-brand-primary" />
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">
                                {item.label}
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <Checkbox
                            checked={checked}
                            onChange={(value) =>
                              handleNotificationChange(item.key, value)
                            }
                            className="mt-2"
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card variant="elevated" className="max-w-lg rounded-xl">
                  <div className="mb-5 flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50">
                      <Lock className="h-5 w-5 text-brand-primary" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Change password
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Use a strong password with at least 8 characters.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="Current password"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      autoComplete="current-password"
                    />

                    <Input
                      label="New password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      autoComplete="new-password"
                    />

                    <Input
                      label="Confirm new password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      autoComplete="new-password"
                    />
                  </div>
                </Card>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PortalPageShell>
  );
}
