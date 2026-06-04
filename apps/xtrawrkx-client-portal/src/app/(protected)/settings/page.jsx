"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  TIMEZONE_OPTIONS,
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
  {
    id: "appearance",
    name: "Appearance",
    icon: Palette,
    description: "Customize your dashboard theme",
  },
  {
    id: "language",
    name: "Language & Region",
    icon: Globe,
    description: "Set your language and timezone",
  },
];

const emptyProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  bio: "",
  timezone: "America/Los_Angeles",
  avatarUrl: null,
  notifications: {
    email: true,
    projectUpdates: true,
    messages: true,
  },
  appearance: { theme: "light" },
  language: "en",
};

function StatusBanner({ type, message }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div
      className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
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

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary";

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
            appearance: {
              ...emptyProfile.appearance,
              ...(data.profile.appearance || {}),
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

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

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

      const payload = {
        timezone: profile.timezone,
        notifications: profile.notifications,
        appearance: profile.appearance,
        language: profile.language,
      };

      const data = await updateSettingsProfile(payload);
      if (data.profile) {
        setProfile((prev) => ({
          ...prev,
          ...data.profile,
          notifications: {
            ...prev.notifications,
            ...(data.profile.notifications || {}),
          },
        }));
      }
      setStatus({ type: "success", message: "Settings saved successfully" });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const categoryTitle =
    settingsCategories.find((c) => c.id === activeCategory)?.name ||
    "Settings";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <nav className="space-y-2">
              {settingsCategories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category.id);
                      setStatus({ type: "", message: "" });
                    }}
                    className={`w-full flex items-center space-x-3 p-3 text-left rounded-lg transition-colors group ${
                      isActive
                        ? "bg-brand-primary/10 border border-brand-primary/20"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isActive
                          ? "text-brand-primary"
                          : "text-gray-400 group-hover:text-gray-600"
                      }`}
                    />
                    <div>
                      <p
                        className={`font-medium ${
                          isActive ? "text-brand-primary" : "text-gray-900"
                        }`}
                      >
                        {category.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {category.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {categoryTitle}
              </h2>
              <Button onClick={handleSave} disabled={saving || loading}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>

            <StatusBanner type={status.type} message={status.message} />

            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
              </div>
            ) : (
              <>
                {activeCategory === "notifications" && (
                  <div className="space-y-4">
                    {[
                      {
                        key: "email",
                        label: "Email notifications",
                        description: "Receive updates by email",
                      },
                      {
                        key: "projectUpdates",
                        label: "Project updates",
                        description: "Alerts when project status changes",
                      },
                      {
                        key: "messages",
                        label: "Messages",
                        description: "New messages from your team",
                      },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-4 cursor-pointer hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.label}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.description}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(profile.notifications?.[item.key])}
                          onChange={(e) =>
                            handleNotificationChange(item.key, e.target.checked)
                          }
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                        />
                      </label>
                    ))}
                  </div>
                )}

                {activeCategory === "security" && (
                  <div className="grid grid-cols-1 gap-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                        className={inputClass}
                        autoComplete="current-password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        className={inputClass}
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        className={inputClass}
                        autoComplete="new-password"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Password must be at least 8 characters.
                    </p>
                  </div>
                )}

                {activeCategory === "appearance" && (
                  <div className="space-y-4 max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dashboard theme
                    </label>
                    <select
                      value={profile.appearance?.theme || "light"}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          appearance: { theme: e.target.value },
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                    <p className="text-sm text-gray-500">
                      Theme preference is saved to your account. Full dark mode
                      rollout may follow in a future update.
                    </p>
                  </div>
                )}

                {activeCategory === "language" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={profile.language}
                        onChange={(e) =>
                          handleProfileChange("language", e.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={profile.timezone}
                        onChange={(e) =>
                          handleProfileChange("timezone", e.target.value)
                        }
                        className={inputClass}
                      >
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
