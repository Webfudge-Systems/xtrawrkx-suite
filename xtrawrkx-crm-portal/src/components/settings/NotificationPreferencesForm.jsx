"use client";

import { useState } from "react";
import { Card, Button, Select, Badge } from "../../components/ui";
import {
  Bell,
  Mail,
  Smartphone,
  Monitor as Desktop,
  Settings,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Clock,
  User,
  Shield,
  FileText,
  DollarSign,
  Users,
  Calendar,
} from "lucide-react";

// Custom Switch Component
const Switch = ({ checked, onChange, disabled = false, size = "md" }) => {
  const sizeClasses = size === "sm" ? "w-8 h-4" : "w-11 h-6";
  const thumbSizeClasses = size === "sm" ? "w-3 h-3" : "w-5 h-5";
  const translateClasses = size === "sm" ? "translate-x-4" : "translate-x-5";

  return (
    <button
      type="button"
      className={`${sizeClasses} relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? "bg-blue-600" : "bg-gray-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={() => !disabled && onChange?.(!checked)}
      disabled={disabled}
    >
      <span
        className={`${thumbSizeClasses} pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? translateClasses : "translate-x-0"
        }`}
      />
    </button>
  );
};

export default function NotificationPreferencesForm() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [preferences, setPreferences] = useState({
    // Global Settings
    globalEnabled: true,
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00",
      timezone: "UTC",
    },
    frequency: "realtime", // realtime, hourly, daily, weekly

    // Channel Preferences
    channels: {
      email: {
        enabled: true,
        frequency: "realtime",
        types: ["important", "updates", "reminders"],
      },
      inApp: {
        enabled: true,
        frequency: "realtime",
        types: ["all"],
        sound: true,
        desktop: true,
      },
      mobile: {
        enabled: true,
        frequency: "realtime",
        types: ["important", "urgent"],
        push: true,
        sms: false,
      },
    },

    // Event Types
    events: {
      leads: {
        new: { email: true, inApp: true, mobile: false },
        assigned: { email: true, inApp: true, mobile: true },
        statusChanged: { email: false, inApp: true, mobile: false },
        converted: { email: true, inApp: true, mobile: true },
      },
      deals: {
        new: { email: true, inApp: true, mobile: false },
        stageChanged: { email: false, inApp: true, mobile: false },
        closed: { email: true, inApp: true, mobile: true },
        valueChanged: { email: false, inApp: true, mobile: false },
      },
      contacts: {
        new: { email: true, inApp: true, mobile: false },
        updated: { email: false, inApp: true, mobile: false },
        assigned: { email: true, inApp: true, mobile: false },
      },
      activities: {
        taskDue: { email: true, inApp: true, mobile: true },
        taskOverdue: { email: true, inApp: true, mobile: true },
        meetingReminder: { email: true, inApp: true, mobile: true },
        callScheduled: { email: true, inApp: true, mobile: true },
      },
      system: {
        login: { email: false, inApp: false, mobile: false },
        security: { email: true, inApp: true, mobile: true },
        maintenance: { email: true, inApp: true, mobile: false },
        updates: { email: true, inApp: true, mobile: false },
      },
    },

    // Advanced Settings
    advanced: {
      digest: {
        enabled: true,
        frequency: "daily",
        time: "09:00",
        summary: true,
      },
      filters: {
        keywords: [],
        excludeKeywords: [],
        minimumValue: 0,
        priority: "all",
      },
      templates: {
        custom: false,
        signature: "",
      },
    },
  });

  const frequencyOptions = [
    {
      value: "realtime",
      label: "Real-time",
      description: "Immediate notifications",
    },
    { value: "hourly", label: "Hourly", description: "Batched every hour" },
    { value: "daily", label: "Daily", description: "Once per day" },
    { value: "weekly", label: "Weekly", description: "Once per week" },
  ];

  const timezoneOptions = [
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "Eastern Time" },
    { value: "America/Chicago", label: "Central Time" },
    { value: "America/Denver", label: "Mountain Time" },
    { value: "America/Los_Angeles", label: "Pacific Time" },
    { value: "Europe/London", label: "London" },
    { value: "Europe/Paris", label: "Paris" },
    { value: "Asia/Tokyo", label: "Tokyo" },
  ];

  const eventCategories = [
    {
      key: "leads",
      label: "Leads",
      icon: Users,
      color: "bg-blue-500",
      description: "Lead-related notifications",
    },
    {
      key: "deals",
      label: "Deals",
      icon: DollarSign,
      color: "bg-green-500",
      description: "Deal and opportunity notifications",
    },
    {
      key: "contacts",
      label: "Contacts",
      icon: User,
      color: "bg-purple-500",
      description: "Contact management notifications",
    },
    {
      key: "activities",
      label: "Activities",
      icon: Calendar,
      color: "bg-orange-500",
      description: "Task and activity notifications",
    },
    {
      key: "system",
      label: "System",
      icon: Shield,
      color: "bg-gray-500",
      description: "System and security notifications",
    },
  ];

  const handlePreferenceChange = (path, value) => {
    setPreferences((prev) => {
      const keys = path.split(".");
      const newPrefs = { ...prev };
      let current = newPrefs;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newPrefs;
    });
  };

  const handleEventTypeChange = (category, event, channel, value) => {
    setPreferences((prev) => ({
      ...prev,
      events: {
        ...prev.events,
        [category]: {
          ...prev.events[category],
          [event]: {
            ...prev.events[category][event],
            [channel]: value,
          },
        },
      },
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleReset = () => {
    // Reset to default preferences
    setPreferences({
      globalEnabled: true,
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00",
        timezone: "UTC",
      },
      frequency: "realtime",
      channels: {
        email: {
          enabled: true,
          frequency: "realtime",
          types: ["important", "updates", "reminders"],
        },
        inApp: {
          enabled: true,
          frequency: "realtime",
          types: ["all"],
          sound: true,
          desktop: true,
        },
        mobile: {
          enabled: true,
          frequency: "realtime",
          types: ["important", "urgent"],
          push: true,
          sms: false,
        },
      },
      events: {
        leads: {
          new: { email: true, inApp: true, mobile: false },
          assigned: { email: true, inApp: true, mobile: true },
          statusChanged: { email: false, inApp: true, mobile: false },
          converted: { email: true, inApp: true, mobile: true },
        },
        deals: {
          new: { email: true, inApp: true, mobile: false },
          stageChanged: { email: false, inApp: true, mobile: false },
          closed: { email: true, inApp: true, mobile: true },
          valueChanged: { email: false, inApp: true, mobile: false },
        },
        contacts: {
          new: { email: true, inApp: true, mobile: false },
          updated: { email: false, inApp: true, mobile: false },
          assigned: { email: true, inApp: true, mobile: false },
        },
        activities: {
          taskDue: { email: true, inApp: true, mobile: true },
          taskOverdue: { email: true, inApp: true, mobile: true },
          meetingReminder: { email: true, inApp: true, mobile: true },
          callScheduled: { email: true, inApp: true, mobile: true },
        },
        system: {
          login: { email: false, inApp: false, mobile: false },
          security: { email: true, inApp: true, mobile: true },
          maintenance: { email: true, inApp: true, mobile: false },
          updates: { email: true, inApp: true, mobile: false },
        },
      },
      advanced: {
        digest: {
          enabled: true,
          frequency: "daily",
          time: "09:00",
          summary: true,
        },
        filters: {
          keywords: [],
          excludeKeywords: [],
          minimumValue: 0,
          priority: "all",
        },
        templates: { custom: false, signature: "" },
      },
    });
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "inApp":
        return <Desktop className="w-4 h-4" />;
      case "mobile":
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getChannelColor = (channel) => {
    switch (channel) {
      case "email":
        return "text-blue-600";
      case "inApp":
        return "text-green-600";
      case "mobile":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Notification Preferences
          </h3>
          <p className="text-sm text-gray-600">
            Configure how and when you receive notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <EyeOff className="w-4 h-4 mr-2" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Edit Preferences
            </Button>
          )}
        </div>
      </div>

      {/* Global Settings */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Global Settings
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">
                Enable Notifications
              </h5>
              <p className="text-sm text-gray-600">
                Master switch for all notifications
              </p>
            </div>
            <Switch
              checked={preferences.globalEnabled}
              onChange={(checked) =>
                handlePreferenceChange("globalEnabled", checked)
              }
              disabled={!isEditing}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Frequency
              </label>
              <Select
                value={preferences.frequency}
                onChange={(value) => handlePreferenceChange("frequency", value)}
                options={frequencyOptions}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <Select
                value={preferences.quietHours.timezone}
                onChange={(value) =>
                  handlePreferenceChange("quietHours.timezone", value)
                }
                options={timezoneOptions}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">Quiet Hours</h5>
              <p className="text-sm text-gray-600">
                Pause notifications during specific hours
              </p>
            </div>
            <Switch
              checked={preferences.quietHours.enabled}
              onChange={(checked) =>
                handlePreferenceChange("quietHours.enabled", checked)
              }
              disabled={!isEditing}
            />
          </div>

          {preferences.quietHours.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={preferences.quietHours.start}
                  onChange={(e) =>
                    handlePreferenceChange("quietHours.start", e.target.value)
                  }
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={preferences.quietHours.end}
                  onChange={(e) =>
                    handlePreferenceChange("quietHours.end", e.target.value)
                  }
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Channel Preferences */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Channel Preferences
        </h4>
        <div className="space-y-6">
          {Object.entries(preferences.channels).map(([channel, settings]) => (
            <div
              key={channel}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      channel === "email"
                        ? "bg-blue-100"
                        : channel === "inApp"
                        ? "bg-green-100"
                        : "bg-purple-100"
                    }`}
                  >
                    {getChannelIcon(channel)}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 capitalize">
                      {channel}
                    </h5>
                    <p className="text-sm text-gray-600">
                      {channel === "email"
                        ? "Email notifications"
                        : channel === "inApp"
                        ? "In-app notifications"
                        : "Mobile push notifications"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.enabled}
                  onChange={(checked) =>
                    handlePreferenceChange(
                      `channels.${channel}.enabled`,
                      checked
                    )
                  }
                  disabled={!isEditing}
                />
              </div>

              {settings.enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency
                      </label>
                      <Select
                        value={settings.frequency}
                        onChange={(value) =>
                          handlePreferenceChange(
                            `channels.${channel}.frequency`,
                            value
                          )
                        }
                        options={frequencyOptions}
                        disabled={!isEditing}
                      />
                    </div>
                    {channel === "inApp" && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={settings.sound}
                            onChange={(e) =>
                              handlePreferenceChange(
                                `channels.${channel}.sound`,
                                e.target.checked
                              )
                            }
                            disabled={!isEditing}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            Sound notifications
                          </span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={settings.desktop}
                            onChange={(e) =>
                              handlePreferenceChange(
                                `channels.${channel}.desktop`,
                                e.target.checked
                              )
                            }
                            disabled={!isEditing}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            Desktop notifications
                          </span>
                        </label>
                      </div>
                    )}
                    {channel === "mobile" && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={settings.push}
                            onChange={(e) =>
                              handlePreferenceChange(
                                `channels.${channel}.push`,
                                e.target.checked
                              )
                            }
                            disabled={!isEditing}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            Push notifications
                          </span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={settings.sms}
                            onChange={(e) =>
                              handlePreferenceChange(
                                `channels.${channel}.sms`,
                                e.target.checked
                              )
                            }
                            disabled={!isEditing}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            SMS notifications
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Event Types */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Event Types
        </h4>
        <div className="space-y-6">
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Event type configuration will be available soon</p>
            <p className="text-sm">
              This section is temporarily simplified for debugging
            </p>
          </div>
        </div>
      </Card>

      {/* Preview */}
      {showPreview && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Notification Preview
          </h4>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-blue-900">
                    New Lead Assigned
                  </h5>
                  <p className="text-sm text-blue-700">
                    Sarah Johnson from Tech Corp has been assigned to you
                  </p>
                  <p className="text-xs text-blue-600 mt-1">2 minutes ago</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-green-900">Deal Closed</h5>
                  <p className="text-sm text-green-700">
                    Enterprise Software License - $125,000
                  </p>
                  <p className="text-xs text-green-600 mt-1">1 hour ago</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-yellow-900">Task Due Soon</h5>
                  <p className="text-sm text-yellow-700">
                    Follow up with Tech Corp lead - Due in 2 hours
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">3 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
