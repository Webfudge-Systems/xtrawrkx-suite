"use client";

import { useState } from "react";
import { Card, Button, Badge, Checkbox } from "../../components/ui";
import {
  Save,
  RefreshCw,
  Download,
  Upload,
  Info,
  Shield,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Share,
} from "lucide-react";

export default function PermissionMatrix({ 
  roles = [], 
  modules = [], 
  permissionActions = [],
  permissionMatrix = []
}) {
  const [matrix, setMatrix] = useState(permissionMatrix);
  const [selectedRole, setSelectedRole] = useState(roles[0]?.id || "");
  const [hasChanges, setHasChanges] = useState(false);

  const handlePermissionChange = (roleId, module, action, value) => {
    setMatrix(prev => {
      const existing = prev.find(item => item.roleId === roleId && item.module === module);
      if (existing) {
        return prev.map(item => 
          item.roleId === roleId && item.module === module
            ? { ...item, actions: { ...item.actions, [action]: value } }
            : item
        );
      } else {
        return [...prev, {
          roleId,
          module,
          actions: { ...permissionActions.reduce((acc, act) => ({ ...acc, [act]: false }), {}), [action]: value }
        }];
      }
    });
    setHasChanges(true);
  };

  const getPermission = (roleId, module, action) => {
    const item = matrix.find(m => m.roleId === roleId && m.module === module);
    return item?.actions?.[action] || false;
  };

  const handleSave = () => {
    setHasChanges(false);
    // Here you would typically send the matrix to your backend
  };

  const handleReset = () => {
    setMatrix(permissionMatrix);
    setHasChanges(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(matrix, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "permission-matrix.json";
    link.click();
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "create":
        return <Plus className="w-4 h-4" />;
      case "read":
        return <Eye className="w-4 h-4" />;
      case "update":
        return <RefreshCw className="w-4 h-4" />;
      case "delete":
        return <Trash2 className="w-4 h-4" />;
      case "share":
        return <Share className="w-4 h-4" />;
      case "export":
        return <Download className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getActionTooltip = (action) => {
    switch (action) {
      case "create":
        return "Create new records in this module";
      case "read":
        return "View and read records in this module";
      case "update":
        return "Edit and modify existing records";
      case "delete":
        return "Delete records from this module";
      case "share":
        return "Share records with other users";
      case "export":
        return "Export data from this module";
      default:
        return "Permission action";
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Permission Matrix</h3>
          <p className="text-sm text-gray-600">
            Configure what each role can do in each module
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!hasChanges}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Role Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Role to Configure
        </label>
        <div className="flex gap-2">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedRole === role.id
                  ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {role.name}
            </button>
          ))}
        </div>
      </div>

      {/* Permission Matrix Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  Module
                </th>
                {permissionActions.map((action) => (
                  <th key={action} className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                    <div className="flex items-center justify-center gap-1">
                      {getActionIcon(action)}
                      <span className="capitalize">{action}</span>
                      <div className="group relative">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {getActionTooltip(action)}
                        </div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {modules.map((module) => (
                <tr key={module} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {module}
                  </td>
                  {permissionActions.map((action) => (
                    <td key={action} className="px-4 py-3 text-center">
                      <Checkbox
                        checked={getPermission(selectedRole, module, action)}
                        onChange={(checked) => 
                          handlePermissionChange(selectedRole, module, action, checked)
                        }
                        className="mx-auto"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Total Permissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {matrix.filter(m => m.roleId === selectedRole).reduce((acc, item) => 
                  acc + Object.values(item.actions).filter(Boolean).length, 0
                )}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Modules Accessible</p>
              <p className="text-2xl font-bold text-gray-900">
                {modules.filter(module => 
                  matrix.some(m => m.roleId === selectedRole && m.module === module && 
                    Object.values(m.actions).some(Boolean))
                ).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Pending Changes</p>
              <p className="text-2xl font-bold text-gray-900">
                {hasChanges ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {hasChanges && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              You have unsaved changes. Don't forget to save your permission matrix.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

