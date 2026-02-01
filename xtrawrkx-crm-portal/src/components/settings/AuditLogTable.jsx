"use client";

import { useState } from "react";
import { Card, Button, Badge, Avatar, Input, Select } from "../../components/ui";
import {
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  User,
  Shield,
  FileText,
  Settings,
  Trash2,
  Edit,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function AuditLogTable({ auditLogs = [] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const sampleLogs = [
    {
      id: "log1",
      user: "Jane Admin",
      userEmail: "jane@company.com",
      action: "Role Created",
      entity: "Role",
      entityId: "role_123",
      details: "Created new role 'Marketing Manager' with custom permissions",
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      timestamp: "2025-01-20 10:15:30",
      severity: "info",
      category: "security",
      changes: {
        before: null,
        after: {
          name: "Marketing Manager",
          permissions: ["leads", "contacts", "campaigns"]
        }
      },
    },
    {
      id: "log2",
      user: "John Smith",
      userEmail: "john@company.com",
      action: "Permission Changed",
      entity: "Leads",
      entityId: "lead_456",
      details: "Updated lead permissions for Sales Rep role",
      ip: "192.168.1.2",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      timestamp: "2025-01-20 11:00:15",
      severity: "warning",
      category: "permissions",
      changes: {
        before: { create: true, read: true, update: true, delete: false },
        after: { create: true, read: true, update: true, delete: true }
      },
    },
    {
      id: "log3",
      user: "Sarah Wilson",
      userEmail: "sarah@company.com",
      action: "Integration Connected",
      entity: "Google Calendar",
      entityId: "integration_gcal",
      details: "Successfully connected Google Calendar integration",
      ip: "192.168.1.3",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      timestamp: "2025-01-20 14:30:45",
      severity: "success",
      category: "integration",
      changes: {
        before: { status: "disconnected" },
        after: { status: "connected", lastSync: "2025-01-20 14:30:45" }
      },
    },
    {
      id: "log4",
      user: "Mike Johnson",
      userEmail: "mike@company.com",
      action: "Data Export",
      entity: "Leads",
      entityId: "export_789",
      details: "Exported 1,247 leads to CSV format",
      ip: "192.168.1.4",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      timestamp: "2025-01-20 09:45:20",
      severity: "info",
      category: "data",
      changes: {
        before: null,
        after: { format: "CSV", recordCount: 1247, fileSize: "2.4MB" }
      },
    },
    {
      id: "log5",
      user: "Emily Davis",
      userEmail: "emily@company.com",
      action: "Login Failed",
      entity: "Authentication",
      entityId: "auth_failed",
      details: "Failed login attempt with invalid credentials",
      ip: "192.168.1.5",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      timestamp: "2025-01-20 08:20:10",
      severity: "error",
      category: "security",
      changes: {
        before: null,
        after: { reason: "Invalid password", attempts: 3 }
      },
    },
    {
      id: "log6",
      user: "System",
      userEmail: "system@company.com",
      action: "Backup Completed",
      entity: "Database",
      entityId: "backup_20250120",
      details: "Daily database backup completed successfully",
      ip: "192.168.1.100",
      userAgent: "System Process",
      timestamp: "2025-01-20 02:00:00",
      severity: "info",
      category: "system",
      changes: {
        before: null,
        after: { size: "15.2GB", duration: "45 minutes", status: "success" }
      },
    },
  ];

  const actionFilters = [
    { value: "all", label: "All Actions" },
    { value: "create", label: "Create" },
    { value: "update", label: "Update" },
    { value: "delete", label: "Delete" },
    { value: "login", label: "Login" },
    { value: "export", label: "Export" },
    { value: "permission", label: "Permission" },
    { value: "integration", label: "Integration" },
  ];

  const userFilters = [
    { value: "all", label: "All Users" },
    ...Array.from(new Set(sampleLogs.map(log => log.user))).map(user => ({
      value: user,
      label: user
    })),
  ];

  const dateFilters = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
  ];

  const filteredLogs = sampleLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = filterAction === "all" || 
                         log.action.toLowerCase().includes(filterAction.toLowerCase());
    
    const matchesUser = filterUser === "all" || log.user === filterUser;
    
    // Simple date filtering (in real app, you'd use proper date comparison)
    const matchesDate = filterDate === "all" || true; // Simplified for demo
    
    return matchesSearch && matchesAction && matchesUser && matchesDate;
  });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "info":
      default:
        return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "info":
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "security":
        return <Shield className="w-4 h-4" />;
      case "permissions":
        return <Settings className="w-4 h-4" />;
      case "integration":
        return <Plus className="w-4 h-4" />;
      case "data":
        return <FileText className="w-4 h-4" />;
      case "system":
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleLogSelect = (logId, selected) => {
    if (selected) {
      setSelectedLogs(prev => [...prev, logId]);
    } else {
      setSelectedLogs(prev => prev.filter(id => id !== logId));
    }
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedLogs(filteredLogs.map(log => log.id));
    } else {
      setSelectedLogs([]);
    }
  };

  const handleExport = () => {
  };

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Audit Logs</h3>
          <p className="text-sm text-gray-600">
            Track all system activities and changes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={selectedLogs.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export ({selectedLogs.length || "All"})
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filterAction}
          onChange={setFilterAction}
          options={actionFilters}
        />
        <Select
          value={filterUser}
          onChange={setFilterUser}
          options={userFilters}
        />
        <Select
          value={filterDate}
          onChange={setFilterDate}
          options={dateFilters}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Success</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredLogs.filter(log => log.severity === "success").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Warnings</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredLogs.filter(log => log.severity === "warning").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Errors</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredLogs.filter(log => log.severity === "error").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedLogs.length === filteredLogs.length && filteredLogs.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Entity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Severity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Timestamp</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">IP Address</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedLogs.includes(log.id)}
                      onChange={(e) => handleLogSelect(log.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={log.user} size="sm" />
                      <div>
                        <div className="font-medium text-gray-900">{log.user}</div>
                        <div className="text-sm text-gray-500">{log.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(log.category)}
                      <span className="font-medium text-gray-900">{log.action}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{log.details}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{log.entity}</div>
                      <div className="text-sm text-gray-500">{log.entityId}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(log.severity)}
                      <Badge
                        variant="default"
                        size="sm"
                        className={getSeverityColor(log.severity)}
                      >
                        {log.severity}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{log.timestamp}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600">{log.ip}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Download className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

