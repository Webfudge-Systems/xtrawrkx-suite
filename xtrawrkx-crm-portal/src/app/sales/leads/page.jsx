"use client";

import { useState, useEffect, useRef } from "react";
import {
  Container,
  Card,
  Table,
  Badge,
  Avatar,
  Button,
  Input,
  Select,
  Modal,
  Tabs,
  EmptyState,
} from "../../../components/ui";
import { formatNumber } from "../../../lib/utils";
// import { formatDate } from "@xtrawrkx/utils";
// import { useDragDropBoard } from "../../../lib/dragdrop"; // Removed - using react-beautiful-dnd now

// Local utility function to replace @xtrawrkx/utils formatDate
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
import {
  leadsData as initialLeadsData,
  leadSources,
  assignees,
  getLeadsByStatus,
  getLeadStats,
  searchLeads,
  filterLeads,
} from "../../../lib/data/leadsData";

import LeadsHeader from "./components/LeadsHeader";
import LeadsKPIs from "./components/LeadsKPIs";
import LeadsTabs from "./components/LeadsTabs";
import LeadsListView from "./components/LeadsListView";
import LeadsBoardView from "./components/LeadsBoardView";
import LeadsModal from "./components/LeadsModal";
import LeadsFilterModal from "./components/LeadsFilterModal";
import LeadsImportModal from "./components/LeadsImportModal";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreVertical,
  UserPlus,
  Star,
  Clock,
  User,
  PhoneCall,
  CheckCircle,
  XCircle,
  FileText,
  FileSpreadsheet,
  X,
  CloudUpload,
  ChevronDown,
  List,
  Grid3X3,
  DollarSign,
} from "lucide-react";

