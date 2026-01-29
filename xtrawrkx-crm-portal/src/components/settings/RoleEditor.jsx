"use client";

import { useState } from "react";
import { Card, Button, Input, Select, Badge, Textarea } from "../../components/ui";
import {
  Save,
  X,
  Plus,
  Trash2,
  Users,
  Shield,
  Eye,
  Settings,
} from "lucide-react";

export default function RoleEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "bg-blue-500",
    permissions: [],
    users: [],
  });

  const roleColors = [
    { value: "bg-red-500", label: "Red", color: "bg-red-500" },
    { value: "bg-blue-500", label: "Blue", color: "bg-blue-500" },
    { value: "bg-green-500", label: "Green", color: "bg-green-500" },
    { value: "bg-yellow-500", label: "Yellow", color: "bg-yellow-500" },
    { value: "bg-purple-500", label: "Purple", color: "bg-purple-500" },
    { value: "bg-gray-500", label: "Gray", color: "bg-gray-500" },
  ];

  const availableUsers = [
    { id: "user1", name: "John Smith", email: "john@company.com" },
    { id: "user2", name: "Sarah Wilson", email: "sarah@company.com" },
    { id: "user3", name: "Mike Johnson", email: "mike@company.com" },
    { id: "user4", name: "Emily Davis", email: "emily@company.com" },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddUser = (userId) => {
    const user = availableUsers.find(u => u.id === userId);
    if (user && !formData.users.find(u => u.id === userId)) {
      setFormData(prev => ({
        ...prev,
        users: [...prev.users, user]
      }));
    }
  };

  const handleRemoveUser = (userId) => {
    setFormData(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== userId)
    }));
  };

  const handleSave = () => {
    setIsOpen(false);
    setFormData({
      name: "",
      description: "",
      color: "bg-blue-500",
      permissions: [],
      users: [],
    });
  };

  const handleCancel = () => {
    setIsOpen(false);
    setFormData({
      name: "",
      description: "",
      color: "bg-blue-500",
      permissions: [],
      users: [],
    });
  };

  const getRoleIcon = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case "administrator":
        return <Shield className="w-5 h-5" />;
      case "sales manager":
        return <Users className="w-5 h-5" />;
      case "sales rep":
        return <Users className="w-5 h-5" />;
      case "viewer":
        return <Eye className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Role Editor</h3>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Role
        </Button>
      </div>

      {isOpen && (
        <Card className="p-6 border-2 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900">
              {editingRole ? "Edit Role" : "Create New Role"}
            </h4>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Color
                </label>
                <div className="flex gap-2">
                  {roleColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleInputChange("color", color.value)}
                      className={`w-8 h-8 ${color.color} rounded-lg border-2 ${
                        formData.color === color.value ? "border-gray-900" : "border-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter role description"
                rows={3}
              />
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${formData.color} rounded-lg flex items-center justify-center text-white`}>
                    {getRoleIcon(formData.name)}
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900">
                      {formData.name || "Role Name"}
                    </h5>
                    <p className="text-sm text-gray-600">
                      {formData.description || "Role description"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Users
              </label>
              <div className="space-y-3">
                <Select
                  placeholder="Select users to assign to this role"
                  options={availableUsers.map(user => ({
                    value: user.id,
                    label: `${user.name} (${user.email})`
                  }))}
                  onChange={(value) => handleAddUser(value)}
                />
                
                {formData.users.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Assigned Users:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.users.map((user) => (
                        <Badge
                          key={user.id}
                          variant="default"
                          className="flex items-center gap-2"
                        >
                          {user.name}
                          <button
                            onClick={() => handleRemoveUser(user.id)}
                            className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                {editingRole ? "Update Role" : "Create Role"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

