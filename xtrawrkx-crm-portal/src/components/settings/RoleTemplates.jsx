"use client";

import { useState } from "react";
import { Card, Button, Badge } from "../../components/ui";
import {
  Copy,
  Download,
  Upload,
  Shield,
  Users,
  Eye,
  Settings,
  Check,
  X,
} from "lucide-react";

export default function RoleTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const roleTemplates = [
    {
      id: "admin",
      name: "Administrator",
      description: "Full access to all features and settings",
      icon: Shield,
      color: "bg-red-500",
      permissions: {
        leads: { create: true, read: true, update: true, delete: true, share: true, export: true },
        contacts: { create: true, read: true, update: true, delete: true, share: true, export: true },
        deals: { create: true, read: true, update: true, delete: true, share: true, export: true },
        activities: { create: true, read: true, update: true, delete: true, share: true, export: true },
        files: { create: true, read: true, update: true, delete: true, share: true, export: true },
        settings: { create: true, read: true, update: true, delete: true, share: true, export: true },
      },
      isSystem: true,
    },
    {
      id: "sales_manager",
      name: "Sales Manager",
      description: "Manage team, view reports, and oversee sales activities",
      icon: Users,
      color: "bg-blue-500",
      permissions: {
        leads: { create: true, read: true, update: true, delete: false, share: true, export: true },
        contacts: { create: true, read: true, update: true, delete: false, share: true, export: true },
        deals: { create: true, read: true, update: true, delete: false, share: true, export: true },
        activities: { create: true, read: true, update: true, delete: false, share: true, export: true },
        files: { create: true, read: true, update: true, delete: false, share: true, export: true },
        settings: { create: false, read: true, update: false, delete: false, share: false, export: false },
      },
      isSystem: true,
    },
    {
      id: "sales_rep",
      name: "Sales Representative",
      description: "Create and manage leads, contacts, and deals",
      icon: Users,
      color: "bg-green-500",
      permissions: {
        leads: { create: true, read: true, update: true, delete: false, share: false, export: false },
        contacts: { create: true, read: true, update: true, delete: false, share: false, export: false },
        deals: { create: true, read: true, update: true, delete: false, share: false, export: false },
        activities: { create: true, read: true, update: true, delete: false, share: false, export: false },
        files: { create: true, read: true, update: true, delete: false, share: false, export: false },
        settings: { create: false, read: false, update: false, delete: false, share: false, export: false },
      },
      isSystem: true,
    },
    {
      id: "viewer",
      name: "Viewer",
      description: "Read-only access to assigned records",
      icon: Eye,
      color: "bg-gray-500",
      permissions: {
        leads: { create: false, read: true, update: false, delete: false, share: false, export: false },
        contacts: { create: false, read: true, update: false, delete: false, share: false, export: false },
        deals: { create: false, read: true, update: false, delete: false, share: false, export: false },
        activities: { create: false, read: true, update: false, delete: false, share: false, export: false },
        files: { create: false, read: true, update: false, delete: false, share: false, export: false },
        settings: { create: false, read: false, update: false, delete: false, share: false, export: false },
      },
      isSystem: true,
    },
    {
      id: "custom_1",
      name: "Marketing Manager",
      description: "Manage campaigns and marketing activities",
      icon: Settings,
      color: "bg-purple-500",
      permissions: {
        leads: { create: true, read: true, update: true, delete: false, share: true, export: true },
        contacts: { create: true, read: true, update: true, delete: false, share: true, export: true },
        deals: { create: false, read: true, update: false, delete: false, share: false, export: false },
        activities: { create: true, read: true, update: true, delete: false, share: true, export: true },
        files: { create: true, read: true, update: true, delete: false, share: true, export: true },
        settings: { create: false, read: false, update: false, delete: false, share: false, export: false },
      },
      isSystem: false,
    },
  ];

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
  };

  const handleCloneTemplate = (template) => {
    // Here you would typically open the role editor with the template data
  };

  const handleExportTemplate = (template) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-template.json`;
    link.click();
  };

  const getPermissionCount = (permissions) => {
    return Object.values(permissions).reduce((acc, module) => 
      acc + Object.values(module).filter(Boolean).length, 0
    );
  };

  const getModuleCount = (permissions) => {
    return Object.values(permissions).filter(module => 
      Object.values(module).some(Boolean)
    ).length;
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Role Templates</h3>
          <p className="text-sm text-gray-600">
            Use predefined role templates or create custom ones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImport(!showImport)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Template
          </Button>
          <Button size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Import Section */}
      {showImport && (
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Import Role Template</h4>
              <p className="text-sm text-blue-700">Upload a JSON file to import a role template</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowImport(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roleTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <Card
              key={template.id}
              className={`p-4 transition-all duration-200 hover:shadow-md ${
                selectedTemplate?.id === template.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <Badge
                      variant={template.isSystem ? "info" : "default"}
                      size="sm"
                    >
                      {template.isSystem ? "System" : "Custom"}
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {template.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Permissions:</span>
                  <span className="font-medium">{getPermissionCount(template.permissions)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Modules:</span>
                  <span className="font-medium">{getModuleCount(template.permissions)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCloneTemplate(template)}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Clone
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Use
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportTemplate(template)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Template Details */}
      {selectedTemplate && (
        <Card className="mt-6 p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {selectedTemplate.name} - Permission Details
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTemplate(null)}
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-900">Module</th>
                  <th className="text-center py-2 font-medium text-gray-900">Create</th>
                  <th className="text-center py-2 font-medium text-gray-900">Read</th>
                  <th className="text-center py-2 font-medium text-gray-900">Update</th>
                  <th className="text-center py-2 font-medium text-gray-900">Delete</th>
                  <th className="text-center py-2 font-medium text-gray-900">Share</th>
                  <th className="text-center py-2 font-medium text-gray-900">Export</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(selectedTemplate.permissions).map(([module, permissions]) => (
                  <tr key={module} className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-900 capitalize">{module}</td>
                    {Object.entries(permissions).map(([action, allowed]) => (
                      <td key={action} className="py-2 text-center">
                        {allowed ? (
                          <Check className="w-4 h-4 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-gray-400 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

