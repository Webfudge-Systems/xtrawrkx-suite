"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Users,
  Crown,
  UserCog,
  Briefcase,
  DollarSign,
  TrendingUp,
  Wrench,
  Eye,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Settings,
} from "lucide-react";
import { Button, Input, Modal, Select } from "@/components/ui";
import strapiClient from "@/lib/strapiClient";
import RouteGuard from "@/components/RouteGuard";

// Icon mapping for roles
const iconMap = {
  Crown,
  Shield,
  UserCog,
  Briefcase,
  DollarSign,
  TrendingUp,
  Wrench,
  Settings,
};

function UserRolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRole, setDeletingRole] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [creating, setCreating] = useState(false);

  // New role form data
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    icon: "Shield",
    color: "from-gray-500 to-gray-600",
    rank: 10,
    visibility: "private",
    permissions: {},
  });

  const modules = [
    {
      id: "leads",
      name: "Leads",
      actions: ["create", "read", "update", "delete", "convert"],
    },
    {
      id: "accounts",
      name: "Accounts",
      actions: ["create", "read", "update", "delete"],
    },
    {
      id: "contacts",
      name: "Contacts",
      actions: ["create", "read", "update", "delete"],
    },
    {
      id: "deals",
      name: "Deals",
      actions: ["create", "read", "update", "delete"],
    },
    {
      id: "projects",
      name: "Projects",
      actions: ["create", "read", "update", "delete"],
    },
    {
      id: "tasks",
      name: "Tasks",
      actions: ["create", "read", "update", "delete"],
    },
    {
      id: "imports",
      name: "Imports",
      actions: ["create", "read", "update", "delete", "import"],
    },
    {
      id: "exports",
      name: "Exports",
      actions: ["create", "read", "update", "delete", "export"],
    },
    {
      id: "reports",
      name: "Reports",
      actions: ["create", "read", "update", "delete"],
    },
  ];

  const visibilityOptions = [
    {
      value: "private",
      label: "Private",
      description: "User's own records only",
    },
    { value: "team", label: "Team", description: "Team and subordinates" },
    { value: "org", label: "Organization", description: "All records" },
  ];

  const colorOptions = [
    { value: "from-red-500 to-red-600", label: "Red" },
    { value: "from-blue-500 to-blue-600", label: "Blue" },
    { value: "from-green-500 to-green-600", label: "Green" },
    { value: "from-purple-500 to-purple-600", label: "Purple" },
    { value: "from-orange-500 to-orange-600", label: "Orange" },
    { value: "from-indigo-500 to-indigo-600", label: "Indigo" },
    { value: "from-pink-500 to-pink-600", label: "Pink" },
    { value: "from-gray-500 to-gray-600", label: "Gray" },
  ];

  const iconOptions = [
    { value: "Shield", label: "Shield" },
    { value: "Crown", label: "Crown" },
    { value: "UserCog", label: "User Cog" },
    { value: "Briefcase", label: "Briefcase" },
    { value: "DollarSign", label: "Dollar Sign" },
    { value: "TrendingUp", label: "Trending Up" },
    { value: "Wrench", label: "Wrench" },
    { value: "Settings", label: "Settings" },
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  // Auto-dismiss success message after 3 seconds
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

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError("");

      // Use AuthService to get authenticated token
      const AuthService = (await import("@/lib/authService")).default;
      const token = await AuthService.refreshTokenIfNeeded();

      if (!token) {
        // Always redirect to login when no token (same behavior as production)
        router.push('/auth/login');
        return;
      }

      // Fetch roles using AuthService
      const data = await AuthService.apiRequest("/user-roles");

      setRoles(data.data || []);
    } catch (error) {
      console.error("Fetch roles error:", error);
      setError(`Unable to load roles: ${error.message}`);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      // Initialize default permissions if empty
      if (
        !newRole.permissions ||
        Object.keys(newRole.permissions).length === 0
      ) {
        const defaultPermissions = {};
        modules.forEach((module) => {
          defaultPermissions[module.id] = {};
          module.actions.forEach((action) => {
            defaultPermissions[module.id][action] = false;
          });
        });
        newRole.permissions = defaultPermissions;
      }

      const AuthService = (await import("@/lib/authService")).default;

      const createData = {
        data: {
          name: newRole.name,
          description: newRole.description,
          icon: newRole.icon,
          color: newRole.color,
          rank: parseInt(newRole.rank),
          visibility: newRole.visibility,
          permissions: newRole.permissions,
          isSystemRole: false,
        },
      };

      const response = await AuthService.apiRequest("/user-roles", {
        method: "POST",
        body: JSON.stringify(createData),
      });

      setSuccess("Role created successfully!");
      setShowCreateModal(false);
      setNewRole({
        name: "",
        description: "",
        icon: "Shield",
        color: "from-gray-500 to-gray-600",
        rank: 10,
        visibility: "private",
        permissions: {},
      });
      fetchRoles(); // Refresh the roles list
    } catch (error) {
      console.error("Create role error:", error);
      setError("Failed to create role: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEditRole = (role) => {
    setError("");
    setEditingRole({ ...role });
    setShowEditModal(true);
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const AuthService = (await import("@/lib/authService")).default;

      const updateData = {
        data: {
          name: editingRole.name,
          description: editingRole.description,
          icon: editingRole.icon,
          color: editingRole.color,
          rank: parseInt(editingRole.rank),
          visibility: editingRole.visibility,
          permissions: editingRole.permissions,
        },
      };

      await AuthService.apiRequest(`/user-roles/${editingRole.id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      setSuccess("Role updated successfully!");
      setShowEditModal(false);
      setEditingRole(null);
      fetchRoles(); // Refresh the roles list
    } catch (error) {
      console.error("Update role error:", error);
      setError("Failed to update role: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = (role) => {
    setDeletingRole(role);
    setShowDeleteModal(true);
  };

  const confirmDeleteRole = async () => {
    if (!deletingRole) return;

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const AuthService = (await import("@/lib/authService")).default;

      await AuthService.apiRequest(`/user-roles/${deletingRole.id}`, {
        method: "DELETE",
      });

      setSuccess("Role deleted successfully!");
      setShowDeleteModal(false);
      setDeletingRole(null);
      fetchRoles(); // Refresh the roles list
    } catch (error) {
      console.error("Delete role error:", error);
      setError("Failed to delete role: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handlePermissionChange = (roleData, module, action, value) => {
    const updatedPermissions = { ...roleData.permissions };
    if (!updatedPermissions[module]) {
      updatedPermissions[module] = {};
    }
    updatedPermissions[module][action] = value;

    if (editingRole) {
      setEditingRole({ ...editingRole, permissions: updatedPermissions });
    } else {
      setNewRole({ ...newRole, permissions: updatedPermissions });
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { text: "Rank 1", color: "bg-red-100 text-red-700" };
    if (rank === 2)
      return { text: "Rank 2", color: "bg-blue-100 text-blue-700" };
    if (rank === 3)
      return { text: "Rank 3", color: "bg-green-100 text-green-700" };
    if (rank <= 5)
      return { text: `Rank ${rank}`, color: "bg-purple-100 text-purple-700" };
    return { text: `Rank ${rank}`, color: "bg-gray-100 text-gray-700" };
  };

  const getIconComponent = (iconName) => {
    const IconComponent = iconMap[iconName] || Shield;
    return IconComponent;
  };

  const PermissionsMatrix = ({ roleData, isEditing = false }) => (
    <div className="space-y-4">
      {modules.map((module) => (
        <div key={module.id} className="border rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">{module.name}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {module.actions.map((action) => (
              <label
                key={action}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={roleData.permissions?.[module.id]?.[action] || false}
                  onChange={(e) =>
                    isEditing &&
                    handlePermissionChange(
                      roleData,
                      module.id,
                      action,
                      e.target.checked
                    )
                  }
                  disabled={!isEditing}
                  className="rounded"
                />
                <span className="text-sm capitalize text-gray-700">
                  {action}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-8 text-center"
        >
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-gray-600">Loading roles...</p>
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
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                User Roles & Permissions
              </h1>
              <p className="text-gray-600">
                Manage role-based access control and hierarchies
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setError("");
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Role
          </button>
        </div>
      </div>

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
              <AlertCircle className="w-5 h-5 text-red-600" />
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
              <CheckCircle className="w-5 h-5 text-green-600" />
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Total Roles",
            value: roles.length,
            change: "+2",
            icon: Shield,
            color: "from-blue-500 to-blue-600",
          },
          {
            title: "System Roles",
            value: roles.filter((r) => r.isSystemRole).length,
            change: "0",
            icon: Crown,
            color: "from-red-500 to-red-600",
          },
          {
            title: "Custom Roles",
            value: roles.filter((r) => !r.isSystemRole).length,
            change: "+2",
            icon: UserCog,
            color: "from-green-500 to-green-600",
          },
          {
            title: "Total Users",
            value: roles.reduce((sum, role) => sum + (role.userCount || 0), 0),
            change: "+5",
            icon: Users,
            color: "from-purple-500 to-purple-600",
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

      {/* Roles Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {roles.map((role, index) => {
          const IconComponent = getIconComponent(role.icon);
          const rankBadge = getRankBadge(role.rank);

          return (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
            >
              {/* Role Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${role.color} rounded-lg flex items-center justify-center shadow-lg`}
                  >
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{role.name}</h3>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${rankBadge.color}`}
                    >
                      {rankBadge.text}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditRole(role)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Role"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Role Description */}
              <p className="text-sm text-gray-600 mb-4">{role.description}</p>

              {/* Role Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{role.userCount || 0} users</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Eye className="w-4 h-4" />
                    <span className="capitalize">{role.visibility}</span>
                  </div>
                </div>

                {role.isSystemRole && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    System
                  </span>
                )}
              </div>

              {/* Permissions Preview */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Permissions
                  </span>
                  <button
                    onClick={() => {
                      setEditingRole(role);
                      setShowPermissionsModal(true);
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    View Details
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(role.permissions || {})
                    .slice(0, 3)
                    .map(([module, perms]) => {
                      const hasAnyPermission = Object.values(perms).some(
                        (p) => p === true
                      );
                      return (
                        hasAnyPermission && (
                          <span
                            key={module}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize"
                          >
                            {module}
                          </span>
                        )
                      );
                    })}
                  {Object.keys(role.permissions || {}).length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      +{Object.keys(role.permissions || {}).length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Create Role Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setError("");
          setNewRole({
            name: "",
            description: "",
            icon: "Shield",
            color: "from-gray-500 to-gray-600",
            rank: 10,
            visibility: "private",
            permissions: {},
          });
        }}
        title="Create New Role"
        size="lg"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          {/* Error Alert inside Modal */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border-l-4 border-red-500 bg-red-50 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="flex-shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors"
                  aria-label="Close error message"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </motion.div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Role Name
              </label>
              <Input
                value={newRole.name}
                onChange={(e) =>
                  setNewRole({ ...newRole, name: e.target.value })
                }
                placeholder="Enter role name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Rank (1-100)
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={newRole.rank}
                onChange={(e) =>
                  setNewRole({ ...newRole, rank: parseInt(e.target.value) })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={newRole.description}
              onChange={(e) =>
                setNewRole({ ...newRole, description: e.target.value })
              }
              placeholder="Enter role description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Icon
              </label>
              <Select
                value={newRole.icon}
                onChange={(value) => setNewRole({ ...newRole, icon: value })}
                options={iconOptions}
                placeholder="Select icon"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Color
              </label>
              <Select
                value={newRole.color}
                onChange={(value) => setNewRole({ ...newRole, color: value })}
                options={colorOptions}
                placeholder="Select color"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Visibility
              </label>
              <Select
                value={newRole.visibility}
                onChange={(value) =>
                  setNewRole({ ...newRole, visibility: value })
                }
                options={visibilityOptions}
                placeholder="Select visibility"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Permissions
            </label>
            <PermissionsMatrix roleData={newRole} isEditing={true} />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setError("");
              }}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating} className="px-4 py-2">
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Role"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingRole(null);
          setError("");
        }}
        title="Edit Role"
        size="lg"
      >
        {editingRole && (
          <form onSubmit={handleUpdateRole} className="space-y-4">
            {/* Error Alert inside Modal */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border-l-4 border-red-500 bg-red-50 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError("")}
                    className="flex-shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors"
                    aria-label="Close error message"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </motion.div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Role Name
                </label>
                <Input
                  value={editingRole.name}
                  onChange={(e) =>
                    setEditingRole({ ...editingRole, name: e.target.value })
                  }
                  placeholder="Enter role name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Rank (1-100)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={editingRole.rank}
                  onChange={(e) =>
                    setEditingRole({
                      ...editingRole,
                      rank: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={editingRole.description}
                onChange={(e) =>
                  setEditingRole({
                    ...editingRole,
                    description: e.target.value,
                  })
                }
                placeholder="Enter role description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Icon
                </label>
                <Select
                  value={editingRole.icon}
                  onChange={(value) =>
                    setEditingRole({ ...editingRole, icon: value })
                  }
                  options={iconOptions}
                  placeholder="Select icon"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Color
                </label>
                <Select
                  value={editingRole.color}
                  onChange={(value) =>
                    setEditingRole({ ...editingRole, color: value })
                  }
                  options={colorOptions}
                  placeholder="Select color"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Visibility
                </label>
                <Select
                  value={editingRole.visibility}
                  onChange={(value) =>
                    setEditingRole({ ...editingRole, visibility: value })
                  }
                  options={visibilityOptions}
                  placeholder="Select visibility"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Permissions
              </label>
              <PermissionsMatrix roleData={editingRole} isEditing={true} />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRole(null);
                  setError("");
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
                  "Update Role"
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Permissions View Modal */}
      <Modal
        isOpen={showPermissionsModal}
        onClose={() => {
          setShowPermissionsModal(false);
          setEditingRole(null);
        }}
        title={`Permissions - ${editingRole?.name}`}
        size="xl"
      >
        {editingRole && (
          <div className="space-y-4">
            <PermissionsMatrix roleData={editingRole} isEditing={false} />
          </div>
        )}
      </Modal>

      {/* Delete Role Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingRole(null);
        }}
        title="Delete Role"
        size="md"
      >
        {deletingRole && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Are you sure you want to delete this role?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This action cannot be undone. The role{" "}
                  <span className="font-semibold text-gray-900">
                    {deletingRole.name}
                  </span>{" "}
                  will be permanently removed from the system.
                </p>
                {deletingRole.isSystemRole && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Warning:</strong> This is a system role. Deleting
                      it may affect system functionality and user permissions.
                    </p>
                  </div>
                )}
                {deletingRole.userCount > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This role is assigned to{" "}
                      {deletingRole.userCount} user(s). These users will lose
                      this role assignment.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
              <Button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingRole(null);
                }}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2"
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteRole}
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
                    Delete Role
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
export default function ProtectedUserRolesPage() {
  return (
    <RouteGuard requiredLevel="Manager">
      <UserRolesPage />
    </RouteGuard>
  );
}
