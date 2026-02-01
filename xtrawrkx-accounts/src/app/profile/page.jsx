"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "../components/UserContext";
import AuthService from "../../lib/authService";
import { usePermissions } from "../../hooks/usePermissions";
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Globe,
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  Camera,
  Check,
  AlertCircle,
  Clock,
  UserCheck,
  Settings,
  Key,
  Activity,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function ProfilePage() {
  const { currentUser, getRoleDisplayName, hasPermission } = useUser();
  const { hasPermission: hasDetailedPermission } = usePermissions();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [activities, setActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState(null);

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    department: "",
    location: "",
    timezone: "America/New_York",
    bio: "",
    joinDate: "",
    lastLogin: "",
    avatar: null,
  });

  const [editData, setEditData] = useState({ ...profileData });
  const [validationErrors, setValidationErrors] = useState({});

  // Validation rules
  const validateField = (field, value) => {
    const errors = {};

    switch (field) {
      case "firstName":
        if (!value || !value.trim()) {
          errors.firstName = "First name is required";
        } else if (value.trim().length < 2) {
          errors.firstName = "First name must be at least 2 characters";
        }
        break;

      case "lastName":
        if (!value || !value.trim()) {
          errors.lastName = "Last name is required";
        } else if (value.trim().length < 2) {
          errors.lastName = "Last name must be at least 2 characters";
        }
        break;

      case "phone":
        if (value && value.trim()) {
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ""))) {
            errors.phone = "Please enter a valid phone number";
          }
        }
        break;

      case "bio":
        if (value && value.length > 500) {
          errors.bio = "Bio must be less than 500 characters";
        }
        break;
    }

    return errors;
  };

  const validateForm = () => {
    const errors = {};

    // Validate all fields
    Object.keys(editData).forEach((field) => {
      const fieldErrors = validateField(field, editData[field]);
      Object.assign(errors, fieldErrors);
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch current user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) {
        setIsFetching(false);
        return;
      }

      try {
        setIsFetching(true);

        // First, let's use the currentUser data directly since the API might not be working properly

        // Try to get additional data from API, but don't fail if it doesn't work
        let apiUserData = null;
        try {
          const response = await AuthService.apiRequest("/auth/me");
          apiUserData = response.user;
        } catch (apiError) {
        }

        // Use currentUser as primary source, API data as enhancement
        const userData = {
          firstName: currentUser.firstName || apiUserData?.firstName || "",
          lastName: currentUser.lastName || apiUserData?.lastName || "",
          email: currentUser.email || apiUserData?.email || "",
          phone: currentUser.phone || apiUserData?.phone || "",
          title: getRoleDisplayName() || currentUser.role || "",
          department:
            currentUser.department || apiUserData?.department || "MANAGEMENT",
          location: apiUserData?.location || currentUser.location || "",
          timezone: apiUserData?.timezone || "America/New_York",
          bio: apiUserData?.bio || "",
          joinDate:
            apiUserData?.createdAt ||
            currentUser.createdAt ||
            new Date().toISOString(),
          lastLogin:
            apiUserData?.lastLogin ||
            currentUser.lastLogin ||
            new Date().toISOString(),
          avatar: apiUserData?.avatar || currentUser.avatar || null,
        };

        setProfileData(userData);
        setEditData(userData);
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error("Error in fetchUserProfile:", error);
        setError("Failed to load profile data");
      } finally {
        setIsFetching(false);
      }
    };

    fetchUserProfile();
  }, [currentUser, getRoleDisplayName]);

  // Fetch user activities
  const fetchUserActivities = async () => {
    if (!currentUser) return;

    try {
      setIsLoadingActivities(true);
      setActivitiesError(null);

      const response = await AuthService.apiRequest("/auth/activities");

      if (response.success) {
        setActivities(response.activities || []);
      } else {
        throw new Error(response.message || "Failed to fetch activities");
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      setActivitiesError("Failed to load activities");
      // Set fallback activities in case of error
      setActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // Load activities when the activity tab is accessed
  useEffect(() => {
    if (
      activeTab === "activity" &&
      activities.length === 0 &&
      !isLoadingActivities
    ) {
      fetchUserActivities();
    }
  }, [activeTab, currentUser]);

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Validate field on change for immediate feedback
    const fieldErrors = validateField(field, value);
    if (Object.keys(fieldErrors).length > 0) {
      setValidationErrors((prev) => ({
        ...prev,
        ...fieldErrors,
      }));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate form
      if (!validateForm()) {
        setIsLoading(false);
        return;
      }

      // Prepare update data
      const updateData = {
        firstName: editData.firstName.trim(),
        lastName: editData.lastName.trim(),
        phone: editData.phone.trim(),
        location: editData.location.trim(),
        timezone: editData.timezone,
        bio: editData.bio.trim(),
      };

      // Call API to update profile
      const response = await AuthService.apiRequest("/auth/update-profile", {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      if (response.success) {
        setProfileData({ ...editData });
        setIsEditing(false);
        setSuccessMessage("Profile updated successfully!");

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);

        // Update user context if needed
        const updatedUser = {
          ...currentUser,
          firstName: editData.firstName,
          lastName: editData.lastName,
          name: `${editData.firstName} ${editData.lastName}`.trim(),
        };

        // Store updated user data
        AuthService.setUserData(updatedUser);
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setError(error.message || "Failed to save profile changes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({ ...profileData });
    setValidationErrors({});
    setError(null);
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("Image size must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    setError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("avatar", file);

      // Upload avatar
      const response = await AuthService.apiRequest("/auth/upload-avatar", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header, let the browser set it for FormData
        headers: {
          Authorization: `Bearer ${AuthService.getToken()}`,
        },
      });

      if (response.success) {
        // Update profile data with new avatar URL
        const updatedProfileData = {
          ...profileData,
          avatar: response.avatarUrl,
        };

        setProfileData(updatedProfileData);
        setEditData(updatedProfileData);
        setSuccessMessage("Avatar updated successfully!");

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.message || "Failed to upload avatar");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      setError(error.message || "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    return errors;
  };

  const handlePasswordChange = async () => {
    setPasswordErrors({});

    // Validate passwords
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required";
    } else {
      const passwordValidationErrors = validatePassword(
        passwordData.newPassword
      );
      if (passwordValidationErrors.length > 0) {
        errors.newPassword = passwordValidationErrors[0];
      }
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await AuthService.apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.success) {
        setSuccessMessage("Password changed successfully!");
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswords({
          current: false,
          new: false,
          confirm: false,
        });

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Password change error:", error);
      setPasswordErrors({
        submit: error.message || "Failed to change password",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "activity", label: "Activity", icon: Activity },
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatLastLogin = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return formatDate(dateString);
  };

  const formatActivityTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return diffInMinutes <= 1 ? "Just now" : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
    } else {
      return formatDate(timestamp);
    }
  };

  const getActivityIcon = (type, activityType) => {
    switch (type) {
      case "PROFILE":
        return activityType === "AVATAR_UPLOAD" ? Camera : User;
      case "SECURITY":
        return Key;
      case "AUTH":
        return Shield;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "PROFILE":
        return "text-purple-600 bg-purple-100";
      case "SECURITY":
        return "text-blue-600 bg-blue-100";
      case "AUTH":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Show loading state while fetching user data
  if (isFetching) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <span className="text-gray-600">Loading profile...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no user data
  if (!currentUser) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Authentication Required
              </h3>
              <p className="text-gray-600">
                Please log in to view your profile.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {successMessage && (
        <div className="glass-card rounded-2xl p-4 border-l-4 border-green-500 bg-green-50">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="glass-card rounded-2xl p-4 border-l-4 border-red-500 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                {profileData.avatar ? (
                  <img
                    src={profileData.avatar}
                    alt="Profile"
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
                {isUploadingAvatar ? (
                  <Loader2 className="w-3 h-3 text-gray-600 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3 text-gray-600" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profileData.firstName} {profileData.lastName}
              </h1>
              <p className="text-gray-600">{profileData.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">
                  Online
                </span>
                <span className="text-sm text-gray-500">
                  • Last login {formatLastLogin(profileData.lastLogin)}
                </span>
              </div>
            </div>
          </div>

          {!isEditing &&
          (hasPermission("profile") ||
            hasDetailedPermission("profile", "update")) ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          ) : !isEditing ? (
            <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
              <Shield className="w-4 h-4 inline mr-2" />
              Read-only access
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-2xl p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={editData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          validationErrors.firstName
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300"
                        }`}
                      />
                      {validationErrors.firstName && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.firstName}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900">{profileData.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={editData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          validationErrors.lastName
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300"
                        }`}
                      />
                      {validationErrors.lastName && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.lastName}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900">{profileData.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-900">{profileData.email}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Contact support to change your email address
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          validationErrors.phone
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter your phone number"
                      />
                      {validationErrors.phone && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.phone}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-900">
                        {profileData.phone || "Not provided"}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-900">{profileData.department}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your location"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-900">
                        {profileData.location || "Not provided"}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.timezone}
                      onChange={(e) =>
                        handleInputChange("timezone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="America/New_York">
                        Eastern Time (EST)
                      </option>
                      <option value="America/Chicago">
                        Central Time (CST)
                      </option>
                      <option value="America/Denver">
                        Mountain Time (MST)
                      </option>
                      <option value="America/Los_Angeles">
                        Pacific Time (PST)
                      </option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-900">Eastern Time (EST)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bio</h3>
              {isEditing ? (
                <div>
                  <textarea
                    value={editData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      validationErrors.bio
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Tell us about yourself..."
                  />
                  <div className="flex justify-between items-center mt-1">
                    {validationErrors.bio ? (
                      <p className="text-sm text-red-600">
                        {validationErrors.bio}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {editData.bio?.length || 0}/500 characters
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  {profileData.bio || "No bio provided."}
                </p>
              )}
            </div>

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Member Since
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(profileData.joinDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Last Login
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatLastLogin(profileData.lastLogin)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Key className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Password
                    </h4>
                    <p className="text-sm text-gray-600">
                      Manage your password
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Last changed 30 days ago
                </p>
                {hasPermission("profile") ||
                hasDetailedPermission("profile", "changePassword") ? (
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Change Password
                  </button>
                ) : (
                  <div className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-center">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Password change not allowed
                  </div>
                )}
              </div>

              {/* Sessions */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Active Sessions
                    </h4>
                    <p className="text-sm text-gray-600">
                      Manage your sessions
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">3 active sessions</p>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  View Sessions
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Activity Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Activity
                </h3>
                <p className="text-sm text-gray-600">
                  Your account activity and actions
                </p>
              </div>
              <button
                onClick={fetchUserActivities}
                disabled={isLoadingActivities}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isLoadingActivities ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Refresh"
                )}
              </button>
            </div>

            {/* Activity Error */}
            {activitiesError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-600">{activitiesError}</p>
                </div>
              </div>
            )}

            {/* Activity Loading State */}
            {isLoadingActivities && activities.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                  <span className="text-gray-600">Loading activities...</span>
                </div>
              </div>
            )}

            {/* Activity List */}
            {!isLoadingActivities && activities.length > 0 && (
              <div className="space-y-3">
                {activities.map((activity) => {
                  const ActivityIcon = getActivityIcon(
                    activity.type,
                    activity.activityType
                  );
                  const colorClass = getActivityColor(activity.type);

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 glass-card rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}
                      >
                        <ActivityIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {activity.action}
                            </p>
                            {activity.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {activity.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatActivityTime(activity.timestamp)}
                              </span>
                              {activity.ipAddress && (
                                <span className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  {activity.ipAddress}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              activity.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : activity.status === "SCHEDULED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!isLoadingActivities &&
              activities.length === 0 &&
              !activitiesError && (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Activities Yet
                  </h3>
                  <p className="text-gray-600">
                    Your account activities will appear here once you start
                    using the platform.
                  </p>
                </div>
              )}
          </motion.div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center !mt-0 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Change Password
                </h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPasswordErrors({});
                    setShowPasswords({
                      current: false,
                      new: false,
                      confirm: false,
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        passwordErrors.currentPassword
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your current password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("current")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        passwordErrors.newPassword
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("new")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.newPassword}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters with uppercase,
                    lowercase, number, and special character
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        passwordErrors.confirmPassword
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirm")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Submit Error */}
                {passwordErrors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">
                      {passwordErrors.submit}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPasswordErrors({});
                    setShowPasswords({
                      current: false,
                      new: false,
                      confirm: false,
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
