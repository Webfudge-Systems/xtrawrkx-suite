"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Pagination,
} from "../../../components/ui";
import { formatNumber, formatCurrency } from "../../../lib/utils";
import { toast } from "react-toastify";

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
import leadCompanyService from "../../../lib/api/leadCompanyService";
import strapiClient from "../../../lib/strapiClient";
import { useAuth } from "../../../contexts/AuthContext";
import authService from "../../../lib/authService";

import PageHeader from "../../../components/PageHeader";
import LeadsKPIs from "./components/LeadsKPIs";
import LeadsTabs from "./components/LeadsTabs";
import LeadsListView from "./components/LeadsListView";
import LeadsBoardView from "./components/LeadsBoardView";
import LeadsFilterModal from "./components/LeadsFilterModal";
import LeadsImportModal from "./components/LeadsImportModal";
import ColumnVisibilityModal from "./components/ColumnVisibilityModal";
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
  Trash2,
  CloudUpload,
  ChevronDown,
  List,
  Grid3X3,
  IndianRupee,
  Building2,
} from "lucide-react";

export default function LeadCompaniesPage() {
  const router = useRouter();
  const { user } = useAuth();
  // State management
  const [leadCompanies, setLeadCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeView, setActiveView] = useState("list");
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showAddSuccessMessage, setShowAddSuccessMessage] = useState(false);
  const [loadingActions, setLoadingActions] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [companyToConvert, setCompanyToConvert] = useState(null);
  const [showConvertSuccess, setShowConvertSuccess] = useState(false);
  const [convertedCompanyName, setConvertedCompanyName] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [companyToAssign, setCompanyToAssign] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isColumnVisibilityModalOpen, setIsColumnVisibilityModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);

  // Check if user is admin or super admin
  const isAdmin = () => {
    if (!user) return false;
    return (
      authService.isAdmin() ||
      user.primaryRole?.name === "Super Admin" ||
      user.primaryRole?.name === "Admin" ||
      user.userRoles?.some((role) =>
        ["Super Admin", "Admin"].includes(role.name)
      )
    );
  };

  // Initialize visible columns from localStorage or default to all columns
  useEffect(() => {
    const STORAGE_KEY = "leadCompanyColumnsVisibility";
    const allColumnKeys = [
      "company",
      "contact",
      "status",
      "source",
      "type",
      "subType",
      "value",
      "contactsCount",
      "assignedTo",
      "createdAt",
      "actions",
    ];

    if (visibleColumns.length === 0) {
      try {
        // Try to load from localStorage
        const savedColumns = localStorage.getItem(STORAGE_KEY);
        if (savedColumns) {
          const parsedColumns = JSON.parse(savedColumns);
          // Validate that saved columns are valid
          const validColumns = parsedColumns.filter((key) =>
            allColumnKeys.includes(key)
          );
          if (validColumns.length > 0) {
            setVisibleColumns(validColumns);
          } else {
            setVisibleColumns(allColumnKeys);
          }
        } else {
          setVisibleColumns(allColumnKeys);
        }
      } catch (error) {
        console.error("Error loading column visibility from localStorage:", error);
        setVisibleColumns(allColumnKeys);
      }
    }
  }, []);

  // Save column visibility to localStorage whenever it changes
  useEffect(() => {
    if (visibleColumns.length > 0) {
      const STORAGE_KEY = "leadCompanyColumnsVisibility";
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
      } catch (error) {
        console.error("Error saving column visibility to localStorage:", error);
      }
    }
  }, [visibleColumns]);

  // Fetch lead companies from Strapi
  useEffect(() => {
    fetchLeadCompanies();
    fetchStats();
  }, []);

  // Fetch users for filter dropdown (all users, not just for admin)
  useEffect(() => {
      fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      // Fetch all Xtrawrkx users with pagination to get all users
      let allUsers = [];
      let page = 1;
      let hasMore = true;
      const pageSize = 100;

      while (hasMore) {
        // Format query params for Strapi v4
        const queryParams = {
          "pagination[page]": page,
          "pagination[pageSize]": pageSize,
          populate: "primaryRole,userRoles",
        };

        const response = await strapiClient.getXtrawrkxUsers(queryParams);

        // Handle Strapi v4 response format
        const usersData = response?.data || [];
        if (Array.isArray(usersData)) {
          // Extract user attributes from Strapi v4 format
          const extractedUsers = usersData.map((user) => {
            if (user.attributes) {
              // Strapi v4 format: { id, attributes: {...} }
              return {
                id: user.id,
                documentId: user.id,
                ...user.attributes,
                primaryRole:
                  user.attributes.primaryRole?.data?.attributes ||
                  user.attributes.primaryRole?.attributes ||
                  user.attributes.primaryRole,
              };
            }
            // Direct format (if already flattened)
            return user;
          });
          allUsers = [...allUsers, ...extractedUsers];

          // Check if there are more pages
          const total = response?.meta?.pagination?.total || allUsers.length;
          const pageCount = response?.meta?.pagination?.pageCount || 1;
          hasMore = page < pageCount && usersData.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      setUsers(allUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLeadCompanies = async () => {
    try {
      setLoading(true);
      const response = await leadCompanyService.getAll({
        sort: "createdAt:desc",
        pagination: { pageSize: 100 },
        populate: ["contacts", "assignedTo", "deals"],
      });

      if (response.data && response.data.length > 0) {
      }

      setLeadCompanies(response.data || []);
    } catch (err) {
      console.error("Error fetching lead companies:", err);
      setError("Failed to load lead companies");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await leadCompanyService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Create columns for drag and drop board
  const createBoardColumns = (companiesData) => {
    const statuses = ["new", "contacted", "qualified", "lost"];
    return statuses.map((status) => ({
      id: status,
      title: status.charAt(0).toUpperCase() + status.slice(1),
      items: companiesData.filter((company) => company.status === status),
    }));
  };

  const boardColumns = createBoardColumns(leadCompanies);

  // Drag and drop functionality for the new KanbanBoard component
  const handleItemDrop = (
    draggedItem,
    destinationColumnId,
    destinationIndex,
    sourceColumnId,
    sourceIndex
  ) => {
    // Update the company's status when moved between columns
    setLeadCompanies((prevCompanies) =>
      prevCompanies.map((company) =>
        company.id.toString() === draggedItem.id.toString()
          ? { ...company, status: destinationColumnId }
          : company
      )
    );
  };

  const handleItemClick = (item) => {
  };

  const updatedColumns = boardColumns;

  // Filter companies based on search, active tab, and applied filters
  const filteredCompanies = leadCompanies.filter((company) => {
    if (!company) return false;

    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      (company.companyName &&
        company.companyName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (company.email &&
        company.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (company.contacts &&
        company.contacts.length > 0 &&
        company.contacts[0].firstName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (company.contacts &&
        company.contacts.length > 0 &&
        company.contacts[0].lastName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()));

    // Tab filter
    const matchesTab =
      activeTab === "all" ||
      company.status?.toLowerCase() === activeTab.toLowerCase();

    // Applied filters
    let matchesFilters = true;
    
    if (Object.keys(appliedFilters).length > 0) {
      // Status filter
      if (appliedFilters.status) {
        const filterStatus = appliedFilters.status.toLowerCase();
        const companyStatus = company.status?.toLowerCase() || "";
        if (filterStatus !== companyStatus) {
          matchesFilters = false;
        }
      }
      
      // Source filter - match exact enum value
      if (appliedFilters.source) {
        const companySource = company.source || "";
        if (companySource !== appliedFilters.source) {
          matchesFilters = false;
        }
      }
      
      // Type filter
      if (appliedFilters.type) {
        const companyType = company.type || "";
        if (companyType !== appliedFilters.type) {
          matchesFilters = false;
        }
      }
      
      // Sub-Type filter
      if (appliedFilters.subType) {
        const companySubType = company.subType || "";
        if (companySubType !== appliedFilters.subType) {
          matchesFilters = false;
        }
      }
      
      // Company name filter
      if (appliedFilters.company) {
        const filterCompany = appliedFilters.company.toLowerCase();
        const companyName = company.companyName?.toLowerCase() || "";
        if (!companyName.includes(filterCompany)) {
          matchesFilters = false;
        }
      }
      
      // Assigned to filter - match by user ID
      if (appliedFilters.assignedTo) {
        const assignedUser = company.assignedTo;
        const assignedUserId = assignedUser
          ? (assignedUser.id || assignedUser.documentId)?.toString()
          : "";
        const filterUserId = appliedFilters.assignedTo.toString();
        if (assignedUserId !== filterUserId) {
          matchesFilters = false;
        }
      }
      
      // Date range filter
      if (appliedFilters.dateRange && company.createdAt) {
        const now = new Date();
        let startDate;
        
        switch (appliedFilters.dateRange) {
          case "today":
            startDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "quarter":
            const quarterStart = Math.floor(now.getMonth() / 3) * 3;
            startDate = new Date(now.getFullYear(), quarterStart, 1);
            break;
        }
        
        if (startDate) {
          const companyDate = new Date(company.createdAt);
          if (companyDate < startDate) {
            matchesFilters = false;
          }
        }
      }
      
      // Value range filter
      if (appliedFilters.valueRange) {
        const totalDealValue = company.deals
          ? company.deals.reduce(
              (total, deal) => total + (parseFloat(deal.value) || 0),
              0
            )
          : company.dealValue || 0;
        
        let matchesValueRange = false;
        switch (appliedFilters.valueRange) {
          case "0-25k":
            matchesValueRange = totalDealValue >= 0 && totalDealValue <= 25000;
            break;
          case "25k-50k":
            matchesValueRange = totalDealValue > 25000 && totalDealValue <= 50000;
            break;
          case "50k-100k":
            matchesValueRange = totalDealValue > 50000 && totalDealValue <= 100000;
            break;
          case "100k+":
            matchesValueRange = totalDealValue > 100000;
            break;
        }
        
        if (!matchesValueRange) {
          matchesFilters = false;
        }
      }
    }

    return matchesSearch && matchesTab && matchesFilters;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters, searchQuery, activeTab]);

  // Show filtered count after data is loaded
  const prevFilteredCountRef = useRef(null);
  useEffect(() => {
    const hasActiveFilters = Object.values(appliedFilters).some(
      (value) => value && value.toString().trim() !== ""
    );
    
    if (hasActiveFilters && !loading && filteredCompanies.length !== prevFilteredCountRef.current) {
      prevFilteredCountRef.current = filteredCompanies.length;
      toast.success(`Filters applied. Showing ${filteredCompanies.length} result${filteredCompanies.length !== 1 ? 's' : ''}`);
    }
  }, [filteredCompanies.length, appliedFilters, loading]);

  // Get company statistics from API stats or calculate from data
  const leadStats = {
    new:
      stats.byStatus?.NEW ||
      leadCompanies.filter((c) => c.status === "NEW").length,
    contacted:
      stats.byStatus?.CONTACTED ||
      leadCompanies.filter((c) => c.status === "CONTACTED").length,
    qualified:
      stats.byStatus?.QUALIFIED ||
      leadCompanies.filter((c) => c.status === "QUALIFIED").length,
    lost:
      stats.byStatus?.LOST ||
      leadCompanies.filter((c) => c.status === "LOST").length,
  };
  const statusStats = [
    {
      label: "New",
      count: leadStats.new,
      color: "bg-orange-50",
      borderColor: "border-orange-200",
      iconColor: "text-orange-600",
      icon: Building2,
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
    {
      key: "all",
      label: "All Companies",
      badge: leadCompanies.length.toString(),
    },
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

  // Table columns configuration - Updated for Lead Companies
  const canEditAssignment = isAdmin();
  const leadCompanyColumnsTable = [
    {
      key: "company",
      label: "COMPANY",
      width: "350px",
      render: (_, company) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar
            alt={company.companyName}
            size="sm"
            className="flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {company.companyName}
            </div>
            <div className="text-sm text-gray-500 truncate">
              {company.contacts && company.contacts.length > 0
                ? `${company.contacts[0].firstName} ${company.contacts[0].lastName}`
                : "No primary contact"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      label: "PRIMARY CONTACT",
      width: "220px",
      render: (_, company) => (
        <div className="space-y-1 min-w-[200px]">
          <div className="flex items-center gap-2 text-sm text-gray-900">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">
              {company.contacts && company.contacts.length > 0
                ? company.contacts[0].email
                : company.email || "No email"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">
              {company.contacts && company.contacts.length > 0
                ? company.contacts[0].phone || "No contact"
                : company.phone || "No contact"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "STATUS",
      width: "140px",
      render: (_, company) => {
        const status = company.status?.toLowerCase() || "new";
        const statusColors = {
          new: {
            bg: "bg-blue-100",
            text: "text-blue-800",
            border: "border-blue-400",
            shadow: "shadow-blue-200",
          },
          contacted: {
            bg: "bg-yellow-100",
            text: "text-yellow-800",
            border: "border-yellow-400",
            shadow: "shadow-yellow-200",
          },
          qualified: {
            bg: "bg-green-100",
            text: "text-green-800",
            border: "border-green-400",
            shadow: "shadow-green-200",
          },
          converted: {
            bg: "bg-green-100",
            text: "text-green-800",
            border: "border-green-400",
            shadow: "shadow-green-200",
          },
          lost: {
            bg: "bg-red-100",
            text: "text-red-800",
            border: "border-red-400",
            shadow: "shadow-red-200",
          },
        };

        const colors = statusColors[status] || statusColors.new;
        const displayStatus = company.status || "New";

        return (
          <div className="min-w-[120px]">
            <div
              className={`${colors.bg} ${colors.text} ${colors.border} border-2 rounded-lg px-3 py-2 font-bold text-xs text-center shadow-md ${colors.shadow} transition-all duration-200 hover:scale-105 hover:shadow-lg inline-block`}
            >
              {displayStatus.toUpperCase()}
            </div>
          </div>
        );
      },
    },
    {
      key: "source",
      label: "SOURCE",
      width: "130px",
      render: (_, company) => (
        <span className="text-sm text-gray-600 capitalize whitespace-nowrap min-w-[100px]">
          {company.source?.replace("_", " ") || "N/A"}
        </span>
      ),
    },
    {
      key: "type",
      label: "COMPANY TYPE",
      width: "200px",
      render: (_, company) => {
        const companyType = company.type || "";
        const typeColors = {
          "startup-corporate": {
            bg: "bg-orange-100",
            text: "text-orange-800",
            border: "border-orange-400",
            shadow: "shadow-orange-200",
            label: "Startup and Corporates",
          },
          investor: {
            bg: "bg-indigo-100",
            text: "text-indigo-800",
            border: "border-indigo-400",
            shadow: "shadow-indigo-200",
            label: "Investors",
          },
          "enablers-academia": {
            bg: "bg-teal-100",
            text: "text-teal-800",
            border: "border-teal-400",
            shadow: "shadow-teal-200",
            label: "Enablers & Academia",
          },
        };

        const colors = typeColors[companyType];
        const displayType = colors?.label || companyType || "Not specified";

        if (!colors) {
          return (
            <span className="text-sm text-gray-500 whitespace-nowrap min-w-[150px]">
              {displayType}
            </span>
          );
        }

        return (
          <div className="min-w-[150px]">
            <div
              className={`${colors.bg} ${colors.text} ${colors.border} border rounded-md px-2 py-1 font-semibold text-[10px] text-center shadow-sm ${colors.shadow} transition-all duration-200 hover:scale-105 hover:shadow-md inline-block`}
            >
              {displayType.toUpperCase()}
            </div>
          </div>
        );
      },
    },
    {
      key: "subType",
      label: "SUB-TYPE",
      width: "200px",
      render: (_, company) => (
        <span className="text-sm text-gray-600 whitespace-nowrap min-w-[180px]">
          {company.subType || "Not specified"}
        </span>
      ),
    },
    {
      key: "value",
      label: "DEAL VALUE",
      width: "140px",
      render: (_, company) => {
        // Calculate total deal value from actual deals
        const totalDealValue = company.deals
          ? company.deals.reduce(
              (total, deal) => total + (parseFloat(deal.value) || 0),
              0
            )
          : company.dealValue || 0;

        return (
          <span className="font-semibold text-gray-900 whitespace-nowrap min-w-[100px]">
            {formatCurrency(totalDealValue)}
          </span>
        );
      },
    },
    {
      key: "contactsCount",
      label: "CONTACTS",
      width: "120px",
      render: (_, company) => (
        <div className="flex items-center gap-2 min-w-[100px]">
          <UserPlus className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {company.contacts ? company.contacts.length : 0}
          </span>
        </div>
      ),
    },
    {
      key: "assignedTo",
      label: "ASSIGNED TO",
      width: "200px",
      render: (_, company) => {
        const assignedUser = company.assignedTo;
        const assignedName = assignedUser
          ? `${assignedUser.firstName || ""} ${
              assignedUser.lastName || ""
            }`.trim() ||
            assignedUser.username ||
            "Unknown"
          : "Unassigned";

        const handleAssignClick = () => {
          setCompanyToAssign(company);
          setSelectedUserId(
            assignedUser?.id?.toString() ||
              assignedUser?.documentId?.toString() ||
              ""
          );
          setShowAssignModal(true);
        };

        return (
          <div className="flex items-center gap-2 min-w-[180px]">
            <Avatar
              alt={assignedName}
              fallback={(assignedName || "?").charAt(0).toUpperCase()}
              size="sm"
              className="flex-shrink-0"
            />
            <span className="text-sm text-gray-600 truncate flex-1 min-w-0">
              {assignedName}
            </span>
            {canEditAssignment && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssignClick();
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-all duration-200 text-xs"
                title="Change Assignee"
              >
                <User className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
    {
      key: "createdAt",
      label: "CREATED",
      width: "140px",
      render: (_, company) => (
        <div className="flex items-center gap-2 text-sm text-gray-500 min-w-[120px]">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="whitespace-nowrap">
            {formatDate(company.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "ACTIONS",
      width: "200px",
      render: (_, company) => (
        <div
          className="flex items-center gap-1 min-w-[120px]"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusUpdate(company.id, "CONTACTED");
            }}
            disabled={loadingActions[`${company.id}-contacted`]}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-2 rounded-lg transition-all duration-200 disabled:opacity-50"
            title="Mark as Contacted"
          >
            {loadingActions[`${company.id}-contacted`] ? (
              <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusUpdate(company.id, "QUALIFIED");
            }}
            disabled={loadingActions[`${company.id}-qualified`]}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2 rounded-lg transition-all duration-200 disabled:opacity-50"
            title="Mark as Qualified"
          >
            {loadingActions[`${company.id}-qualified`] ? (
              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCompanyToConvert(company);
              setShowConvertModal(true);
            }}
            disabled={loadingActions[`${company.id}-convert`]}
            className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 p-2 rounded-lg transition-all duration-200 disabled:opacity-50"
            title="Convert to Client"
          >
            {loadingActions[`${company.id}-convert`] ? (
              <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Building2 className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCompanyToDelete(company);
              setShowDeleteModal(true);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
            title="Delete Company"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Filter columns based on visibility
  const getVisibleColumns = () => {
    if (visibleColumns.length === 0) {
      return leadCompanyColumnsTable;
    }
    return leadCompanyColumnsTable.filter((col) => visibleColumns.includes(col.key));
  };

  const visibleColumnsTable = getVisibleColumns();

  // Handle status updates
  const handleStatusUpdate = async (companyId, newStatus) => {
    if (!companyId) {
      console.error("No company ID provided");
      return;
    }

    const loadingKey = `${companyId}-${newStatus.toLowerCase()}`;

    // Set loading state
    setLoadingActions((prev) => ({ ...prev, [loadingKey]: true }));

    try {

      // Update the status via API
      const response = await leadCompanyService.update(companyId, {
        status: newStatus.toUpperCase(),
      });


      // Update local state with lowercase status for UI consistency
      setLeadCompanies((prevCompanies) =>
        prevCompanies.map((company) =>
          company?.id === companyId
            ? { ...company, status: newStatus.toLowerCase() }
            : company
        )
      );

      // Refresh stats
      await fetchStats();

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

    } catch (error) {
      console.error("Error updating status:", error);
      console.error("Error details:", error.message);

      // Show user-friendly error message
      const errorMessage =
        error.message || "Failed to update status. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      // Clear loading state
      setLoadingActions((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle conversion to client
  const handleConvertToClient = async () => {
    if (!companyToConvert) return;

    const loadingKey = `${companyToConvert.id}-convert`;

    // Set loading state
    setLoadingActions((prev) => ({ ...prev, [loadingKey]: true }));

    try {

      const response = await leadCompanyService.convertToClient(
        companyToConvert.id
      );

      // Store company name for success animation
      const companyName = companyToConvert.companyName;

      // Close modal first
      setShowConvertModal(false);
      setCompanyToConvert(null);

      // Show success animation
      setConvertedCompanyName(companyName);
      setShowConvertSuccess(true);

      // Show toast notification
      toast.success(
        `Lead company "${companyName}" successfully converted to client account!`,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );

      // Refresh the lead companies list and stats
      await fetchLeadCompanies();
      await fetchStats();

      // Hide success animation after 3.5 seconds
      setTimeout(() => {
        setShowConvertSuccess(false);
        setConvertedCompanyName("");
      }, 3500);

    } catch (error) {
      console.error("Error converting to client:", error);
      console.error("Error details:", error.message);

      // Show user-friendly error message
      const errorMessage =
        error.message || "Failed to convert lead to client. Please try again.";
      toast.error(`Conversion Failed: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      // Clear loading state
      setLoadingActions((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle delete company
  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    const loadingKey = `${companyToDelete.id}-delete`;
    setLoadingActions((prev) => ({ ...prev, [loadingKey]: true }));

    try {

      // Delete the company via API (this will cascade delete linked data)
      await leadCompanyService.delete(companyToDelete.id);

      // Remove from local state
      setLeadCompanies((prev) =>
        prev.filter((company) => company.id !== companyToDelete.id)
      );

      // Update stats
      await fetchStats();

      // Close modal and reset state
      setShowDeleteModal(false);
      setCompanyToDelete(null);

    } catch (error) {
      console.error("Error deleting company:", error);
      alert("Failed to delete company. Please try again.");
    } finally {
      setLoadingActions((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle export functionality
  const handleExport = async (format) => {
    try {
      // Handle case where format might be an event object (from PageHeader or direct button click)
      let exportFormat = format;
      if (format && typeof format === 'object' && format.target) {
        // It's an event object, default to CSV
        exportFormat = "csv";
      } else if (!format || typeof format !== 'string') {
        // Invalid format, default to CSV
        exportFormat = "csv";
      }
      

      // Check if there's data to export
      if (filteredCompanies.length === 0) {
        alert("No lead companies to export");
        return;
      }

      // Prepare export data
      const exportData = filteredCompanies.map((company) => {
        const primaryContact = company.contacts && company.contacts.length > 0 ? company.contacts[0] : null;
        return {
          "Company Name": company.companyName || "",
          "Email": company.email || primaryContact?.email || "",
          "Phone": company.phone || primaryContact?.phone || "",
          "Status": company.status || "",
          "Source": company.source || "",
          "Website": company.website || "",
          "Industry": company.industry || "",
          "Address": company.address || "",
          "City": company.city || "",
          "State": company.state || "",
          "Country": company.country || "",
          "Primary Contact First Name": primaryContact?.firstName || "",
          "Primary Contact Last Name": primaryContact?.lastName || "",
          "Primary Contact Email": primaryContact?.email || "",
          "Primary Contact Phone": primaryContact?.phone || "",
          "Created": company.createdAt
            ? new Date(company.createdAt).toLocaleDateString()
            : "",
          "Notes": company.notes || "",
        };
      });

      if (exportFormat === "csv") {
        // Convert to CSV
        if (exportData.length === 0) {
          alert("No data to export");
          return;
        }
        
        const headers = Object.keys(exportData[0] || {});
        const csvContent = [
          headers.join(","),
          ...exportData.map((row) =>
            headers
              .map(
                (header) =>
                  `"${(row[header] || "").toString().replace(/"/g, '""')}"`
              )
              .join(",")
          ),
        ].join("\n");

        // Download CSV
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `lead_companies_${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show success message
        setShowAddSuccessMessage(true);
        setTimeout(() => setShowAddSuccessMessage(false), 3000);
      } else {
        // For other formats, show coming soon message
        alert(`${exportFormat.toUpperCase()} export coming soon!`);
      }
    } catch (error) {
      console.error("Error exporting lead companies:", error);
      alert("Failed to export lead companies");
    }
  };

  // Handle filter application
  const handleApplyFilters = (filters) => {
    
    // Check if any filters are active
    const hasActiveFilters = Object.values(filters).some(
      (value) => value && value.toString().trim() !== ""
    );
    
    if (hasActiveFilters) {
    setAppliedFilters(filters);
    } else {
      setAppliedFilters({});
      toast.info("Filters cleared");
    }
  };

  // Handle import
  const handleImport = async (file) => {
    // Refresh the data after import
    await fetchLeadCompanies();
    await fetchStats();
    setIsImportModalOpen(false);
    setShowAddSuccessMessage(true);
    setTimeout(() => setShowAddSuccessMessage(false), 3000);
    };


  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="p-4 space-y-4">
          <PageHeader
            title="Lead Companies"
            subtitle="Loading lead companies..."
            breadcrumb={[
              { label: "Dashboard", href: "/" },
              { label: "Sales", href: "/sales" },
              { label: "Lead Companies", href: "/sales/lead-companies" },
            ]}
            showSearch={false}
            showActions={false}
          />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen">
        <div className="p-4 space-y-4">
          <PageHeader
            title="Lead Companies"
            subtitle="Error loading lead companies"
            breadcrumb={[
              { label: "Dashboard", href: "/" },
              { label: "Sales", href: "/sales" },
              { label: "Lead Companies", href: "/sales/lead-companies" },
            ]}
            showSearch={false}
            showActions={false}
          />
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <button
              onClick={fetchLeadCompanies}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success Messages */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Lead company status updated successfully!
        </div>
      )}

      {showAddSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          New lead company added successfully!
        </div>
      )}

      <div className="p-4 space-y-4 bg-white min-h-screen">
        {/* Page Header */}
        <PageHeader
          title="Lead Companies"
          subtitle="Track and manage potential client companies"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Sales", href: "/sales" },
            { label: "Lead Companies", href: "/sales/lead-companies" },
          ]}
          showSearch={true}
          showActions={true}
          searchPlaceholder="Search lead companies..."
          onSearchChange={setSearchQuery}
          onAddClick={() => router.push("/sales/lead-companies/new")}
          onFilterClick={() => setIsFilterModalOpen(true)}
          hasActiveFilters={Object.values(appliedFilters).some(
            (value) => value && value.toString().trim() !== ""
          )}
          onImportClick={() => setIsImportModalOpen(true)}
          onExportClick={() => handleExport("csv")}
        />
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
            onFilterClick={() => setIsFilterModalOpen(true)}
            onAddClick={() => router.push("/sales/lead-companies/new")}
            onExportClick={handleExport}
            onColumnVisibilityClick={() => setIsColumnVisibilityModalOpen(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {/* Results Count */}
          <div className="text-sm text-gray-600 px-1">
            Showing <span className="font-semibold text-gray-900">{filteredCompanies.length}</span> result{filteredCompanies.length !== 1 ? 's' : ''}
          </div>

          {/* Single Horizontal Scroll Container */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Lead Companies Table/Board */}
            {activeView === "list" && (
              <LeadsListView
                filteredLeads={paginatedCompanies}
                leadColumnsTable={visibleColumnsTable}
                selectedLeads={selectedCompanies}
                setSelectedLeads={setSelectedCompanies}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAddClick={() => router.push("/sales/lead-companies/new")}
                onRowClick={(row) => {
                  router.push(`/sales/lead-companies/${row.id}`);
                }}
                pagination={
                  totalPages > 1 ? (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredCompanies.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                    />
                  ) : null
                }
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

      {/* Filter Modal */}
      <LeadsFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        users={users}
        appliedFilters={appliedFilters}
      />

      {/* Import Modal */}
      <LeadsImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />

      {/* Column Visibility Modal */}
      <ColumnVisibilityModal
        isOpen={isColumnVisibilityModalOpen}
        onClose={() => setIsColumnVisibilityModalOpen(false)}
        columns={leadCompanyColumnsTable}
        visibleColumns={visibleColumns}
        onVisibilityChange={setVisibleColumns}
      />

      {/* Convert to Client Confirmation Modal */}
      {showConvertModal && companyToConvert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-pink-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Convert to Client Account
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to convert{" "}
                <strong>{companyToConvert.companyName}</strong> to a client
                account?
              </p>
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-700 font-medium mb-2">
                  ✨ This will:
                </p>
                <ul className="text-sm text-orange-600 space-y-1">
                  <li>• Move the company to Client Accounts section</li>
                  <li>• Preserve all contacts and their information</li>
                  <li>• Maintain all deals and proposals</li>
                  <li>• Keep activity history and notes</li>
                  <li>• Enable client-specific features and billing</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowConvertModal(false);
                  setCompanyToConvert(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConvertToClient}
                disabled={loadingActions[`${companyToConvert.id}-convert`]}
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loadingActions[`${companyToConvert.id}-convert`] ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Converting...</span>
                  </div>
                ) : (
                  <>
                    <Building2 className="w-4 h-4 mr-2" />
                    Convert to Client
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Success Animation */}
      {showConvertSuccess && convertedCompanyName && (
        <>
          <style
            dangerouslySetInnerHTML={{
              __html: `
              @keyframes confetti-fall {
                0% {
                  transform: translateY(-10px) rotate(0deg) scale(1);
                  opacity: 1;
                }
                50% {
                  opacity: 1;
                }
                100% {
                  transform: translateY(110vh) rotate(720deg) scale(0.5);
                  opacity: 0;
                }
              }
            `,
            }}
          />
          <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
            {/* Confetti Particles */}
            {[...Array(120)].map((_, i) => {
              const colors = [
                "#FF6B6B",
                "#4ECDC4",
                "#45B7D1",
                "#FFA07A",
                "#98D8C8",
                "#F7DC6F",
                "#BB8FCE",
                "#85C1E2",
                "#10B981",
                "#F59E0B",
                "#EF4444",
                "#8B5CF6",
              ];
              const color = colors[Math.floor(Math.random() * colors.length)];
              const left = Math.random() * 100;
              const delay = Math.random() * 2;
              const duration = 2.5 + Math.random() * 2;
              const size = 8 + Math.random() * 12;
              const shape = Math.random() > 0.5 ? 'rounded-full' : 'rounded-sm';
              const rotation = Math.random() * 360;

              return (
                <div
                  key={i}
                  className={`absolute ${shape}`}
                  style={{
                    left: `${left}%`,
                    top: "-10px",
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    animation: `confetti-fall ${duration}s ease-out ${delay}s forwards`,
                    transform: `rotate(${rotation}deg)`,
                    boxShadow: `0 0 ${size/2}px ${color}40`,
                  }}
                />
              );
            })}

          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && companyToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Lead Company
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete{" "}
                <strong>{companyToDelete.companyName}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium mb-2">
                  ⚠️ This will permanently delete:
                </p>
                <ul className="text-sm text-red-600 space-y-1">
                  <li>• Company information and details</li>
                  <li>• All associated contacts</li>
                  <li>• All deals and proposals</li>
                  <li>• Activity history and notes</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCompanyToDelete(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteCompany}
                disabled={loadingActions[`${companyToDelete.id}-delete`]}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
              >
                {loadingActions[`${companyToDelete.id}-delete`] ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </div>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Company
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign User Modal */}
      {showAssignModal && companyToAssign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Change Assignee
                </h3>
                <p className="text-sm text-gray-500">
                  Assign lead to a team member
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Select a user to assign{" "}
                <strong>{companyToAssign.companyName}</strong> to:
              </p>

              <Select
                label="Assign To"
                value={selectedUserId}
                onChange={setSelectedUserId}
                options={[
                  { value: "", label: "Unassigned" },
                  ...users.map((u) => ({
                    value: (u.id || u.documentId).toString(),
                    label:
                      `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                      u.username ||
                      "Unknown User",
                  })),
                ]}
                disabled={loadingUsers}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowAssignModal(false);
                  setCompanyToAssign(null);
                  setSelectedUserId("");
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await leadCompanyService.update(companyToAssign.id, {
                      assignedTo: selectedUserId || null,
                    });
                    // Refresh the companies list
                    await fetchLeadCompanies();
                    // Close modal
                    setShowAssignModal(false);
                    setCompanyToAssign(null);
                    setSelectedUserId("");
                    // Show success message
                    setShowSuccessMessage(true);
                    setTimeout(() => setShowSuccessMessage(false), 3000);
                  } catch (error) {
                    console.error("Error updating assignment:", error);
                    alert("Failed to update assignment. Please try again.");
                  }
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
              >
                Update Assignee
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