export default function LeadsPage() {
  // State management
  const [leads, setLeads] = useState(initialLeadsData);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeView, setActiveView] = useState("list");
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showAddSuccessMessage, setShowAddSuccessMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    source: "",
    value: "",
    status: "new",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const exportDropdownRef = useRef(null);

  // Create columns for drag and drop board
  const createBoardColumns = (leadsData) => {
    const statuses = ["new", "contacted", "qualified", "lost"];
    return statuses.map((status) => ({
      id: status,
      title: status.charAt(0).toUpperCase() + status.slice(1),
      leads: leadsData.filter((lead) => lead.status === status),
    }));
  };

  const boardColumns = createBoardColumns(leads);

  // Drag and drop functionality for the new KanbanBoard component
  const handleItemDrop = (
    draggedItem,
    destinationColumnId,
    destinationIndex,
    sourceColumnId,
    sourceIndex
  ) => {
    // Update the lead's status when moved between columns
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id.toString() === draggedItem.id.toString()
          ? { ...lead, status: destinationColumnId }
          : lead
      )
    );
  };

  const handleItemClick = (item) => {
  };

  const updatedColumns = boardColumns;

  // Filter leads based on search and active tab
  const filteredLeads = leads.filter((lead) => {
    if (!lead) return false;

    const matchesSearch =
      searchQuery === "" ||
      (lead.name &&
        lead.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.company &&
        lead.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.email &&
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTab = activeTab === "all" || lead.status === activeTab;

    return matchesSearch && matchesTab;
  });

  // Get lead statistics
  const leadStats = getLeadStats(leads);
  const statusStats = [
    {
      label: "New",
      count: leadStats.new,
      color: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      icon: User,
    },
    {
      label: "Contacted",
      count: leadStats.contacted,
      color: "bg-yellow-50",
      borderColor: "border-yellow-200",
      iconColor: "text-yellow-600",
      icon: PhoneCall,
    },
    {
      label: "Qualified",
      count: leadStats.qualified,
      color: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      icon: CheckCircle,
    },
    {
      label: "Lost",
      count: leadStats.lost,
      color: "bg-red-50",
      borderColor: "border-red-200",
      iconColor: "text-red-600",
      icon: XCircle,
    },
  ];

  // Tab items for navigation
  const tabItems = [
    { key: "all", label: "All Leads", badge: leads.length.toString() },
    { key: "new", label: "New", badge: leadStats.new.toString() },
    {
      key: "contacted",
      label: "Contacted",
      badge: leadStats.contacted.toString(),
    },
    {
      key: "qualified",
      label: "Qualified",
      badge: leadStats.qualified.toString(),
    },
    { key: "lost", label: "Lost", badge: leadStats.lost.toString() },
  ];

  // Table columns configuration
  const leadColumnsTable = [
    {
      key: "name",
      label: "NAME",
      render: (_, lead) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar name={lead.name} size="sm" className="flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {lead.name}
            </div>
            <div className="text-sm text-gray-500 truncate">{lead.company}</div>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      label: "CONTACT",
      render: (_, lead) => (
        <div className="space-y-1 min-w-[200px]">
          <div className="flex items-center gap-2 text-sm text-gray-900">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "STATUS",
      render: (_, lead) => (
        <div className="min-w-[100px]">
          <Badge
            variant={
              lead.status === "new"
                ? "default"
                : lead.status === "contacted"
                ? "warning"
                : lead.status === "qualified"
                ? "success"
                : "destructive"
            }
          >
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </Badge>
        </div>
      ),
    },
    {
      key: "source",
      label: "SOURCE",
      render: (_, lead) => (
        <span className="text-sm text-gray-600 capitalize whitespace-nowrap min-w-[100px]">
          {lead.source.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "value",
      label: "DEAL VALUE",
      render: (_, lead) => (
        <span className="font-semibold text-gray-900 whitespace-nowrap min-w-[100px]">
          ${formatNumber(lead.value)}
        </span>
      ),
    },
    {
      key: "assignedTo",
      label: "ASSIGNED TO",
      render: (_, lead) => (
        <div className="flex items-center gap-2 min-w-[140px]">
          <Avatar name={lead.assignedTo} size="xs" className="flex-shrink-0" />
          <span className="text-sm text-gray-600 truncate">
            {lead.assignedTo}
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "CREATED",
      render: (_, lead) => (
        <div className="flex items-center gap-2 text-sm text-gray-500 min-w-[120px]">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="whitespace-nowrap">
            {formatDate(lead.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (_, lead) => (
        <div className="flex items-center gap-1 min-w-[120px]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStatusUpdate(lead.id, "contacted")}
            className="text-blue-600 hover:text-blue-700 p-1"
            title="Mark as Contacted"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStatusUpdate(lead.id, "qualified")}
            className="text-green-600 hover:text-green-700 p-1"
            title="Mark as Qualified"
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStatusUpdate(lead.id, "lost")}
            className="text-red-600 hover:text-red-700 p-1"
            title="Mark as Lost"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Handle status updates
  const handleStatusUpdate = (leadId, newStatus) => {
    if (!leadId) return;

    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead?.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Basic validation
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (!formData.phone.trim()) errors.phone = "Phone is required";
    if (!formData.company.trim()) errors.company = "Company is required";
    if (!formData.source) errors.source = "Lead source is required";
    if (!formData.value) errors.value = "Deal value is required";
    if (!formData.status) errors.status = "Status is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    // Create new lead
    const newLead = {
      id: Date.now().toString(),
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      jobTitle: formData.jobTitle,
      source: formData.source,
      value: parseFloat(formData.value),
      status: formData.status,
      assignedTo: "John Doe", // Default assignee
      createdAt: new Date().toISOString(),
      score: Math.floor(Math.random() * 100) + 1,
    };

    setLeads((prev) => [newLead, ...prev]);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      jobTitle: "",
      source: "",
      value: "",
      status: "new",
      notes: "",
    });
    setFormErrors({});
    setIsModalOpen(false);
    setShowAddSuccessMessage(true);
    setTimeout(() => setShowAddSuccessMessage(false), 3000);
    setIsSubmitting(false);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      jobTitle: "",
      source: "",
      value: "",
      status: "new",
      notes: "",
    });
    setFormErrors({});
  };

  // Handle export
  const handleExport = (format) => {
    setShowExportDropdown(false);
  };

  // Handle filter application
  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters);
  };

  // Handle import
  const handleImport = (file) => {
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target)
      ) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Success Messages */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Lead status updated successfully!
        </div>
      )}

      {showAddSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          New lead added successfully!
        </div>
      )}

      {/* Custom Header */}
      <LeadsHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setIsFilterModalOpen={setIsFilterModalOpen}
        setIsImportModalOpen={setIsImportModalOpen}
        showExportDropdown={showExportDropdown}
        setShowExportDropdown={setShowExportDropdown}
        exportDropdownRef={exportDropdownRef}
        handleExport={handleExport}
        setIsModalOpen={setIsModalOpen}
      />

      <div className="px-3">
        <div className="space-y-4">
          {/* Stats Overview */}
          <LeadsKPIs statusStats={statusStats} />

          {/* View Toggle */}
          <LeadsTabs
            tabItems={tabItems}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeView={activeView}
            setActiveView={setActiveView}
          />

          {/* Single Horizontal Scroll Container */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Leads Table/Board */}
            {activeView === "list" && (
              <LeadsListView
                filteredLeads={filteredLeads}
                leadColumnsTable={leadColumnsTable}
                selectedLeads={selectedLeads}
                setSelectedLeads={setSelectedLeads}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                setIsModalOpen={setIsModalOpen}
              />
            )}
            {activeView === "board" && (
              <LeadsBoardView
                updatedColumns={boardColumns}
                formatNumber={formatNumber}
                onItemDrop={handleItemDrop}
                onItemClick={handleItemClick}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      <LeadsModal
        isModalOpen={isModalOpen}
        handleModalClose={handleModalClose}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        formErrors={formErrors}
        isSubmitting={isSubmitting}
      />

      {/* Filter Modal */}
      <LeadsFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
      />

      {/* Import Modal */}
      <LeadsImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
}
