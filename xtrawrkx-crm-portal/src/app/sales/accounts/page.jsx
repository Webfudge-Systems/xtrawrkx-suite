"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge, Avatar, Button } from "../../../components/ui";
import { formatNumber, formatCurrency } from "../../../lib/utils";

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

const CLIENT_STATUS_KEYS = [
  "ACTIVE",
  "INACTIVE",
  "CHURNED",
  "ON_HOLD",
  "REGISTERED",
  "COMMUNITY_MEMBER",
  "COMMUNITY_PAID",
  "COMMUNITY_NON_PAID",
  "LOST",
  "STOPPED",
];

const DEFAULT_STATUS_COUNTS = CLIENT_STATUS_KEYS.reduce((acc, status) => {
  acc[status] = 0;
  return acc;
}, {});

const TAB_STATUS_MAP = {
  active: "ACTIVE",
  inactive: "INACTIVE",
  churned: "CHURNED",
  "on-hold": "ON_HOLD",
  registered: "REGISTERED",
  "community-member": "COMMUNITY_MEMBER",
  "community-paid": "COMMUNITY_PAID",
  "community-non-paid": "COMMUNITY_NON_PAID",
  lost: "LOST",
  stopped: "STOPPED",
};

const STATUS_COLORS = {
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
  registered: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-400",
    shadow: "shadow-blue-200",
  },
  community_member: {
    bg: "bg-indigo-100",
    text: "text-indigo-800",
    border: "border-indigo-400",
    shadow: "shadow-indigo-200",
  },
  community_paid: {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    border: "border-emerald-400",
    shadow: "shadow-emerald-200",
  },
  community_non_paid: {
    bg: "bg-cyan-100",
    text: "text-cyan-800",
    border: "border-cyan-400",
    shadow: "shadow-cyan-200",
  },
  lost: {
    bg: "bg-rose-100",
    text: "text-rose-800",
    border: "border-rose-400",
    shadow: "shadow-rose-200",
  },
  stopped: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    border: "border-orange-400",
    shadow: "shadow-orange-200",
  },
};

import clientAccountService from "../../../lib/api/clientAccountService";
import PageHeader from "../../../components/PageHeader";
import ClientAccountsKPIs from "./components/ClientAccountsKPIs";
import ClientAccountsTabs from "./components/ClientAccountsTabs";
import ClientAccountsListView from "./components/ClientAccountsListView";
import ClientAccountsFilterModal from "./components/ClientAccountsFilterModal";

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
} from "lucide-react";

