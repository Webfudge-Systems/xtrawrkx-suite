"use client";

import { useState } from "react";
import { Card, Button, Input, Select, Badge, Avatar, Checkbox } from "../../components/ui";
import {
  Search,
  Filter,
  User,
  Users,
  Shield,
  Eye,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  MoreVertical,
} from "lucide-react";

export default function UserPermissionsAssignment() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const roles = [
    { value: "all", label: "All Roles" },
    { value: "admin", label: "Administrator" },
    { value: "sales_manager", label: "Sales Manager" },
    { value: "sales_rep", label: "Sales Rep" },
    { value: "viewer", label: "Viewer" },
  ];

  const users = [
    {
      id: "user1",
      name: "John Smith",
      email: "john@company.com",
      role: "admin",
      roleName: "Administrator",
      status: "active",
      lastLogin: "2025-01-20 10:30",
      permissions: ["all"],
      avatar: "JS",
    },
    {
      id: "user2",
      name: "Sarah Wilson",
      email: "sarah@company.com",
      role: "sales_manager",
      roleName: "Sales Manager",
      status: "active",
      lastLogin: "2025-01-20 09:15",
      permissions: ["leads", "contacts", "deals"],
      avatar: "SW",
    },
    {
      id: "user3",
      name: "Mike Johnson",
      email: "mike@company.com",
      role: "sales_rep",
      roleName: "Sales Rep",
      status: "active",
      lastLogin: "2025-01-19 16:45",
      permissions: ["leads", "contacts"],
      avatar: "MJ",
    },
    {
      id: "user4",
      name: "Emily Davis",
      email: "emily@company.com",
      role: "sales_rep",
      roleName: "Sales Rep",
      status: "inactive",
      lastLogin: "2025-01-15 14:20",
      permissions: ["leads", "contacts"],
      avatar: "ED",
    },
    {
      id: "user5",
      name: "David Brown",
      email: "david@company.com",
      role: "viewer",
      roleName: "Viewer",
      status: "active",
      lastLogin: "2025-01-20 11:00",
      permissions: ["leads"],
      avatar: "DB",
    },
  ];

  const modules = [
    { value: "leads", label: "Leads", icon: "👥" },
    { value: "contacts", label: "Contacts", icon: "👤" },
    { value: "deals", label: "Deals", icon: "💼" },
    { value: "accounts", label: "Accounts", icon: "🏢" },
    { value: "activities", label: "Activities", icon: "📋" },
    { value: "reports", label: "Reports", icon: "📊" },
    { value: "settings", label: "Settings", icon: "⚙️" },
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleUserSelect = (userId, selected) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkRoleChange = (role) => {
    setSelectedUsers([]);
    setShowBulkActions(false);
  };

  const handleBulkPermissionChange = (permission, add) => {
    setSelectedUsers([]);
    setShowBulkActions(false);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleSaveUser = (userData) => {
    setShowUserModal(false);
    setEditingUser(null);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "sales_manager":
        return "bg-blue-100 text-blue-800";
      case "sales_rep":
        return "bg-green-100 text-green-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    return status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">User Permissions Assignment</h3>
          <p className="text-sm text-gray-600">
            Manage user roles and permissions across the organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkActions(!showBulkActions)}
            disabled={selectedUsers.length === 0}
          >
            <Filter className="w-4 h-4 mr-2" />
            Bulk Actions ({selectedUsers.length})
          </Button>
          <Button size="sm" onClick={() => setShowUserModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={selectedRole}
          onChange={setSelectedRole}
          options={roles}
        />
        <div className="flex items-center gap-2">
          <Badge variant="info">{filteredUsers.length} users</Badge>
          <Badge variant="success">{users.filter(u => u.status === "active").length} active</Badge>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && selectedUsers.length > 0 && (
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Bulk Actions</h4>
              <p className="text-sm text-blue-700">
                {selectedUsers.length} user(s) selected
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                placeholder="Change Role"
                options={roles.filter(r => r.value !== "all")}
                onChange={handleBulkRoleChange}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkActions(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Permissions</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Last Login</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onChange={(checked) => handleUserSelect(user.id, checked)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.avatar} size="sm" />
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="default"
                      size="sm"
                      className={getRoleColor(user.role)}
                    >
                      {user.roleName}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="default"
                      size="sm"
                      className={getStatusColor(user.status)}
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.map((permission) => {
                        const module = modules.find(m => m.value === permission);
                        return (
                          <Badge key={permission} variant="outline" size="sm">
                            {module?.icon} {module?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.lastLogin}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUser ? "Edit User" : "Add New User"}
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <Input
                      defaultValue={editingUser?.name || ""}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      defaultValue={editingUser?.email || ""}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <Select
                      defaultValue={editingUser?.role || ""}
                      options={roles.filter(r => r.value !== "all")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <Select
                      defaultValue={editingUser?.status || "active"}
                      options={[
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "Inactive" },
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module Permissions
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {modules.map((module) => (
                      <label key={module.value} className="flex items-center gap-2">
                        <Checkbox
                          defaultChecked={editingUser?.permissions?.includes(module.value) || false}
                        />
                        <span className="text-sm">{module.icon} {module.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowUserModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveUser}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingUser ? "Update User" : "Add User"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === "active").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === "admin").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Viewers</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === "viewer").length}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

