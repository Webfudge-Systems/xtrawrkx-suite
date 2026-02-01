"use client";

import { useState } from "react";
import { Card, Button, Input, Select, Checkbox, Badge } from "../../components/ui";
import {
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  FileText,
  Settings,
  X,
  Download,
  RefreshCw,
} from "lucide-react";

export default function AuditLogFilters() {
  const [filters, setFilters] = useState({
    search: "",
    dateRange: "all",
    users: [],
    actions: [],
    severity: [],
    categories: [],
    ipAddress: "",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedFilters, setSavedFilters] = useState([]);

  const dateRanges = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
  ];

  const users = [
    { value: "jane_admin", label: "Jane Admin" },
    { value: "john_smith", label: "John Smith" },
    { value: "sarah_wilson", label: "Sarah Wilson" },
    { value: "mike_johnson", label: "Mike Johnson" },
    { value: "emily_davis", label: "Emily Davis" },
    { value: "system", label: "System" },
  ];

  const actions = [
    { value: "create", label: "Create" },
    { value: "update", label: "Update" },
    { value: "delete", label: "Delete" },
    { value: "login", label: "Login" },
    { value: "logout", label: "Logout" },
    { value: "export", label: "Export" },
    { value: "import", label: "Import" },
    { value: "permission", label: "Permission Change" },
    { value: "integration", label: "Integration" },
    { value: "backup", label: "Backup" },
  ];

  const severityLevels = [
    { value: "info", label: "Info", color: "bg-blue-100 text-blue-800" },
    { value: "success", label: "Success", color: "bg-green-100 text-green-800" },
    { value: "warning", label: "Warning", color: "bg-yellow-100 text-yellow-800" },
    { value: "error", label: "Error", color: "bg-red-100 text-red-800" },
  ];

  const categories = [
    { value: "security", label: "Security", icon: Shield },
    { value: "permissions", label: "Permissions", icon: Settings },
    { value: "data", label: "Data", icon: FileText },
    { value: "integration", label: "Integration", icon: Settings },
    { value: "system", label: "System", icon: Settings },
    { value: "user", label: "User Management", icon: User },
  ];

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleMultiSelectChange = (filterType, value, checked) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: checked
        ? [...prev[filterType], value]
        : prev[filterType].filter(item => item !== value)
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      dateRange: "all",
      users: [],
      actions: [],
      severity: [],
      categories: [],
      ipAddress: "",
    });
  };

  const handleSaveFilter = () => {
    const filterName = prompt("Enter a name for this filter:");
    if (filterName) {
      const newFilter = {
        id: Date.now().toString(),
        name: filterName,
        filters: { ...filters },
        createdAt: new Date().toISOString(),
      };
      setSavedFilters(prev => [...prev, newFilter]);
    }
  };

  const handleLoadFilter = (savedFilter) => {
    setFilters(savedFilter.filters);
  };

  const handleDeleteFilter = (filterId) => {
    setSavedFilters(prev => prev.filter(filter => filter.id !== filterId));
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.dateRange !== "all") count++;
    if (filters.users.length > 0) count++;
    if (filters.actions.length > 0) count++;
    if (filters.severity.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.ipAddress) count++;
    return count;
  };

  const applyFilters = () => {
    // In a real app, this would trigger the actual filtering logic
  };

  return (
    <div className="space-y-4">
      {/* Quick Filters */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Quick Filters</h3>
            {getActiveFilterCount() > 0 && (
              <Badge variant="info">{getActiveFilterCount()} active</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? "Hide Advanced" : "Show Advanced"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              disabled={getActiveFilterCount() === 0}
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.dateRange}
            onChange={(value) => handleFilterChange("dateRange", value)}
            options={dateRanges}
          />
          <div className="flex items-center gap-2">
            <Button onClick={applyFilters} className="flex-1">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleSaveFilter}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Advanced Filters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Users */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Users
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {users.map((user) => (
                  <label key={user.value} className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.users.includes(user.value)}
                      onChange={(checked) => handleMultiSelectChange("users", user.value, checked)}
                    />
                    <span className="text-sm text-gray-700">{user.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actions
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {actions.map((action) => (
                  <label key={action.value} className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.actions.includes(action.value)}
                      onChange={(checked) => handleMultiSelectChange("actions", action.value, checked)}
                    />
                    <span className="text-sm text-gray-700">{action.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <div className="space-y-2">
                {severityLevels.map((severity) => (
                  <label key={severity.value} className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.severity.includes(severity.value)}
                      onChange={(checked) => handleMultiSelectChange("severity", severity.value, checked)}
                    />
                    <Badge
                      variant="default"
                      size="sm"
                      className={severity.color}
                    >
                      {severity.label}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <label key={category.value} className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.categories.includes(category.value)}
                        onChange={(checked) => handleMultiSelectChange("categories", category.value, checked)}
                      />
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{category.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* IP Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IP Address
              </label>
              <Input
                placeholder="192.168.1.1"
                value={filters.ipAddress}
                onChange={(e) => handleFilterChange("ipAddress", e.target.value)}
              />
            </div>

            {/* Custom Date Range */}
            {filters.dateRange === "custom" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    placeholder="Start Date"
                  />
                  <Input
                    type="date"
                    placeholder="End Date"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Saved Filters</h4>
          <div className="flex flex-wrap gap-2">
            {savedFilters.map((savedFilter) => (
              <div
                key={savedFilter.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-700">
                  {savedFilter.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadFilter(savedFilter)}
                >
                  Load
                </Button>
                <button
                  onClick={() => handleDeleteFilter(savedFilter.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filter Summary */}
      {getActiveFilterCount() > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Active Filters</h4>
              <p className="text-sm text-blue-700">
                {getActiveFilterCount()} filter(s) applied
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={applyFilters}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Results
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

