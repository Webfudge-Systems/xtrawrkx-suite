"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Avatar,
  Button,
  Select,
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

import clientAccountService from "../../../lib/api/clientAccountService";
import strapiClient from "../../../lib/strapiClient";
import { useAuth } from "../../../contexts/AuthContext";
import authService from "../../../lib/authService";
import PageHeader from "../../../components/PageHeader";
import ClientAccountsKPIs from "./components/ClientAccountsKPIs";
import ClientAccountsTabs from "./components/ClientAccountsTabs";
import ClientAccountsListView from "./components/ClientAccountsListView";
import ClientAccountsFilterModal from "./components/ClientAccountsFilterModal";
import ColumnVisibilityModal from "../../sales/lead-companies/components/ColumnVisibilityModal";

import {
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  UserPlus,
  Star,
  Clock,
  User,
  PhoneCall,
  CheckCircle,
  XCircle,
  IndianRupee,
  Building2,
  Users,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  MapPin,
} from "lucide-react";

export default function ClientAccountsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // State management
  const [clientAccounts, setClientAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeView, setActiveView] = useState("list");
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showAddSuccessMessage, setShowAddSuccessMessage] = useState(false);
  const [loadingActions, setLoadingActions] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [accountToAssign, setAccountToAssign] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isColumnVisibilityModalOpen, setIsColumnVisibilityModalOpen] =
    useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);

  // Initialize visible columns from localStorage or default to all columns
  useEffect(() => {
    const STORAGE_KEY = "clientAccountColumnsVisibility";
    const allColumnKeys = [
      "company",
      "contact",
      "healthScore",
      "dealValue",
      "contacts",
      "location",
      "interests",
      "accountManager",
      "status",
      "created",
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
          // Merge saved columns with new default columns (location, interests)
          // to ensure new columns are always visible
          const newDefaultColumns = ["location", "interests"];
          const mergedColumns = [
            ...new Set([...validColumns, ...newDefaultColumns]),
          ].filter((key) => allColumnKeys.includes(key));

          if (mergedColumns.length > 0) {
            setVisibleColumns(mergedColumns);
          } else {
            setVisibleColumns(allColumnKeys);
          }
        } else {
          setVisibleColumns(allColumnKeys);
        }
      } catch (error) {
        console.error(
          "Error loading column visibility from localStorage:",
          error
        );
        setVisibleColumns(allColumnKeys);
      }
    }
  }, []);

  // Save column visibility to localStorage whenever it changes
  useEffect(() => {
    if (visibleColumns.length > 0) {
      const STORAGE_KEY = "clientAccountColumnsVisibility";
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
      } catch (error) {
        console.error("Error saving column visibility to localStorage:", error);
      }
    }
  }, [visibleColumns]);

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

  // Fetch client accounts from Strapi
  useEffect(() => {
    fetchClientAccounts();
    fetchStats();
  }, []);

  // Refresh data when account is updated (from details page)
  useEffect(() => {
    const handleAccountUpdate = () => {
      // Small delay to ensure any updates from details page are saved
      setTimeout(() => {
        fetchClientAccounts();
        fetchStats();
      }, 500);
    };

    // Listen for custom event from details page
    window.addEventListener("accountUpdated", handleAccountUpdate);

    return () => {
      window.removeEventListener("accountUpdated", handleAccountUpdate);
    };
  }, []);

  // fetch users if admin
  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      let allUsers = [];
      let page = 1;
      let hasMore = true;
      const pageSize = 100;

      while (hasMore) {
        const queryParams = {
          "pagination[page]": page,
          "pagination[pageSize]": pageSize,
          populate: "primaryRole,userRoles",
        };
        const response = await strapiClient.getXtrawrkxUsers(queryParams);
        const usersData = response?.data || [];
        if (Array.isArray(usersData)) {
          const extracted = usersData.map((u) =>
            u.attributes
              ? {
                  id: u.id,
                  documentId: u.id,
                  ...u.attributes,
                }
              : u
          );
          allUsers = [...allUsers, ...extracted];
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

  const fetchClientAccounts = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      const response = await clientAccountService.getAll({
        populate: "accountManager,contacts",
      });

      // Handle different response structures
      // The API returns data directly as an array, not wrapped in a data property
      const accounts = Array.isArray(response)
        ? response
        : response?.data || [];
      setClientAccounts(accounts);

    } catch (err) {
      console.error("Error fetching client accounts:", err);
      console.error("Error details:", err.response?.data || err.message);

      // Set more specific error message
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        "Failed to load client accounts";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await clientAccountService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error("Error fetching stats:", err);
      // Set default stats if API fails
      setStats({
        byStatus: { ACTIVE: 0, INACTIVE: 0, CHURNED: 0, ON_HOLD: 0 },
        totalRevenue: 0,
        averageHealthScore: 0,
        recentConversions: 0,
      });
    }
  };

  // Filter accounts based on search, active tab, and applied filters
  const filteredAccounts = clientAccounts.filter((account) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      account.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.accountManager?.firstName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      account.accountManager?.lastName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    // Tab filter
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && account.status?.toLowerCase() === "active") ||
      (activeTab === "inactive" &&
        account.status?.toLowerCase() === "inactive") ||
      (activeTab === "churned" &&
        account.status?.toLowerCase() === "churned") ||
      (activeTab === "on-hold" && account.status?.toLowerCase() === "on_hold");

    // Applied filters
    let matchesFilters = true;

    if (Object.keys(appliedFilters).length > 0) {
      // Status filter
      if (appliedFilters.status) {
        const filterStatus = appliedFilters.status.toLowerCase();
        const accountStatus = account.status?.toLowerCase() || "";
        if (filterStatus !== accountStatus) {
          matchesFilters = false;
        }
      }

      // Industry filter
      if (appliedFilters.industry) {
        const filterIndustry = appliedFilters.industry.toLowerCase();
        const accountIndustry = account.industry?.toLowerCase() || "";
        if (filterIndustry !== accountIndustry) {
          matchesFilters = false;
        }
      }

      // Revenue range filters
      if (appliedFilters.minRevenue || appliedFilters.maxRevenue) {
        const accountRevenue = account.revenue || 0;
        if (
          appliedFilters.minRevenue &&
          accountRevenue < parseFloat(appliedFilters.minRevenue)
        ) {
          matchesFilters = false;
        }
        if (
          appliedFilters.maxRevenue &&
          accountRevenue > parseFloat(appliedFilters.maxRevenue)
        ) {
          matchesFilters = false;
        }
      }

      // Health score range filters
      if (appliedFilters.minHealthScore || appliedFilters.maxHealthScore) {
        const accountHealthScore = account.healthScore || 0;
        if (
          appliedFilters.minHealthScore &&
          accountHealthScore < parseFloat(appliedFilters.minHealthScore)
        ) {
          matchesFilters = false;
        }
        if (
          appliedFilters.maxHealthScore &&
          accountHealthScore > parseFloat(appliedFilters.maxHealthScore)
        ) {
          matchesFilters = false;
        }
      }
    }

    return matchesSearch && matchesTab && matchesFilters;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);

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

    if (
      hasActiveFilters &&
      !loading &&
      filteredAccounts.length !== prevFilteredCountRef.current
    ) {
      prevFilteredCountRef.current = filteredAccounts.length;
      toast.success(
        `Filters applied. Showing ${filteredAccounts.length} result${
          filteredAccounts.length !== 1 ? "s" : ""
        }`
      );
    }
  }, [filteredAccounts.length, appliedFilters, loading]);

  // Calculate KPI data
  const statusStats = [
    {
      label: "Total",
      count: clientAccounts.length,
      icon: Building2,
      color: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      label: "Active",
      count: stats.byStatus?.ACTIVE || 0,
      icon: CheckCircle,
      color: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
    },
    {
      label: "Revenue",
      count: `₹${formatNumber(stats.totalRevenue || 0)}`,
      icon: IndianRupee,
      color: "bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200",
    },
  ];

  // Tab configuration
  const tabsConfig = [
    { key: "all", label: "All Clients", count: clientAccounts.length },
    { key: "active", label: "Active", count: stats.byStatus?.ACTIVE || 0 },
    {
      key: "inactive",
      label: "Inactive",
      count: stats.byStatus?.INACTIVE || 0,
    },
    { key: "churned", label: "Churned", count: stats.byStatus?.CHURNED || 0 },
    {
      key: "on-hold",
      label: "On Hold",
      count: stats.byStatus?.ON_HOLD || 0,
    },
  ];

  // Table columns configuration
  const accountColumnsTable = [
    {
      key: "company",
      label: "COMPANY",
      width: "300px",
      render: (_, account) => {
        const firstChar = account.companyName?.charAt(0)?.toUpperCase() || "?";
        const primaryContact =
          account.contacts?.find((c) => c.role === "PRIMARY_CONTACT") ||
          account.contacts?.[0];

        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {firstChar}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {account.companyName}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {primaryContact
                  ? `${primaryContact.firstName || ""} ${
                      primaryContact.lastName || ""
                    }`.trim()
                  : "No contact"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "contact",
      label: "PRIMARY CONTACT",
      width: "250px",
      render: (_, account) => {
        const primaryContact =
          account.contacts?.find((c) => c.role === "PRIMARY_CONTACT") ||
          account.contacts?.[0];

        if (!primaryContact) {
          return (
            <div className="min-w-[200px]">
              <span className="text-sm text-gray-500">No contact</span>
            </div>
          );
        }

        return (
          <div className="space-y-1 min-w-[200px]">
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {primaryContact.email || "No email"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {primaryContact.phone || "No phone"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "healthScore",
      label: "HEALTH SCORE",
      width: "140px",
      render: (_, account) => {
        const score = account.healthScore || 0;
        const getHealthColor = () => {
          if (score >= 80)
            return "bg-green-100 text-green-800 border-green-300";
          if (score >= 60)
            return "bg-yellow-100 text-yellow-800 border-yellow-300";
          if (score >= 40)
            return "bg-orange-100 text-orange-800 border-orange-300";
          return "bg-red-100 text-red-800 border-red-300";
        };

        return (
          <div className="min-w-[120px]">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getHealthColor()}`}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              {score}%
            </div>
          </div>
        );
      },
    },
    {
      key: "dealValue",
      label: "DEAL VALUE",
      width: "140px",
      render: (_, account) => (
        <div className="min-w-[120px]">
          <div className="flex items-center gap-1.5">
            <IndianRupee className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900">
              {account.revenue ? `₹${formatNumber(account.revenue)}` : "₹0"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "contacts",
      label: "CONTACTS",
      width: "120px",
      render: (_, account) => (
        <div className="min-w-[100px]">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600">
              {account.contacts?.length || 0}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "location",
      label: "LOCATION",
      width: "180px",
      render: (_, account) => (
        <div className="min-w-[150px]">
          {account.location ? (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate">
                {account.location}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Not specified</span>
          )}
        </div>
      ),
    },
    {
      key: "interests",
      label: "INTERESTS",
      width: "200px",
      render: (_, account) => {
        const interests = account.interests;
        if (
          !interests ||
          (Array.isArray(interests) && interests.length === 0)
        ) {
          return (
            <div className="min-w-[150px]">
              <span className="text-sm text-gray-400">No interests</span>
            </div>
          );
        }
        const interestsList = Array.isArray(interests) ? interests : [];
        return (
          <div className="min-w-[150px]">
            <div className="flex flex-wrap gap-1">
              {interestsList.slice(0, 2).map((interest, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                >
                  {interest}
                </span>
              ))}
              {interestsList.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{interestsList.length - 2} more
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "accountManager",
      label: "ACCOUNT MANAGER",
      width: "220px",
      render: (_, account) => {
        const manager = account.accountManager;
        const managerName = manager
          ? `${manager.firstName || ""} ${manager.lastName || ""}`.trim() ||
            manager.username ||
            "Unknown"
          : "Unassigned";

        const handleAssignClick = () => {
          setAccountToAssign(account);
          setSelectedUserId(
            manager?.id?.toString() || manager?.documentId?.toString() || ""
          );
          setShowAssignModal(true);
        };

        return (
          <div className="min-w-[180px] flex items-center gap-2">
            <Avatar
              alt={managerName}
              fallback={(managerName || "?").charAt(0).toUpperCase()}
              size="sm"
              className="flex-shrink-0"
            />
            <span className="text-sm font-medium text-gray-900 flex-1 truncate">
              {managerName}
            </span>
            {isAdmin() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssignClick();
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg"
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
      key: "status",
      label: "STATUS",
      width: "140px",
      render: (_, account) => {
        const status = account.status?.toLowerCase() || "active";
        const statusColors = {
          active: {
            bg: "bg-green-100",
            text: "text-green-800",
            border: "border-green-400",
            shadow: "shadow-green-200",
          },
          inactive: {
            bg: "bg-gray-100",
            text: "text-gray-800",
            border: "border-gray-400",
            shadow: "shadow-gray-200",
          },
          churned: {
            bg: "bg-red-100",
            text: "text-red-800",
            border: "border-red-400",
            shadow: "shadow-red-200",
          },
          on_hold: {
            bg: "bg-yellow-100",
            text: "text-yellow-800",
            border: "border-yellow-400",
            shadow: "shadow-yellow-200",
          },
        };

        const colors = statusColors[status] || statusColors.active;
        const displayStatus = account.status || "ACTIVE";

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
      key: "created",
      label: "CREATED",
      width: "140px",
      render: (_, account) => (
        <div className="min-w-[120px]">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-600">
              {formatDate(account.createdAt)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      label: "ACTIONS",
      width: "200px",
      render: (_, account) => (
        <div
          className="flex items-center gap-1 min-w-[120px]"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewAccount(account.id);
            }}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200"
            title="View Account"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditAccount(account.id);
            }}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2 rounded-lg transition-all duration-200"
            title="Edit Account"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusUpdate(
                account.id,
                account.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
              );
            }}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-2 rounded-lg transition-all duration-200"
            title={account.status === "ACTIVE" ? "Deactivate" : "Activate"}
          >
            {account.status === "ACTIVE" ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setAccountToDelete(account);
              setShowDeleteModal(true);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
            title="Delete Account"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Get visible columns based on user preferences
  const getVisibleColumns = () => {
    if (visibleColumns.length === 0) {
      return accountColumnsTable;
    }
    return accountColumnsTable.filter((col) =>
      visibleColumns.includes(col.key)
    );
  };

  const visibleColumnsTable = getVisibleColumns();

  // Handle status updates
  const handleStatusUpdate = async (accountId, newStatus) => {
    if (!accountId) {
      console.error("No account ID provided");
      return;
    }

    const loadingKey = `${accountId}-${newStatus.toLowerCase()}`;

    // Set loading state
    setLoadingActions((prev) => ({ ...prev, [loadingKey]: true }));

    try {

      // Update the status via API
      const response = await clientAccountService.updateStatus(
        accountId,
        newStatus
      );

      // Update local state
      setClientAccounts((prevAccounts) =>
        prevAccounts.map((account) =>
          account?.id === accountId
            ? { ...account, status: newStatus }
            : account
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

  // Handle view account
  const handleViewAccount = (id) => {
    router.push(`/clients/accounts/${id}`);
  };

  // Handle edit account
  const handleEditAccount = (id) => {
    router.push(`/clients/accounts/${id}/edit`);
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;

    const loadingKey = `${accountToDelete.id}-delete`;
    setLoadingActions((prev) => ({ ...prev, [loadingKey]: true }));

    try {

      // Delete the account via API (this will cascade delete linked data)
      await clientAccountService.delete(accountToDelete.id);

      // Remove from local state
      setClientAccounts((prev) =>
        prev.filter((account) => account.id !== accountToDelete.id)
      );

      // Update stats
      await fetchStats();

      // Close modal and reset state
      setShowDeleteModal(false);
      setAccountToDelete(null);

    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. Please try again.");
    } finally {
      setLoadingActions((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle export functionality
  const handleExport = async (format) => {
    try {
      // Handle case where format might be an event object (from PageHeader or direct button click)
      let exportFormat = format;
      if (format && typeof format === "object" && format.target) {
        // It's an event object, default to CSV
        exportFormat = "csv";
      } else if (!format || typeof format !== "string") {
        // Invalid format, default to CSV
        exportFormat = "csv";
      }


      // Check if there's data to export
      if (filteredAccounts.length === 0) {
        alert("No client accounts to export");
        return;
      }

      // Prepare export data
      const exportData = filteredAccounts.map((account) => {
        const primaryContact =
          account.contacts?.find((c) => c.role === "PRIMARY_CONTACT") ||
          account.contacts?.[0];
        const manager = account.accountManager;
        const managerName = manager
          ? `${manager.firstName || ""} ${manager.lastName || ""}`.trim() ||
            manager.username ||
            "Unknown"
          : "Unassigned";

        return {
          "Company Name": account.companyName || "",
          Industry: account.industry || "",
          Status: account.status || "",
          Revenue: account.revenue ? `₹${formatNumber(account.revenue)}` : "₹0",
          "Health Score": account.healthScore
            ? `${account.healthScore}%`
            : "0%",
          "Account Manager": managerName,
          "Primary Contact First Name": primaryContact?.firstName || "",
          "Primary Contact Last Name": primaryContact?.lastName || "",
          "Primary Contact Email": primaryContact?.email || "",
          "Primary Contact Phone": primaryContact?.phone || "",
          "Total Contacts": account.contacts?.length || 0,
          Address: account.address || "",
          City: account.city || "",
          State: account.state || "",
          Country: account.country || "",
          Website: account.website || "",
          Type: account.type || "",
          Created: account.createdAt
            ? new Date(account.createdAt).toLocaleDateString()
            : "",
          Notes: account.notes || "",
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
          `client_accounts_${new Date().toISOString().split("T")[0]}.csv`
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
      console.error("Error exporting client accounts:", error);
      alert("Failed to export client accounts");
    }
  };

  // Handle filter
  const handleFilter = () => {
    setIsFilterModalOpen(true);
  };

  // Handle add account
  const handleAddAccount = () => {
    router.push("/clients/accounts/new");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
        <div className="p-4 space-y-6">
          <PageHeader
            title="Client Accounts"
            subtitle="Loading client accounts..."
            breadcrumb={[
              { label: "Dashboard", href: "/" },
              { label: "Clients", href: "/clients" },
              { label: "Client Accounts", href: "/clients/accounts" },
            ]}
            showProfile={true}
            showSearch={false}
            showActions={false}
          />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="p-4 space-y-6">
          <PageHeader
            title="Client Accounts"
            subtitle="Error loading client accounts"
            breadcrumb={[
              { label: "Dashboard", href: "/" },
              { label: "Clients", href: "/clients" },
              { label: "Client Accounts", href: "/clients/accounts" },
            ]}
            showProfile={true}
            showSearch={false}
            showActions={false}
          />
          <Card className="rounded-2xl bg-red-50 border border-red-200 p-6">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Error Loading Data
              </h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button
                onClick={fetchClientAccounts}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 space-y-6">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Account updated successfully!
          </div>
        )}

        {/* Page Header */}
        <PageHeader
          title="Client Accounts"
          subtitle={`Manage your client relationships and account health (${filteredAccounts.length} accounts)`}
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Clients", href: "/clients" },
            { label: "Client Accounts", href: "/clients/accounts" },
          ]}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showProfile={true}
          showSearch={true}
          searchPlaceholder="Search client accounts..."
          showActions={true}
          onAddClick={handleAddAccount}
          addButtonText="Add Client Account"
          onFilterClick={handleFilter}
          hasActiveFilters={Object.values(appliedFilters).some(
            (value) => value && value.toString().trim() !== ""
          )}
          onExportClick={() => handleExport("csv")}
        />

        <div className="space-y-4">
          {/* Stats Overview */}
          <ClientAccountsKPIs statusStats={statusStats} />

          {/* View Toggle */}
          <ClientAccountsTabs
            tabItems={tabsConfig}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeView={activeView}
            setActiveView={setActiveView}
            onFilterClick={handleFilter}
            onAddClick={handleAddAccount}
            onExportClick={handleExport}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onColumnVisibilityClick={() => setIsColumnVisibilityModalOpen(true)}
          />

          {/* Results Count */}
          <div className="text-sm text-gray-600 px-1">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {filteredAccounts.length}
            </span>{" "}
            result{filteredAccounts.length !== 1 ? "s" : ""}
          </div>

          {/* Single Horizontal Scroll Container */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Client Accounts Table */}
            {activeView === "list" && (
              <ClientAccountsListView
                filteredAccounts={paginatedAccounts}
                accountColumnsTable={visibleColumnsTable}
                selectedAccounts={selectedAccounts}
                setSelectedAccounts={setSelectedAccounts}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAddClick={handleAddAccount}
                onRowClick={(row) => {
                  router.push(`/clients/accounts/${row.id}`);
                }}
                pagination={
                  totalPages > 1 ? (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredAccounts.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                    />
                  ) : null
                }
              />
            )}
          </div>
        </div>

        {/* Column Visibility Modal */}
        <ColumnVisibilityModal
          isOpen={isColumnVisibilityModalOpen}
          onClose={() => setIsColumnVisibilityModalOpen(false)}
          columns={accountColumnsTable}
          visibleColumns={visibleColumns}
          onVisibilityChange={setVisibleColumns}
        />

        {/* Modals */}
        {isFilterModalOpen && (
          <ClientAccountsFilterModal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            appliedFilters={appliedFilters}
            onApplyFilters={(filters) => {

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
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && accountToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Client Account
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Are you sure you want to delete{" "}
                  <strong>{accountToDelete.companyName}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700 font-medium mb-2">
                    ⚠️ This will permanently delete:
                  </p>
                  <ul className="text-sm text-red-600 space-y-1">
                    <li>• Account information and details</li>
                    <li>• All associated contacts</li>
                    <li>• All invoices and billing history</li>
                    <li>• Activity history and notes</li>
                    <li>• All related projects and tasks</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setAccountToDelete(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={loadingActions[`${accountToDelete.id}-delete`]}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
                >
                  {loadingActions[`${accountToDelete.id}-delete`] ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </div>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Account Manager Modal */}
        {showAssignModal && accountToAssign && (
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
                    Assign account to a team member
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Select a user to assign{" "}
                  <strong>{accountToAssign.companyName}</strong> to:
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
                    setAccountToAssign(null);
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
                      await clientAccountService.update(accountToAssign.id, {
                        accountManager: selectedUserId || null,
                      });
                      // Update local list
                      await fetchClientAccounts();
                      setShowAssignModal(false);
                      setAccountToAssign(null);
                      setSelectedUserId("");
                      setShowSuccessMessage(true);
                      setTimeout(() => setShowSuccessMessage(false), 3000);
                    } catch (error) {
                      console.error("Error updating assignee:", error);
                      alert("Failed to update assignee. Please try again.");
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
    </div>
  );
}
