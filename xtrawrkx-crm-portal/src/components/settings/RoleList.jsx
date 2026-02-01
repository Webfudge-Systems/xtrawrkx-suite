"use client";

import { useState } from "react";
import { Card, Badge, Button, Avatar } from "../../components/ui";
import {
  Users,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  Shield,
  Eye,
  Settings,
} from "lucide-react";

export default function RoleList({ roles = [] }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [showActions, setShowActions] = useState(null);

  const handleRoleAction = (action, roleId) => {
    setShowActions(null);
  };

  const getRoleIcon = (roleName) => {
    switch (roleName.toLowerCase()) {
      case "administrator":
        return <Shield className="w-5 h-5 text-red-500" />;
      case "sales manager":
        return <Users className="w-5 h-5 text-blue-500" />;
      case "sales rep":
        return <Users className="w-5 h-5 text-green-500" />;
      case "viewer":
        return <Eye className="w-5 h-5 text-gray-500" />;
      default:
        return <Settings className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRoleDescription = (roleName) => {
    switch (roleName.toLowerCase()) {
      case "administrator":
        return "Full access to all features and settings";
      case "sales manager":
        return "Manage team, view reports, and oversee sales activities";
      case "sales rep":
        return "Create and manage leads, contacts, and deals";
      case "viewer":
        return "Read-only access to assigned records";
      default:
        return "Custom role with specific permissions";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Roles</h3>
        <div className="flex items-center gap-2">
          <Badge variant="info">{roles.length} roles</Badge>
          <Button size="sm">
            <Users className="w-4 h-4 mr-2" />
            Add Role
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <Card
            key={role.id}
            className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedRole === role.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
            }`}
            onClick={() => setSelectedRole(role.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${role.color} rounded-lg flex items-center justify-center`}>
                  {getRoleIcon(role.name)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{role.name}</h4>
                  <p className="text-sm text-gray-600">{role.users} users</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(showActions === role.id ? null : role.id);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>

                {showActions === role.id && (
                  <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleRoleAction("edit", role.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Role
                      </button>
                      <button
                        onClick={() => handleRoleAction("duplicate", role.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => handleRoleAction("permissions", role.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Shield className="w-4 h-4" />
                        Manage Permissions
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => handleRoleAction("delete", role.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Role
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              {getRoleDescription(role.name)}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <Avatar
                      key={i}
                      name={`User ${i}`}
                      size="xs"
                      className="border-2 border-white"
                    />
                  ))}
                  {role.users > 3 && (
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                      +{role.users - 3}
                    </div>
                  )}
                </div>
              </div>
              <Badge
                variant={role.name === "Administrator" ? "danger" : "default"}
                size="sm"
              >
                {role.name === "Administrator" ? "System" : "Custom"}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {roles.length === 0 && (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Roles Found</h3>
          <p className="text-gray-600 mb-4">
            Create your first role to start managing user permissions
          </p>
          <Button>
            <Users className="w-4 h-4 mr-2" />
            Create Role
          </Button>
        </Card>
      )}
    </div>
  );
}

