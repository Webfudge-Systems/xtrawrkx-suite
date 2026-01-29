"use client";

import { useState } from "react";
import { Card, Button, Input, Select, Badge, Tabs } from "../../components/ui";
import PageHeader from "../../components/PageHeader";
import {
  AddRoleModal,
  ExportDataModal,
  ImportDataModal,
  DeleteAllDataModal,
} from "../../components/settings/modals";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  Shield,
  GitBranch,
  Bell,
  FileText,
  Save,
  Edit,
  Eye,
  EyeOff,
} from "lucide-react";

// Import all settings components
import RoleList from "../../components/settings/RoleList";
import RoleEditor from "../../components/settings/RoleEditor";
import PermissionMatrix from "../../components/settings/PermissionMatrix";
import RoleTemplates from "../../components/settings/RoleTemplates";
import FieldLevelSecurityForm from "../../components/settings/FieldLevelSecurityForm";
import TeamVisibilitySettings from "../../components/settings/TeamVisibilitySettings";
import UserPermissionsAssignment from "../../components/settings/UserPermissionsAssignment";
import IntegrationsHub from "../../components/settings/IntegrationsHub";
import IntegrationItemCard from "../../components/settings/IntegrationItemCard";
import IntegrationSetupModal from "../../components/settings/IntegrationSetupModal";
import AuditLogTable from "../../components/settings/AuditLogTable";
import AuditLogFilters from "../../components/settings/AuditLogFilters";
import BrandingForm from "../../components/settings/BrandingForm";
import NotificationPreferencesForm from "../../components/settings/NotificationPreferencesForm";
import SimulateRolePreview from "../../components/settings/SimulateRolePreview";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isEditing, setIsEditing] = useState(false);
  const [showRolePreview, setShowRolePreview] = useState(false);

  // Modal states
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

  // Modal handlers
  const handleAddRole = (newRole) => {
    setIsAddRoleModalOpen(false);
  };

  const handleExport = (exportData) => {
    setIsExportModalOpen(false);
  };

  const handleImport = (importData) => {
    setIsImportModalOpen(false);
  };

  const handleDeleteAll = () => {
    setIsDeleteAllModalOpen(false);
  };

  // Dummy data
  const companyInfo = {
    name: "Xtrawrkx CRM",
    email: "admin@xtrawrkx.com",
    phone: "+1 (555) 123-4567",
    website: "https://xtrawrkx.com",
    address: "123 Business St, San Francisco, CA 94105",
    industry: "Technology",
    size: "50-100 employees",
  };

  const roles = [
    { id: "role_admin", name: "Administrator", users: 3, color: "bg-red-500" },
    { id: "role_mgr", name: "Sales Manager", users: 8, color: "bg-blue-500" },
    { id: "role_sales", name: "Sales Rep", users: 25, color: "bg-green-500" },
    { id: "role_viewer", name: "Viewer", users: 12, color: "bg-gray-500" },
  ];

  const modules = [
    "Leads",
    "Contacts",
    "Deals",
    "Activities",
    "Files",
    "Settings",
  ];
  const permissionActions = [
    "create",
    "read",
    "update",
    "delete",
    "share",
    "export",
  ];

  const permissionMatrix = [
    {
      roleId: "role_admin",
      module: "Leads",
      actions: {
        create: true,
        read: true,
        update: true,
        delete: true,
        share: true,
        export: true,
      },
    },
    {
      roleId: "role_viewer",
      module: "Deals",
      actions: {
        create: false,
        read: true,
        update: false,
        delete: false,
        share: false,
        export: false,
      },
    },
  ];

  const integrations = [
    {
      id: "gdrive",
      name: "Google Drive",
      connected: false,
      description: "Sync files and documents",
    },
    {
      id: "gcal",
      name: "Google Calendar",
      connected: true,
      description: "Schedule meetings and events",
    },
    {
      id: "mailchimp",
      name: "Mailchimp",
      connected: false,
      description: "Email marketing campaigns",
    },
    {
      id: "slack",
      name: "Slack",
      connected: true,
      description: "Team communication",
    },
    {
      id: "zapier",
      name: "Zapier",
      connected: false,
      description: "Automate workflows",
    },
  ];

  const auditLogs = [
    {
      id: "log1",
      user: "Jane Admin",
      action: "Role Created",
      entity: "Role",
      date: "2025-01-20 10:15",
      ip: "192.168.1.1",
    },
    {
      id: "log2",
      user: "John Smith",
      action: "Permission Changed",
      entity: "Leads",
      date: "2025-01-20 11:00",
      ip: "192.168.1.2",
    },
    {
      id: "log3",
      user: "Sarah Wilson",
      action: "Integration Connected",
      entity: "Google Calendar",
      date: "2025-01-20 14:30",
      ip: "192.168.1.3",
    },
  ];

  const tabItems = [
    { key: "general", label: "General", icon: Building2 },
    { key: "security", label: "Security & Access", icon: Shield },
    { key: "integrations", label: "Integrations", icon: GitBranch },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "audit", label: "Audit & Logs", icon: FileText },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      {/* Company Information */}
      <Card title="Company Information" className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <Input
                value={companyInfo.name}
                onChange={() => {}}
                placeholder="Enter company name"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={companyInfo.email}
                onChange={() => {}}
                placeholder="Enter email address"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <Input
                value={companyInfo.phone}
                onChange={() => {}}
                placeholder="Enter phone number"
                disabled={!isEditing}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <Input
                value={companyInfo.website}
                onChange={() => {}}
                placeholder="Enter website URL"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <Select
                value={companyInfo.industry}
                onChange={() => {}}
                options={[
                  { value: "Technology", label: "Technology" },
                  { value: "Healthcare", label: "Healthcare" },
                  { value: "Finance", label: "Finance" },
                  { value: "Manufacturing", label: "Manufacturing" },
                ]}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Size
              </label>
              <Select
                value={companyInfo.size}
                onChange={() => {}}
                options={[
                  { value: "1-10 employees", label: "1-10 employees" },
                  { value: "11-50 employees", label: "11-50 employees" },
                  { value: "51-100 employees", label: "51-100 employees" },
                  { value: "100+ employees", label: "100+ employees" },
                ]}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <Input
            value={companyInfo.address}
            onChange={() => {}}
            placeholder="Enter company address"
            disabled={!isEditing}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsEditing(false)}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Information
            </Button>
          )}
        </div>
      </Card>

      {/* Branding & Themes */}
      <BrandingForm />

      {/* Data Management */}
      <Card title="Data Management" className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Export Data</h4>
              <p className="text-sm text-gray-600">
                Download all your CRM data in CSV format
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsExportModalOpen(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Import Data</h4>
              <p className="text-sm text-gray-600">
                Import contacts, leads, and deals from CSV
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <h4 className="font-medium text-red-900">Delete All Data</h4>
              <p className="text-sm text-red-600">
                Permanently delete all CRM data (cannot be undone)
              </p>
            </div>
            <Button
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => setIsDeleteAllModalOpen(true)}
            >
              Delete All
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      {/* Users & Roles */}
      <Card title="Users & Roles" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Role Management
            </h3>
            <p className="text-sm text-gray-600">
              Manage user roles and permissions
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowRolePreview(!showRolePreview)}
            >
              {showRolePreview ? (
                <EyeOff className="w-4 h-4 mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {showRolePreview ? "Hide Preview" : "Preview Role"}
            </Button>
            <Button onClick={() => setIsAddRoleModalOpen(true)}>
              <Users className="w-4 h-4 mr-2" />
              Add Role
            </Button>
          </div>
        </div>

        <RoleList roles={roles} />
        <RoleEditor />
        <PermissionMatrix
          roles={roles}
          modules={modules}
          permissionActions={permissionActions}
          permissionMatrix={permissionMatrix}
        />
        <RoleTemplates />
        <FieldLevelSecurityForm />
        <TeamVisibilitySettings />
        <UserPermissionsAssignment />

        {showRolePreview && <SimulateRolePreview />}
      </Card>
    </div>
  );

  const renderIntegrationsSettings = () => (
    <div className="space-y-6">
      <IntegrationsHub integrations={integrations} />
      <IntegrationItemCard />
      <IntegrationSetupModal />
    </div>
  );

  const renderNotificationsSettings = () => (
    <div className="space-y-6">
      <NotificationPreferencesForm />
    </div>
  );

  const renderAuditSettings = () => (
    <div className="space-y-6">
      <AuditLogFilters />
      <AuditLogTable auditLogs={auditLogs} />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralSettings();
      case "security":
        return renderSecuritySettings();
      case "integrations":
        return renderIntegrationsSettings();
      case "notifications":
        return renderNotificationsSettings();
      case "audit":
        return renderAuditSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and application preferences"
        breadcrumbs={["Dashboard", "Settings"]}
      />

      <div>
        <div className="mb-6">
          <Tabs
            tabs={tabItems}
            defaultTab="general"
            variant="line"
            onChange={setActiveTab}
          />
        </div>

        {renderTabContent()}
      </div>

      {/* Modals */}
      <AddRoleModal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        onAddRole={handleAddRole}
      />

      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
      />

      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />

      <DeleteAllDataModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onDeleteAll={handleDeleteAll}
      />
    </div>
  );
}
