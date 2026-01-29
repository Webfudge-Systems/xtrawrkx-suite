"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  UserPlus,
  Mail,
  Phone,
  Shield,
  Building,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Plus,
  Minus,
} from "lucide-react";
import AuthService from "../../../lib/authService";
import RouteGuard from "@/components/RouteGuard";
import PermissionsService from "@/lib/permissionsService";

// Departments will be fetched dynamically from the API

function NewUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    primaryRole: "",
    department: "",
    isActive: true,
    sendInvitation: true,
  });

  const [availableRoles, setAvailableRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [selectedCustomRoles, setSelectedCustomRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  useEffect(() => {
    getCurrentUserRole();
    fetchAvailableRoles();
    fetchAvailableDepartments();
  }, []);

  useEffect(() => {
    if (currentUserRole && availableRoles.length > 0) {
      filterRolesForCurrentUser(availableRoles);
    }
  }, [currentUserRole, availableRoles]);

  const getCurrentUserRole = () => {
    try {
      const userData = localStorage.getItem("currentUser");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setCurrentUserRole(parsedUser.role);
      }
    } catch (error) {
      console.error("Error getting current user role:", error);
    }
  };

  const fetchAvailableRoles = async () => {
    try {
      setLoadingRoles(true);
      const data = await AuthService.apiRequest("/user-roles");
      const allRoles = data.data || [];
      setAvailableRoles(allRoles);

      // Filter roles based on current user's permissions
      filterRolesForCurrentUser(allRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setErrors({ roles: "Failed to load available roles" });
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchAvailableDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const departments = await AuthService.getDepartments();
      setAvailableDepartments(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setErrors({ departments: "Failed to load available departments" });
    } finally {
      setLoadingDepartments(false);
    }
  };

  const filterRolesForCurrentUser = (allRoles) => {
    if (!currentUserRole) {
      // If no current user role, show all roles (fallback)
      setFilteredRoles(allRoles);
      return;
    }

    // Get assignable roles based on current user's role level
    const assignableRoles = allRoles.filter((role) => {
      // Use PermissionsService to check if current user can assign this role
      return PermissionsService.canAssignRole(currentUserRole, role.name);
    });


    setFilteredRoles(assignableRoles);
  };

  const handleCustomRoleToggle = (roleId) => {
    setSelectedCustomRoles((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.primaryRole) {
      newErrors.primaryRole = "Primary role is required";
    }

    if (!formData.department) {
      newErrors.department = "Department is required";
    }

    // Validate password (required)
    if (!formData.password || !formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Prepare user data for Strapi API
      const userData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        department: formData.department,
        sendInvitation: formData.sendInvitation,
      };

      // Add password (required)
      userData.password = formData.password;

      // Add primary role if selected
      if (formData.primaryRole) {
        userData.primaryRole = parseInt(formData.primaryRole);
      }

      // Create user via AuthService
      const response = await AuthService.apiRequest(
        "/user-management/create-user",
        {
          method: "POST",
          body: JSON.stringify(userData),
        }
      );

      // If user created successfully and has custom roles, assign them
      if (selectedCustomRoles.length > 0 && response.user) {
        try {
          // For each selected custom role, assign the user
          for (const roleId of selectedCustomRoles) {
            try {
              // Get current users for this role
              const roleData = await AuthService.apiRequest(
                `/user-roles/${roleId}`
              );
              const currentUserIds =
                roleData.data?.users?.map((u) => u.id) || [];

              // Add new user to the role
              const updatedUserIds = [
                ...new Set([...currentUserIds, response.user.id]),
              ];

              // Update the role with new user assignments
              await AuthService.apiRequest(
                `/user-roles/${roleId}/assign-users`,
                {
                  method: "POST",
                  body: JSON.stringify({ userIds: updatedUserIds }),
                }
              );
            } catch (roleError) {
              console.warn(
                `Failed to assign role ${roleId}:`,
                roleError.message
              );
              // Continue with other roles instead of failing completely
            }
          }
        } catch (rolesError) {
          console.warn("Some role assignments failed:", rolesError.message);
          // Don't fail the entire operation if role assignment fails
        }
      }

      setSuccessData(response);
      setSuccess(true);

      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push("/users");
      }, 2000);
    } catch (error) {
      console.error("Error creating user:", error);
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-8 text-center max-w-md"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            User Created Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            {formData.firstName} {formData.lastName} has been added to the
            system.
          </p>
          {successData && successData.sendInvitation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Invitation Sent
                </span>
              </div>
              <p className="text-sm text-blue-700">
                An invitation email has been sent to {formData.email} with login
                credentials.
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500">Redirecting to users list...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/users")}
            className="glass-button p-2 text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New User</h1>
            <p className="text-gray-600">
              Create a new user account with appropriate permissions
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.firstName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.lastName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter password (min 8 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Role & Department */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Role & Department
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Role *
              </label>
              {loadingRoles ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-gray-500">Loading roles...</span>
                </div>
              ) : (
                <select
                  value={formData.primaryRole}
                  onChange={(e) =>
                    handleInputChange("primaryRole", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.primaryRole ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select a primary role</option>
                  {filteredRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.primaryRole && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.primaryRole}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                The primary role defines the user's main permissions and access
                level.
              </p>
              {currentUserRole && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>Role Assignment:</strong> As a {currentUserRole},
                    you can only assign roles at a lower level than your own.
                  </p>
                </div>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              {loadingDepartments ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-gray-500">Loading departments...</span>
                </div>
              ) : (
                <select
                  value={formData.department}
                  onChange={(e) =>
                    handleInputChange("department", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.department ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select a department</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.department && (
                <p className="mt-1 text-sm text-red-600">{errors.department}</p>
              )}
              {errors.departments && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.departments}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Custom Roles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Custom Roles (Optional)
            </h2>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Assign additional custom roles to enhance or override the user's
            default permissions.
          </p>

          {loadingRoles ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">
                Loading available roles...
              </span>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredRoles.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No roles available for assignment
                </p>
              ) : (
                filteredRoles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCustomRoles.includes(role.id)}
                      onChange={() => handleCustomRoleToggle(role.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {role.name}
                        </span>
                        {role.isSystemRole && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            System
                          </span>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-sm text-gray-600">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          )}

          {selectedCustomRoles.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Selected Custom Roles ({selectedCustomRoles.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedCustomRoles.map((roleId) => {
                  const role = filteredRoles.find((r) => r.id === roleId);
                  return role ? (
                    <span
                      key={roleId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                    >
                      <Shield className="w-3 h-3" />
                      {role.name}
                      <button
                        type="button"
                        onClick={() => handleCustomRoleToggle(roleId)}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Account Settings
            </h2>
          </div>

          <div className="space-y-4">
            {/* Account Status */}
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    handleInputChange("isActive", e.target.checked)
                  }
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Account is active (user can log in)
                </span>
              </label>
            </div>

            {/* Send Invitation */}
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.sendInvitation}
                  onChange={(e) =>
                    handleInputChange("sendInvitation", e.target.checked)
                  }
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Send invitation email with login credentials
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-7">
                {formData.sendInvitation
                  ? "User will receive an email with their temporary password"
                  : "You will need to provide the user with their login credentials manually"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {errors.submit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4 border-l-4 border-red-500 bg-red-50"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 font-medium">Error creating user</p>
            </div>
            <p className="text-red-600 text-sm mt-1">{errors.submit}</p>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-end gap-4"
        >
          <button
            type="button"
            onClick={() => router.push("/users")}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating User...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create User
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
}

// Export with route protection - requires Manager level access
export default function ProtectedNewUserPage() {
  return (
    <RouteGuard requiredLevel="Manager">
      <NewUserPage />
    </RouteGuard>
  );
}
