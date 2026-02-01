"use client";

import { useState } from "react";
import {
  Card,
  StatCard,
  Button,
  Input,
  Select,
} from "../../../../components/ui";
import {
  Plus,
  Search,
  Filter,
  IndianRupee,
  TrendingUp,
  Clock,
  Target,
  BarChart3,
  ChevronRight,
  ChevronDown,
  Bell,
  Settings,
  User,
  Download,
  X,
  Star,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import KanbanBoard from "../../../../components/kanban/KanbanBoard";
import { Card as UICard, Avatar, Badge } from "../../../../components/ui";
// import { formatDate } from '@xtrawrkx/utils';

export default function DealsPipelinePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Mock data for KPIs
  const pipelineStats = {
    totalValue: 255000,
    activeDeals: 5,
    winRate: 67,
    avgDealSize: 42500,
  };

  // Mock deals data in the new format
  const dealsData = {
    prospecting: [
      {
        id: "d1",
        name: "Enterprise CRM Implementation",
        company: "TechCorp Inc.",
        value: 75000,
        probability: 25,
        owner: "John Smith",
        closeDate: "2024-02-15",
        tags: ["enterprise", "crm"],
      },
      {
        id: "d2",
        name: "Marketing Automation Setup",
        company: "StartupXYZ",
        value: 25000,
        probability: 40,
        owner: "Jane Doe",
        closeDate: "2024-01-30",
        tags: ["marketing", "automation"],
      },
    ],
    qualification: [
      {
        id: "d3",
        name: "Q1 Support Package",
        company: "Global Solutions",
        value: 15000,
        probability: 60,
        owner: "Mike Johnson",
        closeDate: "2024-01-20",
        tags: ["support", "quarterly"],
      },
    ],
    proposal: [
      {
        id: "d4",
        name: "Advanced Analytics Dashboard",
        company: "InnovateLab",
        value: 40000,
        probability: 75,
        owner: "Sarah Wilson",
        closeDate: "2024-02-01",
        tags: ["analytics", "dashboard"],
      },
    ],
    negotiation: [
      {
        id: "d5",
        name: "E-commerce Platform",
        company: "GrowthCo",
        value: 60000,
        probability: 85,
        owner: "John Smith",
        closeDate: "2024-01-25",
        tags: ["ecommerce", "platform"],
      },
    ],
    "closed-won": [
      {
        id: "d6",
        name: "Website Redesign",
        company: "ClientABC",
        value: 30000,
        probability: 100,
        owner: "Jane Doe",
        closeDate: "2024-01-15",
        tags: ["website", "design"],
      },
    ],
  };

  const formatNumber = (value) => value?.toLocaleString() || "0";

  // Handle drag end - update deal status
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Find the dragged deal
    const sourceDeals = dealsData[source.droppableId];
    const draggedDeal = sourceDeals.find(
      (deal) => deal.id.toString() === draggableId
    );

    if (draggedDeal) {

      // Here you would typically make an API call to update the deal stage
    }
  };

  const handleDealClick = (deal) => {
    // Navigate to deal detail page
  };

  // Render individual deal card
  const renderDealCard = (deal) => {
    const getProbabilityColor = (probability) => {
      if (probability >= 80) return "text-green-600";
      if (probability >= 60) return "text-yellow-600";
      if (probability >= 40) return "text-orange-600";
      return "text-red-600";
    };

    return (
      <UICard
        className="p-4 cursor-move bg-white border border-gray-200 hover:shadow-md transition-all"
        onClick={() => handleDealClick(deal)}
      >
        {/* Deal Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate mb-1">
              {deal?.name || "Unknown"}
            </h4>
            <p className="text-sm text-gray-600 truncate">
              {deal?.company || "N/A"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              ${deal?.value ? formatNumber(deal.value) : "0"}
            </div>
            <div
              className={`text-sm font-medium ${getProbabilityColor(
                deal?.probability || 0
              )}`}
            >
              {deal?.probability || 0}%
            </div>
          </div>
        </div>

        {/* Deal Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Owner:</span>
            <span className="font-medium text-gray-900">
              {deal?.owner || "N/A"}
            </span>
          </div>

          {deal?.closeDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Close Date:</span>
              <span className="font-medium text-gray-900">
                {formatDate(deal.closeDate)}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                (deal?.probability || 0) >= 80
                  ? "bg-green-500"
                  : (deal?.probability || 0) >= 60
                  ? "bg-yellow-500"
                  : (deal?.probability || 0) >= 40
                  ? "bg-orange-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${deal?.probability || 0}%` }}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {deal?.tags &&
            deal.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
          {deal?.tags && deal.tags.length > 2 && (
            <span className="text-xs text-gray-400">
              +{deal.tags.length - 2}
            </span>
          )}
        </div>
      </UICard>
    );
  };

  // Render column headers
  const renderColumnHeader = (columnId, cardsCount) => {
    const columnConfig = {
      prospecting: {
        title: "Prospecting",
        color: "border-yellow-500",
        bg: "bg-yellow-50",
      },
      qualification: {
        title: "Qualification",
        color: "border-blue-500",
        bg: "bg-blue-50",
      },
      proposal: {
        title: "Proposal",
        color: "border-purple-500",
        bg: "bg-purple-50",
      },
      negotiation: {
        title: "Negotiation",
        color: "border-orange-500",
        bg: "bg-orange-50",
      },
      "closed-won": {
        title: "Closed Won",
        color: "border-green-500",
        bg: "bg-green-50",
      },
    };

    const config = columnConfig[columnId] || {
      title: columnId,
      color: "border-gray-500",
      bg: "bg-gray-50",
    };

    return (
      <div
        className={`${config.bg} rounded-lg p-4 mb-4 border-l-4 ${config.color}`}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">
            {config.title}
          </h3>
          <span className="bg-white text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
            {cardsCount}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Page Header - Dashboard Style */}
      <Card glass={true}>
        <div className="flex items-center justify-between">
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-brand-text-light mb-2">
              <span>Dashboard</span>
              <ChevronRight className="w-4 h-4" />
              <span>Sales</span>
              <ChevronRight className="w-4 h-4" />
              <span>Deals</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-brand-foreground font-medium">
                Pipeline
              </span>
            </div>

            {/* Title and Subtitle */}
            <h1 className="text-5xl font-light text-brand-foreground mb-1 tracking-tight">
              Deals Pipeline
            </h1>
            <p className="text-brand-text-light">
              Manage your sales pipeline and track deal progression
            </p>
          </div>

          {/* Right side enhanced UI */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-text-light" />
              <input
                type="text"
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary focus:bg-white/15 transition-all duration-300 placeholder:text-brand-text-light shadow-lg"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {/* Add New Deal */}
              <button
                onClick={() => setIsAddDealModalOpen(true)}
                className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-brand-primary rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 group shadow-lg"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>

              {/* Filter */}
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
              >
                <Filter className="w-5 h-5 text-brand-text-light" />
              </button>

              {/* Export */}
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
              >
                <Download className="w-5 h-5 text-brand-text-light" />
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-brand-border"></div>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 hover:backdrop-blur-md transition-all duration-300"
                  onMouseEnter={() => setShowProfileDropdown(true)}
                  onMouseLeave={() => setShowProfileDropdown(false)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center shadow-lg">
                      <User className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-semibold text-brand-foreground">
                        Alex Johnson
                      </p>
                      <p className="text-xs text-brand-text-light">
                        Sales Manager
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-brand-text-light transition-transform ${
                      showProfileDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Profile Dropdown */}
                {showProfileDropdown && (
                  <>
                    {/* Backdrop to close dropdown when clicking outside */}
                    <div
                      className="fixed inset-0 z-[99998]"
                      onClick={() => setShowProfileDropdown(false)}
                    />
                    <div
                      className="fixed right-6 top-20 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 z-[99999]"
                      onMouseEnter={() => setShowProfileDropdown(true)}
                      onMouseLeave={() => setShowProfileDropdown(false)}
                    >
                      <div className="p-4 border-b border-white/20">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center shadow-lg">
                            <User className="w-6 h-6 text-brand-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-brand-foreground">
                              Alex Johnson
                            </p>
                            <p className="text-sm text-brand-text-light">
                              alex.johnson@company.com
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-brand-hover rounded-lg transition-colors">
                          <User className="w-4 h-4 text-brand-text-light" />
                          <span className="text-sm text-brand-foreground">
                            View Profile
                          </span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-brand-hover rounded-lg transition-colors">
                          <Settings className="w-4 h-4 text-brand-text-light" />
                          <span className="text-sm text-brand-foreground">
                            Settings
                          </span>
                        </button>
                        <div className="h-px bg-brand-border my-2 mx-3"></div>
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600">
                          <Bell className="w-4 h-4" />
                          <span className="text-sm">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Pipeline"
            value={`₹${(pipelineStats.totalValue / 1000).toFixed(0)}K`}
            change="+12%"
            changeType="increase"
            icon={IndianRupee}
            iconBg="bg-green-100"
            iconColor="text-green-600"
            className="hover:bg-yellow-50 hover:border-yellow-200 transition-all duration-200 cursor-pointer group"
            titleClassName="group-hover:text-yellow-800"
            valueClassName="group-hover:text-yellow-900"
          />
          <StatCard
            title="Active Deals"
            value={pipelineStats.activeDeals}
            subtitle="opportunities"
            change="+2"
            changeType="increase"
            icon={Target}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            className="hover:bg-yellow-50 hover:border-yellow-200 transition-all duration-200 cursor-pointer group"
            titleClassName="group-hover:text-yellow-800"
            valueClassName="group-hover:text-yellow-900"
          />
          <StatCard
            title="Win Rate"
            value={`${pipelineStats.winRate}%`}
            subtitle="this month"
            change="+5%"
            changeType="increase"
            icon={TrendingUp}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            className="hover:bg-yellow-50 hover:border-yellow-200 transition-all duration-200 cursor-pointer group"
            titleClassName="group-hover:text-yellow-800"
            valueClassName="group-hover:text-yellow-900"
          />
          <StatCard
            title="Avg Deal Size"
            value={`$${(pipelineStats.avgDealSize / 1000).toFixed(0)}K`}
            change="+8%"
            changeType="increase"
            icon={Clock}
            iconBg="bg-yellow-100"
            iconColor="text-yellow-600"
            className="hover:bg-yellow-50 hover:border-yellow-200 transition-all duration-200 cursor-pointer group"
            titleClassName="group-hover:text-yellow-800"
            valueClassName="group-hover:text-yellow-900"
          />
        </div>

        {/* Pipeline Board */}
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pipeline Board
            </h2>
            <p className="text-sm text-gray-600">
              Drag and drop deals between stages
            </p>
          </div>
          <div className="p-4">
            <KanbanBoard
              columns={dealsData}
              onDragEnd={handleDragEnd}
              renderCard={renderDealCard}
              renderColumnHeader={renderColumnHeader}
              className="min-w-[1600px]"
            />
          </div>
        </Card>
      </div>

      {/* Modals */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      <AddDealModal
        isOpen={isAddDealModalOpen}
        onClose={() => setIsAddDealModalOpen(false)}
      />
    </div>
  );
}

// Filter Modal Component
function FilterModal({ isOpen, onClose }) {
  const [filters, setFilters] = useState({
    stage: "",
    priority: "",
    company: "",
    minValue: "",
    maxValue: "",
  });

  const handleApply = () => {
    // Apply filters logic here
    onClose();
  };

  const handleClear = () => {
    setFilters({
      stage: "",
      priority: "",
      company: "",
      minValue: "",
      maxValue: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card
        glass={true}
        className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/30 shadow-2xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 backdrop-blur-md border border-yellow-300/40 rounded-lg flex items-center justify-center shadow-lg">
                <Filter className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Filter Deals
                </h2>
                <p className="text-xs text-gray-600">Refine your deals</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Stage
                </label>
                <Select
                  value={filters.stage}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, stage: value }))
                  }
                  options={[
                    { value: "", label: "All Stages" },
                    { value: "discovery", label: "Discovery" },
                    { value: "proposal", label: "Proposal" },
                    { value: "negotiation", label: "Negotiation" },
                  ]}
                  placeholder="Stage"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <Select
                  value={filters.priority}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, priority: value }))
                  }
                  options={[
                    { value: "", label: "All Priorities" },
                    { value: "high", label: "High" },
                    { value: "medium", label: "Medium" },
                    { value: "low", label: "Low" },
                  ]}
                  placeholder="Priority"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Company
              </label>
              <Input
                value={filters.company}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, company: e.target.value }))
                }
                placeholder="Enter company name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Min Value ($)
                </label>
                <Input
                  type="number"
                  value={filters.minValue}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minValue: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Max Value ($)
                </label>
                <Input
                  type="number"
                  value={filters.maxValue}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxValue: e.target.value,
                    }))
                  }
                  placeholder="1000000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClear}
              className="px-4 py-2 text-sm"
            >
              Clear All
            </Button>
            <Button
              onClick={handleApply}
              className="px-4 py-2 text-sm bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white border-0 shadow-lg"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Export Modal Component