export default function ClientAccountsPage() {
  const router = useRouter();

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
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showAddSuccessMessage, setShowAddSuccessMessage] = useState(false);
  const [loadingActions, setLoadingActions] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const exportDropdownRef = useRef(null);

  // Fetch client accounts from Strapi
  useEffect(() => {
    fetchClientAccounts();
    fetchStats();
  }, []);

  const fetchClientAccounts = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      const response = await clientAccountService.getAll();

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
        byStatus: DEFAULT_STATUS_COUNTS,
        totalRevenue: 0,
        averageHealthScore: 0,
        recentConversions: 0,
      });
    }
  };

  // Filter accounts based on search and active tab
  const filteredAccounts = clientAccounts.filter((account) => {
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

    const tabStatus = TAB_STATUS_MAP[activeTab];
    const matchesTab = activeTab === "all" || account.status === tabStatus;

    return matchesSearch && matchesTab;
  });

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
      count: `$${formatNumber(stats.totalRevenue || 0)}`,
      icon: DollarSign,
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
    {
      key: "registered",
      label: "Registered",
      count: stats.byStatus?.REGISTERED || 0,
    },
    {
      key: "community-member",
      label: "Community Member",
      count: stats.byStatus?.COMMUNITY_MEMBER || 0,
    },
    {
      key: "community-paid",
      label: "Community Paid",
      count: stats.byStatus?.COMMUNITY_PAID || 0,
    },
    {
      key: "community-non-paid",
      label: "Community Non-Paid",
      count: stats.byStatus?.COMMUNITY_NON_PAID || 0,
    },
    { key: "lost", label: "Lost", count: stats.byStatus?.LOST || 0 },
    { key: "stopped", label: "Stopped", count: stats.byStatus?.STOPPED || 0 },
  ];

  // Table columns configuration
  const accountColumnsTable = [
    {
      key: "company",
      label: "COMPANY",
      width: "350px",
      render: (_, account) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar
            alt={account.companyName}
            fallback={account.companyName?.charAt(0)?.toUpperCase() || "?"}
            size="sm"
            className="flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {account.companyName}
            </div>
            <div className="text-sm text-gray-500 truncate">
              {account.contacts && account.contacts.length > 0
                ? `${account.contacts[0].firstName} ${account.contacts[0].lastName}`
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
      render: (_, account) => (
        <div className="space-y-1 min-w-[200px]">
          <div className="flex items-center gap-2 text-sm text-gray-900">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">
              {account.contacts && account.contacts.length > 0
                ? account.contacts[0].email
                : account.email || "No email"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">
              {account.contacts && account.contacts.length > 0
                ? account.contacts[0].phone
                : account.phone || "No phone"}
            </span>
          </div>
        </div>
      ),
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
      key: "accountManager",
      label: "ACCOUNT MANAGER",
      width: "200px",
      render: (_, account) => (
        <div className="min-w-[150px]">
          <div className="flex items-center gap-2">
            <Avatar
              alt={
                account.accountManager
                  ? `${account.accountManager.firstName} ${account.accountManager.lastName}`
                  : "Unassigned"
              }
              fallback={
                account.accountManager
                  ? `${account.accountManager.firstName?.[0] || ""}${account.accountManager.lastName?.[0] || ""}`.toUpperCase() || "?"
                  : "?"
              }
              size="sm"
              className="flex-shrink-0"
            />
            <span className="text-sm font-medium text-gray-900">
              {account.accountManager
                ? `${account.accountManager.firstName} ${account.accountManager.lastName}`
                : "Unassigned"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "STATUS",
      width: "140px",
      render: (_, account) => {
        const status = account.status?.toLowerCase() || "active";
        const colors = STATUS_COLORS[status] || STATUS_COLORS.active;
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
              const canToggleStatus =
                account.status === "ACTIVE" || account.status === "INACTIVE";
              if (!canToggleStatus) return;
              handleStatusUpdate(
                account.id,
                account.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
              );
            }}
            disabled={
              account.status !== "ACTIVE" && account.status !== "INACTIVE"
            }
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-2 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              account.status === "ACTIVE"
                ? "Deactivate"
                : account.status === "INACTIVE"
                  ? "Activate"
                  : "Toggle is only available for Active/Inactive accounts"
            }
          >
            {account.status === "ACTIVE" ? (
              <XCircle className="w-4 h-4" />
            ) : account.status === "INACTIVE" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
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
    router.push(`/sales/accounts/${id}`);
  };

  // Handle edit account
  const handleEditAccount = (id) => {
    router.push(`/sales/accounts/${id}/edit`);
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

  // Handle export
  const handleExport = (format) => {
    setShowExportDropdown(false);
  };

  // Handle filter
  const handleFilter = () => {
    setIsFilterModalOpen(true);
  };

  // Handle add account
  const handleAddAccount = () => {
    router.push("/sales/accounts/new");
  };

  // Close export dropdown when clicking outside
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
        <div className="p-4 space-y-6">
          <PageHeader
            title="Client Accounts"
            subtitle="Loading client accounts..."
            breadcrumb={[
              { label: "Dashboard", href: "/" },
              { label: "Sales", href: "/sales" },
              { label: "Client Accounts", href: "/sales/accounts" },
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
        <div className="p-4 space-y-6">
          <PageHeader
            title="Client Accounts"
            subtitle="Error loading client accounts"
            breadcrumb={[
              { label: "Dashboard", href: "/" },
              { label: "Sales", href: "/sales" },
              { label: "Client Accounts", href: "/sales/accounts" },
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
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
            { label: "Sales", href: "/sales" },
            { label: "Client Accounts", href: "/sales/accounts" },
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
            showExportDropdown={showExportDropdown}
            setShowExportDropdown={setShowExportDropdown}
            exportDropdownRef={exportDropdownRef}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {/* Single Horizontal Scroll Container */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Client Accounts Table */}
            {activeView === "list" && (
              <ClientAccountsListView
                filteredAccounts={filteredAccounts}
                accountColumnsTable={accountColumnsTable}
                selectedAccounts={selectedAccounts}
                setSelectedAccounts={setSelectedAccounts}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAddClick={handleAddAccount}
                onRowClick={(row) => {
                  router.push(`/sales/accounts/${row.id}`);
                }}
              />
            )}
          </div>
        </div>

        {/* Modals */}
        {isFilterModalOpen && (
          <ClientAccountsFilterModal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            appliedFilters={appliedFilters}
            onApplyFilters={setAppliedFilters}
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
                  Are you sure you want to delete <strong>{accountToDelete.companyName}</strong>?
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
      </div>
    </div>
  );
}
