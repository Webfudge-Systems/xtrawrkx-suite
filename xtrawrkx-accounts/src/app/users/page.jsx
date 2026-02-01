"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Button,
  Input,
  Card,
  Badge,
  Select,
  Modal,
  Table,
} from "@/components/ui";
import {
  Loader2,
  Plus,
  Users,
  Mail,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Search,
  Filter,
  Edit,
  Building,
  Phone,
  Clock,
  TrendingUp,
  AlertTriangle,
  Trash2,
  X,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import strapiClient from "@/lib/strapiClient";
import PermissionsService from "@/lib/permissionsService";
import RouteGuard from "@/components/RouteGuard";
import Link from "next/link";

function UserManagementPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    recent: 0,
  });

  useEffect(() => {
    checkUserPermissions();
    fetchUsers();
    fetchAvailableRoles();
    fetchDepartments();
    fetchDashboardStats();
  }, []);

  // Fetch dashboard stats to get accurate total user count (all users, not just editable)
  const fetchDashboardStats = async () => {
    try {
      const AuthService = (await import("@/lib/authService")).default;
      const response = await AuthService.apiRequest("/dashboard/stats");
      if (response.success && response.data) {
        // Update stats with dashboard data (includes all users, active and inactive)
        setStats(prevStats => ({
          total: response.data.totalUsers || 0, // All users (active + inactive)
          active: response.data.activeUsers || 0, // Only active users
          inactive: (response.data.totalUsers || 0) - (response.data.activeUsers || 0), // Calculate inactive
          recent: prevStats.recent, // Keep recent count from local calculation
        }));
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Fall back to local calculation if dashboard stats fail
    }
  };

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-dismiss error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const checkUserPermissions = async () => {
    try {
      const user = await getCurrentUser();

      // For development, allow access if user exists (temporary fix)
      if (!user) {

        // Check for currentUser in localStorage (your actual structure)
        const currentUserData = localStorage.getItem("currentUser");
        if (currentUserData) {
          const parsedUser = JSON.parse(currentUserData);

          // Convert to the expected format
          const userObj = {
            id: 1, // Default ID
            email: parsedUser.email,
            firstName: parsedUser.name.split(" ")[0] || "Admin",
            lastName: parsedUser.name.split(" ")[1] || "User",
            role: parsedUser.role, // Keep the role as-is (already mapped correctly from login)
            department: "MANAGEMENT",
            isActive: true,
            emailVerified: true,
          };

          setCurrentUser(userObj);
          setLoading(false);
          return;
        }

        setError("Please login first");
        setLoading(false);
        return;
      }

      // Check if user has admin permissions using the new role system
      const hasAdminAccess =
        user.user.role === "Super Admin" ||
        user.user.role === "Admin" ||
        user.user.role === "ADMIN"; // Fallback for old system

      if (user.type !== "internal" || !hasAdminAccess) {
        setError("Access denied. Admin privileges required.");
        setLoading(false);
        return;
      }
      setCurrentUser(user.user);
    } catch (error) {
      console.error("Permission check error:", error);
      // For development, try to use cached data from currentUser
      const currentUserData = localStorage.getItem("currentUser");
      if (currentUserData) {
        const parsedUser = JSON.parse(currentUserData);

        // Convert to the expected format
        const userObj = {
          id: 1, // Default ID
          email: parsedUser.email,
          firstName: parsedUser.name.split(" ")[0] || "Admin",
          lastName: parsedUser.name.split(" ")[1] || "User",
          role: parsedUser.role.toUpperCase(),
          department: "MANAGEMENT",
          isActive: true,
          emailVerified: true,
        };

        setCurrentUser(userObj);
      } else {
        setError("Failed to verify permissions: " + error.message);
      }
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      // Use AuthService to get authenticated token
      const AuthService = (await import("@/lib/authService")).default;
      const token = await AuthService.refreshTokenIfNeeded();

      if (!token) {
        // Always redirect to login when no token (same behavior as production)
        router.push("/auth/login");
        return;
      }


      // Fetch users using AuthService with populated roles
      // Use the editable users endpoint to get only users that current user can edit
      let data;
      try {
        // Try to use the hierarchical endpoint first
        data = await AuthService.apiRequest("/user-management/editable-users");

        // Transform the response from the hierarchical endpoint
        if (data.success && data.users) {
          const transformedUsers = data.users.map((user) => {
            // Handle department transformation
            let departmentData = null;
            if (user.department) {
              if (typeof user.department === "object") {
                // Handle object format
                departmentData = {
                  id:
                    user.department.id ||
                    (typeof user.department === "number"
                      ? user.department
                      : null),
                  name:
                    user.department.name ||
                    user.department.attributes?.name ||
                    null,
                  color:
                    user.department.color ||
                    user.department.attributes?.color ||
                    null,
                };
              } else if (
                typeof user.department === "number" ||
                typeof user.department === "string"
              ) {
                // If it's just an ID, we'll look it up later in getDepartmentInfo
                departmentData =
                  typeof user.department === "string"
                    ? parseInt(user.department)
                    : user.department;
              }
            }

            return {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              department: departmentData,
              phone: user.phone,
              isActive: user.isActive,
              emailVerified: user.emailVerified,
              lastLoginAt: user.lastLoginAt,
              createdAt: user.createdAt,
              userRoles: [], // Will be populated separately if needed
              canEdit: user.canEdit || true, // All users from this endpoint are editable
            };
          });

          setUsers(transformedUsers);
          // Only calculate recent users, total/active/inactive come from dashboard stats
          const now = new Date();
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const recent = transformedUsers.filter((u) => {
            const createdAt = u.createdAt ? new Date(u.createdAt) : null;
            return createdAt && createdAt >= sevenDaysAgo;
          }).length;
          setStats(prevStats => ({ ...prevStats, recent }));
          return;
        }
      } catch (hierarchicalError) {
      }

      // Fallback to regular endpoint - ensure department is fully populated
      data = await AuthService.apiRequest(
        "/xtrawrkx-users?populate[primaryRole]=*&populate[userRoles]=*&populate[department]=*"
      );

      // Transform Strapi data to expected format
      const transformedUsers = (data.data || []).map((item) => {
        // Handle department transformation with better error handling
        let departmentData = null;
        const deptSource =
          item.attributes?.department?.data ||
          item.attributes?.department ||
          item.department;

        if (deptSource) {
          if (typeof deptSource === "object") {
            // Strapi v4 format: { id, attributes: { name, color } }
            if (deptSource.attributes) {
              departmentData = {
                id: deptSource.id,
                name: deptSource.attributes.name || null,
                color: deptSource.attributes.color || null,
              };
            }
            // Simplified format: { id, name, color }
            else if (deptSource.name || deptSource.id) {
              departmentData = {
                id: deptSource.id || deptSource,
                name: deptSource.name || null,
                color: deptSource.color || null,
              };
            }
          } else if (
            typeof deptSource === "number" ||
            typeof deptSource === "string"
          ) {
            // Just an ID - will be looked up in getDepartmentInfo
            departmentData =
              typeof deptSource === "string"
                ? parseInt(deptSource)
                : deptSource;
          }
        }

        return {
          id: item.id,
          email: item.attributes?.email || item.email,
          firstName: item.attributes?.firstName || item.firstName,
          lastName: item.attributes?.lastName || item.lastName,
          role:
            item.attributes?.primaryRole?.data?.attributes?.name || "No Role",
          primaryRole: item.attributes?.primaryRole?.data || null,
          department: departmentData,
          phone: item.attributes?.phone || item.phone,
          isActive:
            item.attributes?.isActive !== undefined
              ? item.attributes.isActive
              : item.isActive !== undefined
              ? item.isActive
              : true,
          emailVerified:
            item.attributes?.emailVerified || item.emailVerified || false,
          lastLoginAt: item.attributes?.lastLoginAt || item.lastLoginAt,
          createdAt: item.attributes?.createdAt || item.createdAt,
          userRoles: item.attributes?.userRoles?.data || item.userRoles || [],
        };
      });

      setUsers(transformedUsers);

      // Only calculate recent users, total/active/inactive come from dashboard stats
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recent = transformedUsers.filter((u) => {
        const createdAt = u.createdAt ? new Date(u.createdAt) : null;
        return createdAt && createdAt >= sevenDaysAgo;
      }).length;
      setStats(prevStats => ({ ...prevStats, recent }));
      setError(""); // Clear any previous errors
    } catch (error) {
      console.error("Fetch users error:", error);
      setError(`Unable to load users: ${error.message}`);

      // Don't show demo data anymore - just show empty state
      setUsers([]);
      setStats(prevStats => ({ ...prevStats, recent: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRoles = async () => {
    try {
      const AuthService = (await import("@/lib/authService")).default;
      const token = await AuthService.refreshTokenIfNeeded();

      if (!token) {
        return;
      }

      const data = await AuthService.apiRequest("/user-roles");
      setAvailableRoles(data.data || []);
    } catch (error) {
      console.error("Fetch roles error:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const AuthService = (await import("@/lib/authService")).default;
      const departmentsData = await AuthService.getDepartments();

      // Transform departments from Strapi format if needed
      const transformedDepartments = (departmentsData || []).map((dept) => {
        // Handle Strapi v4 format: { id: X, attributes: { name: "...", color: "..." } }
        if (dept.attributes) {
          return {
            id: dept.id,
            name: dept.attributes.name || dept.name,
            color: dept.attributes.color || dept.color,
          };
        }
        // Handle simplified format: { id: X, name: "...", color: "..." }
        return {
          id: dept.id,
          name: dept.name,
          color: dept.color,
        };
      });

      setDepartments(transformedDepartments);
    } catch (error) {
      console.error("Fetch departments error:", error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const calculateStats = (usersList) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const newStats = {
      total: usersList.length,
      active: usersList.filter((u) => u.isActive).length,
      inactive: usersList.filter((u) => !u.isActive).length,
      recent: usersList.filter((u) => {
        const createdAt = u.createdAt ? new Date(u.createdAt) : null;
        return createdAt && createdAt >= sevenDaysAgo;
      }).length,
    };

    setStats(newStats);
  };

  /**
   * Check if current user can edit a specific user based on role hierarchy
   */
  const canEditUser = (targetUser) => {
    if (!currentUser) return false;

    const currentUserRole = currentUser.role;
    const targetUserRole = targetUser.role;

    return PermissionsService.canEditUser(currentUserRole, targetUserRole);
  };

  /**
   * Check if current user can manage roles for a specific user
   */
  const canManageUserRoles = (targetUser) => {
    if (!currentUser) return false;

    const currentUserRole = currentUser.role;
    const targetUserRole = targetUser.role;

    return PermissionsService.canManageUserRoles(
      currentUserRole,
      targetUserRole
    );
  };

  /**
   * Check if current user can delete a specific user
   */
  const canDeleteUser = (targetUser) => {
    if (!currentUser) return false;

    // Can't delete yourself
    if (currentUser.id === targetUser.id) return false;

    const currentUserRole = currentUser.role;
    const targetUserRole = targetUser.role;

    // Can delete if you can edit the user (same permission level)
    return PermissionsService.canEditUser(currentUserRole, targetUserRole);
  };

  /**
   * Check if current user is admin or super admin
   */
  const isAdminOrSuperAdmin = () => {
    if (!currentUser) return false;
    const role = currentUser.role;
    return role === "Super Admin" || role === "Admin" || role === "ADMIN";
  };

  const handleEditUser = (user) => {
    // Check if current user can edit this user
    if (!canEditUser(user)) {
      setError("You don't have permission to edit this user");
      return;
    }

    // Ensure department is properly formatted for the edit form
    // Extract department ID if it's an object, otherwise keep as-is
    let departmentForEdit = user.department;
    if (user.department) {
      if (typeof user.department === "object" && user.department !== null) {
        // If department is an object with an ID, use the ID
        if (user.department.id !== undefined) {
          departmentForEdit = user.department.id;
        }
      }
      // If department is already a number or string ID, keep it as-is
      // (no transformation needed)
    }

    const formattedUser = {
      ...user,
      department: departmentForEdit,
      newPassword: "", // Initialize password field
    };

    setEditingUser(formattedUser);
    setShowPassword(false); // Reset password visibility
    setShowEditModal(true);
  };

  const handleManageRoles = (user) => {
    // Check if current user can manage roles for this user
    if (!canManageUserRoles(user)) {
      setError("You don't have permission to manage roles for this user");
      return;
    }

    setEditingUser(user);
    // Handle both data structures (attributes.id and direct id)
    const currentRoleIds =
      user.userRoles?.map((role) => role.attributes?.id || role.id) || [];
    setUserRoles(currentRoleIds);
    setShowRolesModal(true);
  };

  const handleDeleteUser = (user) => {
    // Check if current user can delete this user
    if (!canDeleteUser(user)) {
      setError("You don't have permission to delete this user");
      return;
    }

    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const AuthService = (await import("@/lib/authService")).default;
      const deletedUserId = deletingUser.id;

      const response = await AuthService.apiRequest(
        `/xtrawrkx-users/${deletingUser.id}`,
        {
          method: "DELETE",
        }
      );


      // Immediately remove from UI for better UX
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== deletedUserId)
      );

      // Close modal
      setShowDeleteModal(false);
      setDeletingUser(null);

      // Show success message
      setSuccess("User deleted successfully!");

      // Wait a moment then refresh to ensure consistency
      setTimeout(async () => {
        try {
          await fetchUsers();
        } catch (refreshError) {
          console.error("Error refreshing after delete:", refreshError);
          // Don't show error to user since delete already succeeded
        }
      }, 500);
    } catch (error) {
      console.error("Delete user error:", error);
      setError("Failed to delete user: " + error.message);
      // Refresh users list in case of error to get accurate state
      await fetchUsers();
    } finally {
      setCreating(false);
    }
  };

  const handleRoleToggle = (roleId) => {
    setUserRoles((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const handleUpdateUserRoles = async () => {
    if (!editingUser) return;

    setCreating(true);
    setError("");

    try {
      const AuthService = (await import("@/lib/authService")).default;

      // For each role, update the user assignments
      for (const role of availableRoles) {
        const shouldHaveRole = userRoles.includes(role.id);
        const currentlyHasRole = editingUser.userRoles?.some(
          (ur) => (ur.attributes?.id || ur.id) === role.id
        );

        if (shouldHaveRole !== currentlyHasRole) {
          try {
            // Get current users for this role
            const roleData = await AuthService.apiRequest(
              `/user-roles/${role.id}`
            );
            const currentUserIds = roleData.data?.users?.map((u) => u.id) || [];

            let updatedUserIds;
            if (shouldHaveRole) {
              // Add user to role
              updatedUserIds = [
                ...new Set([...currentUserIds, editingUser.id]),
              ];
            } else {
              // Remove user from role
              updatedUserIds = currentUserIds.filter(
                (id) => id !== editingUser.id
              );
            }

            // Update the role with new user assignments
            await AuthService.apiRequest(
              `/user-roles/${role.id}/assign-users`,
              {
                method: "POST",
                body: JSON.stringify({ userIds: updatedUserIds }),
              }
            );
          } catch (roleError) {
            console.warn(
              `Failed to update role ${role.name}:`,
              roleError.message
            );
            // Continue with other roles instead of failing completely
          }
        }
      }

      setSuccess("User roles updated successfully!");
      setShowRolesModal(false);
      setEditingUser(null);
      setUserRoles([]);
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error("Update user roles error:", error);
      setError("Failed to update user roles: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      // Use AuthService for authenticated API request
      const AuthService = (await import("@/lib/authService")).default;

      // Format department correctly for Strapi relation
      // Strapi v4 may require department as ID or { connect: [id] } format
      let departmentValue = null;
      if (editingUser.department) {
        // If department is an object, get the ID
        if (
          typeof editingUser.department === "object" &&
          editingUser.department.id
        ) {
          departmentValue =
            typeof editingUser.department.id === "string"
              ? parseInt(editingUser.department.id)
              : editingUser.department.id;
        }
        // If department is already an ID (number or string)
        else if (
          typeof editingUser.department === "number" ||
          typeof editingUser.department === "string"
        ) {
          departmentValue =
            typeof editingUser.department === "string"
              ? parseInt(editingUser.department)
              : editingUser.department;
        }
      }

      // Ensure departmentValue is a number or null
      if (departmentValue !== null && isNaN(departmentValue)) {
        console.warn("Invalid department value:", editingUser.department);
        departmentValue = null;
      }

      // Format department for Strapi - try both formats
      // First try simple ID format, if that doesn't work, try connect format
      const departmentField = departmentValue !== null ? departmentValue : null;

      const updateData = {
        data: {
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          email: editingUser.email,
          primaryRole: editingUser.primaryRole?.id || null,
          department: departmentField,
          phone: editingUser.phone,
          isActive: editingUser.isActive,
        },
      };

      // Add password if provided (only for admins/super admins)
      if (editingUser.newPassword && editingUser.newPassword.trim() !== "") {
        // Validate password length
        if (editingUser.newPassword.length < 8) {
          setError("Password must be at least 8 characters long");
          setCreating(false);
          return;
        }
        updateData.data.password = editingUser.newPassword;
      }


      // Update user with populated department in response
      const response = await AuthService.apiRequest(
        `/xtrawrkx-users/${editingUser.id}?populate[department]=*`,
        {
          method: "PUT",
          body: JSON.stringify(updateData),
        }
      );

      setSuccess("User updated successfully!");
      setShowEditModal(false);
      setEditingUser(null);
      setShowPassword(false);

      // Refresh the users list to show updated data
      setTimeout(async () => {
        try {
          await fetchUsers();
        } catch (refreshError) {
          console.error("Error refreshing users:", refreshError);
        }
      }, 500);
    } catch (error) {
      console.error("User update error:", error);
      setError("Failed to update user: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      "Super Admin": "bg-red-100 text-red-800",
      Admin: "bg-red-100 text-red-800",
      Manager: "bg-purple-100 text-purple-800",
      "Project Manager": "bg-blue-100 text-blue-800",
      "Sales Representative": "bg-green-100 text-green-800",
      Developer: "bg-gray-100 text-gray-800",
      Designer: "bg-pink-100 text-pink-800",
      // Legacy enum support
      ADMIN: "bg-red-100 text-red-800",
      MANAGER: "bg-purple-100 text-purple-800",
      PROJECT_MANAGER: "bg-blue-100 text-blue-800",
      SALES_REP: "bg-green-100 text-green-800",
      DEVELOPER: "bg-gray-100 text-gray-800",
      DESIGNER: "bg-pink-100 text-pink-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const getDepartmentInfo = (department) => {
    // Handle null/undefined
    if (!department) {
      return { name: "Unknown", color: "#6B7280" };
    }

    // Handle Strapi v4 format: { id: X, attributes: { name: "...", color: "..." } }
    if (typeof department === "object" && department.attributes?.name) {
      return {
        name: department.attributes.name,
        color: department.attributes.color || "#6B7280",
      };
    }

    // Handle simplified object format: { id: X, name: "...", color: "..." }
    if (typeof department === "object" && department.name) {
      return {
        name: department.name,
        color: department.color || "#6B7280",
      };
    }

    // Handle department ID - try to find in departments list
    if (
      typeof department === "number" ||
      (typeof department === "string" && !isNaN(department))
    ) {
      const deptId =
        typeof department === "string" ? parseInt(department) : department;
      const foundDept = departments.find((d) => d.id === deptId);
      if (foundDept) {
        return {
          name: foundDept.name,
          color: foundDept.color || "#6B7280",
        };
      }
    }

    // Fallback for string department codes (legacy support)
    const departmentMap = {
      MANAGEMENT: { name: "Management", color: "#EF4444" },
      SALES: { name: "Sales", color: "#10B981" },
      DELIVERY: { name: "Delivery", color: "#3B82F6" },
      DEVELOPMENT: { name: "Development", color: "#8B5CF6" },
      DESIGN: { name: "Design", color: "#EC4899" },
    };

    if (departmentMap[department]) {
      return departmentMap[department];
    }

    // Last resort - return Unknown
    return {
      name: "Unknown",
      color: "#6B7280",
    };
  };

  const getDepartmentBadgeColor = (department) => {
    const deptInfo = getDepartmentInfo(department);
    return `bg-[${deptInfo.color}]/10 text-[${deptInfo.color}]`;
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesDepartment =
      filterDepartment === "all" ||
      (typeof user.department === "object"
        ? user.department?.id
        : user.department) === filterDepartment;

    return matchesSearch && matchesRole && matchesDepartment;
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-8 text-center"
        >
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-gray-600">Checking permissions...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                User Management
              </h1>
              <p className="text-gray-600">
                Manage internal Xtrawrkx users and permissions
              </p>
            </div>
          </div>

          <Link href="/users/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300">
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Total Users",
            value: stats.total,
            change: "+12%",
            icon: Users,
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-100",
            textColor: "text-blue-600",
          },
          {
            title: "Active Users",
            value: stats.active,
            change: "+8%",
            icon: UserCheck,
            color: "from-green-500 to-green-600",
            bgColor: "bg-green-100",
            textColor: "text-green-600",
          },
          {
            title: "Inactive Users",
            value: stats.inactive,
            change: "0%",
            icon: UserX,
            color: "from-red-500 to-red-600",
            bgColor: "bg-red-100",
            textColor: "text-red-600",
          },
          {
            title: "New This Week",
            value: stats.recent,
            change: "+15%",
            icon: TrendingUp,
            color: "from-purple-500 to-purple-600",
            bgColor: "bg-purple-100",
            textColor: "text-purple-600",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {stat.change} from last month
                </p>
              </div>
              <div
                className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 border border-gray-200"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 border border-gray-200"
            >
              <option value="all">All Roles</option>
              {availableRoles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
              <option value="No Role">No Role</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 border border-gray-200"
              disabled={loadingDepartments}
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Alerts */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass-card rounded-2xl p-4 border-l-4 border-red-500 bg-red-50"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="flex-shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors"
              aria-label="Close error message"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass-card rounded-2xl p-4 border-l-4 border-green-500 bg-green-50"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-green-600" />
              <p className="text-green-700 font-medium">{success}</p>
            </div>
            <button
              onClick={() => setSuccess("")}
              className="flex-shrink-0 p-1 hover:bg-green-100 rounded-full transition-colors"
              aria-label="Close success message"
            >
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">
            Internal Users ({filteredUsers.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterRole !== "all" || filterDepartment !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first user"}
            </p>
            {users.length === 0 && (
              <Link href="/users/new">
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add First User
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Department
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Custom Roles
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Last Login
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          <Shield className="w-3 h-3" />
                          {user.role}
                        </span>
                        {currentUser &&
                          PermissionsService.getRoleLevel(currentUser.role) <=
                            PermissionsService.getRoleLevel(user.role) && (
                            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full font-medium">
                              Same/Higher Level
                            </span>
                          )}
                      </div>
                      {user.primaryRole && (
                        <div className="text-xs text-gray-500 mt-1">
                          Primary Role
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getDepartmentBadgeColor(
                          user.department
                        )}`}
                      >
                        <Building className="w-3 h-3" />
                        {(() => {
                          const info = getDepartmentInfo(user.department);
                          return info.name;
                        })()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.userRoles && user.userRoles.length > 0 ? (
                          user.userRoles.slice(0, 2).map((role) => (
                            <span
                              key={role.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              <Shield className="w-3 h-3" />
                              {role.attributes?.name || role.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">
                            No custom roles
                          </span>
                        )}
                        {user.userRoles && user.userRoles.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{user.userRoles.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm flex items-center gap-1 text-gray-600">
                        <Clock className="w-3 h-3" />
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : "Never"}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {canEditUser(user) && (
                          <button
                            onClick={() => handleEditUser(user)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                        {canManageUserRoles(user) && (
                          <button
                            onClick={() => handleManageRoles(user)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Shield className="w-3 h-3" />
                            Roles
                          </button>
                        )}
                        {canDeleteUser(user) && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                        {!canEditUser(user) &&
                          !canManageUserRoles(user) &&
                          !canDeleteUser(user) && (
                            <span className="text-xs text-gray-400 italic">
                              No permissions
                            </span>
                          )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
          setShowPassword(false);
        }}
        title="Edit User"
        size="md"
      >
        <p className="text-sm text-gray-600 mb-4">
          Update user information and permissions
        </p>

        {editingUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="editFirstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <Input
                  id="editFirstName"
                  value={editingUser.firstName}
                  onChange={(e) =>
                    setEditingUser((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="editLastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <Input
                  id="editLastName"
                  value={editingUser.lastName}
                  onChange={(e) =>
                    setEditingUser((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="editEmail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <Input
                id="editEmail"
                type="email"
                value={editingUser.email}
                onChange={(e) =>
                  setEditingUser((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="editPhone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone (Optional)
              </label>
              <Input
                id="editPhone"
                value={editingUser.phone || ""}
                onChange={(e) =>
                  setEditingUser((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
              />
            </div>

            {/* Password Field - Only visible for Admin/Super Admin */}
            {isAdminOrSuperAdmin() && (
              <div className="space-y-2">
                <label
                  htmlFor="editPassword"
                  className="flex text-sm font-medium text-gray-700 mb-1 items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  New Password (Optional)
                </label>
                <div className="relative">
                  <Input
                    id="editPassword"
                    type={showPassword ? "text" : "password"}
                    value={editingUser.newPassword || ""}
                    onChange={(e) =>
                      setEditingUser((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Leave empty to keep current password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Minimum 8 characters. Leave empty to keep current password.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="editPrimaryRole"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Primary Role
                </label>
                <Select
                  value={editingUser.primaryRole?.id || ""}
                  onChange={(value) => {
                    const selectedRole = availableRoles.find(
                      (role) => role.id === parseInt(value)
                    );
                    setEditingUser((prev) => ({
                      ...prev,
                      primaryRole: selectedRole || null,
                      role: selectedRole?.name || "No Role",
                    }));
                  }}
                  options={[
                    { value: "", label: "No Primary Role" },
                    ...availableRoles
                      .filter((role) => {
                        // Only show roles that current user can assign
                        const currentUserRole = currentUser?.role;
                        return PermissionsService.canAssignRole(
                          currentUserRole,
                          role.name
                        );
                      })
                      .map((role) => ({
                        value: role.id.toString(),
                        label: role.name,
                      })),
                  ]}
                  placeholder="Select primary role"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="editDepartment"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Department
                </label>
                <Select
                  value={(() => {
                    if (
                      typeof editingUser.department === "object" &&
                      editingUser.department !== null
                    ) {
                      return editingUser.department?.id?.toString() || "";
                    } else if (
                      editingUser.department !== null &&
                      editingUser.department !== undefined
                    ) {
                      return editingUser.department.toString();
                    } else {
                      return "";
                    }
                  })()}
                  onChange={(value) => {
                    const deptId = value ? parseInt(value) : null;
                    setEditingUser((prev) => ({
                      ...prev,
                      department: deptId,
                    }));
                  }}
                  options={departments.map((dept) => ({
                    value: dept.id.toString(),
                    label: dept.name,
                  }))}
                  placeholder="Select department"
                  required
                  disabled={loadingDepartments}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={editingUser.isActive}
                onChange={(e) =>
                  setEditingUser((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <label
                htmlFor="editIsActive"
                className="text-sm font-medium text-gray-700"
              >
                Active User
              </label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating} className="px-4 py-2">
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update User"
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Manage User Roles Modal */}
      <Modal
        isOpen={showRolesModal}
        onClose={() => {
          setShowRolesModal(false);
          setEditingUser(null);
          setUserRoles([]);
        }}
        title={`Manage Roles - ${editingUser?.firstName} ${editingUser?.lastName}`}
        size="md"
      >
        <p className="text-sm text-gray-600 mb-4">
          Assign custom roles to enhance or override the user's default role
          permissions
        </p>

        {editingUser && (
          <div className="space-y-4">
            {/* Current Primary Role */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Primary Role</h4>
              {editingUser.primaryRole ? (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                    editingUser.primaryRole.name
                  )}`}
                >
                  <Shield className="w-3 h-3" />
                  {editingUser.primaryRole.name}
                </span>
              ) : (
                <span className="text-sm text-gray-500">
                  No primary role assigned
                </span>
              )}
              <p className="text-xs text-gray-600 mt-1">
                The primary role defines the user's main permissions. You can
                change this in the Edit User dialog.
              </p>
            </div>

            {/* Custom Roles */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Custom Roles</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableRoles
                  .filter((role) => {
                    // Filter roles based on what current user can assign
                    const currentUserRole = currentUser?.role;
                    return PermissionsService.canAssignRole(
                      currentUserRole,
                      role.name
                    );
                  })
                  .map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={userRoles.includes(role.id)}
                        onChange={() => handleRoleToggle(role.id)}
                        className="rounded"
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
                        <p className="text-sm text-gray-600">
                          {role.description}
                        </p>
                      </div>
                    </label>
                  ))}
                {availableRoles.filter((role) => {
                  const currentUserRole = currentUser?.role;
                  return PermissionsService.canAssignRole(
                    currentUserRole,
                    role.name
                  );
                }).length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No roles available for assignment</p>
                    <p className="text-xs text-gray-400 mt-1">
                      You can only assign roles lower than your current level
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setShowRolesModal(false);
                  setEditingUser(null);
                  setUserRoles([]);
                }}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUserRoles}
                disabled={creating}
                className="px-4 py-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Roles"
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingUser(null);
        }}
        title="Delete User"
        size="md"
      >
        {deletingUser && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Are you sure you want to delete this user?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This action cannot be undone. The user{" "}
                  <span className="font-semibold text-gray-900">
                    {deletingUser.firstName} {deletingUser.lastName}
                  </span>{" "}
                  ({deletingUser.email}) will be permanently removed from the
                  system.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> All user data, including
                    assignments, roles, and associated records will be deleted.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 pr-0 border-t border-gray-200">
              <Button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingUser(null);
                }}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2"
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteUser}
                disabled={creating}
                className="bg-red-600 text-white hover:bg-red-700 px-4 py-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete User
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Export with route protection - requires Manager level access
export default function ProtectedUserManagementPage() {
  return (
    <RouteGuard requiredLevel="Manager">
      <UserManagementPage />
    </RouteGuard>
  );
}