function ExportModal({ isOpen, onClose }) {
  const [exportFormat, setExportFormat] = useState("pdf");
  const [includeCharts, setIncludeCharts] = useState(true);

  const handleExport = () => {
    // Export logic here
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card
        glass={true}
        className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/30 shadow-2xl"
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 backdrop-blur-md border border-yellow-300/40 rounded-lg flex items-center justify-center shadow-lg">
                <Download className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Export Deals
                </h2>
                <p className="text-xs text-gray-600">Choose export format</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <Select
                value={exportFormat}
                onChange={(value) => setExportFormat(value)}
                options={[
                  { value: "pdf", label: "PDF Document" },
                  { value: "excel", label: "Excel Spreadsheet" },
                  { value: "csv", label: "CSV File" },
                ]}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeCharts"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
              />
              <label
                htmlFor="includeCharts"
                className="ml-2 text-sm text-gray-700"
              >
                Include charts and graphs
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-4 py-2 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              className="px-4 py-2 text-sm bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white border-0 shadow-lg"
            >
              Export Deals
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Add Deal Modal Component
function AddDealModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    value: "",
    stage: "discovery",
    priority: "medium",
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = "Deal title is required";
    }

    if (!formData.company.trim()) {
      errors.company = "Company name is required";
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      errors.value = "Deal value must be greater than 0";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Add deal logic here
      handleClose();
    } catch (error) {
      console.error("Error adding deal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      company: "",
      value: "",
      stage: "discovery",
      priority: "medium",
    });
    setFormErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card
        glass={true}
        className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/30 shadow-2xl"
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 backdrop-blur-md border border-yellow-300/40 rounded-lg flex items-center justify-center shadow-lg">
                <Plus className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Add New Deal
                </h2>
                <p className="text-xs text-gray-600">
                  Create a new sales opportunity
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deal Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter deal title"
                error={formErrors.title}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <Input
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                placeholder="Enter company name"
                error={formErrors.company}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deal Value *
              </label>
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => handleInputChange("value", e.target.value)}
                placeholder="Enter deal value"
                error={formErrors.value}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stage
                </label>
                <Select
                  value={formData.stage}
                  onChange={(value) => handleInputChange("stage", value)}
                  options={[
                    { value: "discovery", label: "Discovery" },
                    { value: "proposal", label: "Proposal" },
                    { value: "negotiation", label: "Negotiation" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <Select
                  value={formData.priority}
                  onChange={(value) => handleInputChange("priority", value)}
                  options={[
                    { value: "high", label: "High" },
                    { value: "medium", label: "Medium" },
                    { value: "low", label: "Low" },
                  ]}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="px-4 py-2 text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white border-0 shadow-lg"
              >
                {isSubmitting ? "Adding..." : "Add Deal"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
