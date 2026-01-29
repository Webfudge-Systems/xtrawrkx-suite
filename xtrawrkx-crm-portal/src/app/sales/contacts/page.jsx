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
import { formatNumber } from "../../../lib/utils";
import contactService from "../../../lib/api/contactService";
import strapiClient from "../../../lib/strapiClient";
import { useAuth } from "../../../contexts/AuthContext";
import authService from "../../../lib/authService";
import { toast } from "react-toastify";

import PageHeader from "../../../components/PageHeader";
import ContactsKPIs from "./components/ContactsKPIs";
import ContactsTabs from "./components/ContactsTabs";
import ContactsListView from "./components/ContactsListView";
import ContactsFilterModal from "./components/ContactsFilterModal";
import ContactsImportModal from "./components/ContactsImportModal";
import ColumnVisibilityModal from "../lead-companies/components/ColumnVisibilityModal";

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
  IndianRupee,
  Building2,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  RefreshCcw,
  ExternalLink,
} from "lucide-react";

export default function ContactsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // State management
  const [contacts, setContacts] = useState([]);
  const [allContacts, setAllContacts] = useState([]); // Unfiltered contacts for stats
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showAddSuccessMessage, setShowAddSuccessMessage] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [contactToAssign, setContactToAssign] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isColumnVisibilityModalOpen, setIsColumnVisibilityModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);

  // Refs
  const exportDropdownRef = useRef(null);

  // Initialize visible columns from localStorage or default to all columns
  useEffect(() => {
    const STORAGE_KEY = "contactColumnsVisibility";
    const allColumnKeys = [
      "contact",
      "company",
      "contact_info",
      "role",
      "owner",
      "created_date",
      "status",
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
      const STORAGE_KEY = "contactColumnsVisibility";
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

  // Fetch contacts data
  useEffect(() => {
    fetchContacts();

    // Cleanup search timeout on unmount
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // fetch users if admin
  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [user]);

  // Refetch when filters change
  useEffect(() => {
    const hasActiveFilters = Object.values(appliedFilters).some(
      (value) => value && value.toString().trim() !== ""
    );
    
    if (hasActiveFilters) {
      fetchFilteredContacts();
    } else if (Object.keys(appliedFilters).length === 0) {
      // Only fetch all if filters were explicitly cleared
      // Don't refetch on initial mount
    }
  }, [appliedFilters]);

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

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await contactService.getAll({
        pagination: { pageSize: 1000 }, // Get more contacts for better filtering
        populate: ["clientAccount", "leadCompany", "assignedTo"],
        sort: ["createdAt:desc"], // Sort by newest first
      });

      const fetchedContacts = response.data || [];
      setContacts(fetchedContacts);
      setAllContacts(fetchedContacts); // Store unfiltered contacts for stats
      setStats(response.meta || {});
    } catch (err) {
      console.error("Error fetching contacts:", err);
      setError("Failed to load contacts");
      // Set empty data on error
      setContacts([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredContacts = async () => {
    try {
      setLoading(true);

      // Build query parameters from applied filters
      const queryParams = {
        pagination: { pageSize: 1000 },
        populate: ["clientAccount", "leadCompany", "assignedTo"],
        sort: ["createdAt:desc"],
      };

      // Add filters to query
      if (appliedFilters.status) {
        queryParams.filters = {
          ...queryParams.filters,
          status: { $eq: appliedFilters.status },
        };
      }

      if (appliedFilters.company) {
        queryParams.filters = {
          ...queryParams.filters,
          $or: [
            { company: { $containsi: appliedFilters.company } },
            {
              "clientAccount.companyName": {
                $containsi: appliedFilters.company,
              },
            },
            {
              "leadCompany.companyName": { $containsi: appliedFilters.company },
            },
          ],
        };
      }

      if (appliedFilters.title) {
        queryParams.filters = {
          ...queryParams.filters,
          title: { $containsi: appliedFilters.title },
        };
      }

      if (appliedFilters.role) {
        queryParams.filters = {
          ...queryParams.filters,
          role: { $eq: appliedFilters.role },
        };
      }

      if (appliedFilters.dateRange) {
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
          queryParams.filters = {
            ...queryParams.filters,
            createdAt: { $gte: startDate.toISOString() },
          };
        }
      }

      if (appliedFilters.assignedTo) {
        queryParams.filters = {
          ...queryParams.filters,
          assignedTo: { id: { $eq: parseInt(appliedFilters.assignedTo) } },
        };
      }

      const response = await contactService.getAll(queryParams);
      setContacts(response.data || []);
      setStats(response.meta || {});
    } catch (err) {
      console.error("Error fetching filtered contacts:", err);
      setError("Failed to load filtered contacts");
    } finally {
      setLoading(false);
    }
  };

  // Handle export functionality
  const handleExport = async (format) => {
    try {
      setShowExportDropdown(false);

      // Prepare export data
      const exportData = filteredContacts.map((contact) => ({
        "First Name": contact.firstName || "",
        "Last Name": contact.lastName || "",
        Email: contact.email || "",
        Phone: contact.phone || "",
        Title: contact.title || "",
        Company:
          contact.company ||
          contact.clientAccount?.companyName ||
          contact.leadCompany?.companyName ||
          "",
        Status: contact.status || "",
        Department: contact.department || "",
        Address: contact.address || "",
        City: contact.city || "",
        State: contact.state || "",
        Country: contact.country || "",
        Created: contact.createdAt
          ? new Date(contact.createdAt).toLocaleDateString()
          : "",
        Notes: contact.notes || "",
      }));

      if (format === "csv") {
        // Convert to CSV
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
          `contacts_${new Date().toISOString().split("T")[0]}.csv`
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
        alert(`${format.toUpperCase()} export coming soon!`);
      }
    } catch (error) {
      console.error("Error exporting contacts:", error);
      alert("Failed to export contacts");
    }
  };

  // Handle contact selection
  const handleContactSelect = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  // Handle bulk actions
  const handleBulkAction = (action) => {
    // Implement bulk actions here
  };

  // Handle filter application
  const handleApplyFilters = (filters) => {

    // Check if any filters are active
    const hasActiveFilters = Object.values(filters).some(
      (value) => value && value.toString().trim() !== ""
    );
    
    if (hasActiveFilters) {
      setAppliedFilters(filters);
      // fetchFilteredContacts will be called by useEffect when appliedFilters changes
    } else {
      setAppliedFilters({});
      // Restore all contacts but keep allContacts unchanged for stats
      setContacts(allContacts);
      toast.info("Filters cleared");
    }
  };

  // Handle import
  const handleImport = async (file) => {
    try {

      // Here you would implement actual CSV/Excel parsing and import
      // For now, we'll simulate the process

      // Show success message
      setShowAddSuccessMessage(true);
      setTimeout(() => setShowAddSuccessMessage(false), 3000);

      // Refresh contacts after import
      await fetchContacts();
    } catch (error) {
      console.error("Error importing contacts:", error);
      alert("Failed to import contacts. Please check the file format.");
    }
  };

  // Handle real-time search
  const handleSearchChange = (query) => {
    setSearchQuery(query);

    // Debounce search to avoid too many API calls
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      }
    }, 300);
  };

  const searchTimeout = useRef(null);

  const performSearch = async (query) => {
    try {
      setLoading(true);
      const response = await contactService.search(query, {
        populate: ["clientAccount", "leadCompany"],
        pagination: { pageSize: 1000 },
      });
      setContacts(response.data || []);
    } catch (error) {
      console.error("Error searching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Action handlers for contact table
  const handleViewContact = (contact) => {
    router.push(`/sales/contacts/${contact.id}`);
  };

  const handleEditContact = (contact) => {
    router.push(`/sales/contacts/${contact.id}/edit`);
  };

  const handleEmailContact = (contact) => {
    if (!contact.email) {
      alert("No email address available for this contact.");
      return;
    }

    // Create mailto link with pre-filled subject
    const subject = encodeURIComponent(
      `Follow up - ${contact.firstName} ${contact.lastName}`
    );
    const body = encodeURIComponent(
      `Hi ${contact.firstName},\n\nI hope this email finds you well.\n\nBest regards,\nYour Name`
    );

    window.open(
      `mailto:${contact.email}?subject=${subject}&body=${body}`,
      "_self"
    );

    // Log the activity
  };

  const handleDeleteContact = (contact) => {
    setContactToDelete(contact);
    setDeleteModalOpen(true);
  };

  const confirmDeleteContact = async () => {
    if (!contactToDelete) return;

    try {
      setLoading(true);

      // Call the delete API
      await contactService.delete(contactToDelete.id);

      // Remove from local state
      setContacts((prevContacts) =>
        prevContacts.filter((c) => c.id !== contactToDelete.id)
      );

      // Remove from selected contacts if it was selected
      setSelectedContacts((prevSelected) =>
        prevSelected.filter((id) => id !== contactToDelete.id)
      );

      // Close modal and reset state
      setDeleteModalOpen(false);
      setContactToDelete(null);

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      // Refresh the contacts list
      fetchContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to delete contact. Please try again.";
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 404) {
          errorMessage = "Contact not found. It may have already been deleted.";
        } else if (status === 403) {
          errorMessage = "You don't have permission to delete this contact.";
        } else if (status === 400) {
          errorMessage = data?.error?.message || "Invalid request. Please check the contact data.";
        } else if (status >= 500) {
          errorMessage = "Server error occurred. Please try again later.";
        }
      } else if (error.request) {
        // Network error
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message) {
        // Other error with message
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cancelDeleteContact = () => {
    setDeleteModalOpen(false);
    setContactToDelete(null);
  };

  // Filter contacts based on search and active tab
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      !searchQuery ||
      (contact.firstName &&
        contact.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.lastName &&
        contact.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.email &&
        contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.phone &&
        contact.phone.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTab =
      activeTab === "all" ||
      contact.status?.toLowerCase() === activeTab.toLowerCase();

    return matchesSearch && matchesTab;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

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
    
    if (hasActiveFilters && !loading && filteredContacts.length !== prevFilteredCountRef.current) {
      prevFilteredCountRef.current = filteredContacts.length;
      toast.success(`Filters applied. Showing ${filteredContacts.length} result${filteredContacts.length !== 1 ? 's' : ''}`);
    }
  }, [filteredContacts.length, appliedFilters, loading]);

  // Get contact statistics from unfiltered contacts
  const contactStats = {
    active: allContacts.filter((c) => c.status === "ACTIVE").length,
    inactive: allContacts.filter((c) => c.status === "INACTIVE").length,
    new: allContacts.filter((c) => c.status === "NEW").length,
    qualified: allContacts.filter((c) => c.status === "QUALIFIED").length,
  };

  const statusStats = [
    {
      label: "Active",
      count: contactStats.active,
      color: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      icon: CheckCircle,
    },
    {
      label: "New",
      count: contactStats.new,
      color: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      icon: UserPlus,
    },
    {
      label: "Qualified",
      count: contactStats.qualified,
      color: "bg-purple-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
      icon: Star,
    },
    {
      label: "Inactive",
      count: contactStats.inactive,
      color: "bg-gray-50",
      borderColor: "border-gray-200",
      iconColor: "text-gray-600",
      icon: XCircle,
    },
  ];

  // Tab items for navigation
  const tabItems = [
    {
      id: "all",
      key: "all",
      label: "All Contacts",
      badge: allContacts.length.toString(),
    },
    {
      id: "active",
      key: "active",
      label: "Active",
      badge: contactStats.active.toString(),
    },
    { id: "new", key: "new", label: "New", badge: contactStats.new.toString() },
    {
      id: "qualified",
      key: "qualified",
      label: "Qualified",
      badge: contactStats.qualified.toString(),
    },
    {
      id: "inactive",
      key: "inactive",
      label: "Inactive",
      badge: contactStats.inactive.toString(),
    },
  ];

  // Table columns configuration
  const contactColumnsTable = [
    {
      key: "contact",
      label: "CONTACT",
      render: (_, contact) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar
            src={contact.avatar}
            alt={`${contact.firstName} ${contact.lastName}`}
            fallback={`${contact.firstName?.[0] || ""}${
              contact.lastName?.[0] || ""
            }`}
            size="sm"
            className="flex-shrink-0"
          />
          <div>
            <div className="font-medium text-gray-900">
              {contact.firstName} {contact.lastName}
            </div>
            <div className="text-sm text-gray-500">{contact.title}</div>
          </div>
        </div>
      ),
    },
    {
      key: "company",
      label: "COMPANY",
      render: (_, contact) => (
        <div className="min-w-[150px]">
          <div className="font-medium text-gray-900">
            {contact.clientAccount?.companyName ||
              contact.leadCompany?.companyName ||
              "No Company"}
          </div>
          <div className="text-sm text-gray-500">
            {contact.clientAccount
              ? "Client"
              : contact.leadCompany
              ? "Lead"
              : "Independent"}
          </div>
        </div>
      ),
    },
    {
      key: "contact_info",
      label: "CONTACT INFO",
      render: (_, contact) => (
        <div className="min-w-[180px]">
          <div className="flex items-center gap-1 text-sm text-gray-900 mb-1">
            <Mail className="w-3 h-3" />
            {contact.email || "No email"}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Phone className="w-3 h-3" />
            {contact.phone || "No phone"}
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "ROLE",
      render: (_, contact) => (
        <div className="min-w-[120px]">
          <Badge
            variant={
              contact.role === "PRIMARY_CONTACT"
                ? "success"
                : contact.role === "DECISION_MAKER"
                ? "warning"
                : contact.role === "INFLUENCER"
                ? "info"
                : "secondary"
            }
            className="text-xs"
          >
            {contact.role?.replace("_", " ") || "TECHNICAL CONTACT"}
          </Badge>
        </div>
      ),
    },
    {
      key: "owner",
      label: "OWNER",
      render: (_, contact) => {
        const owner = contact.assignedTo;
        const ownerName = owner
          ? `${owner.firstName || ""} ${owner.lastName || ""}`.trim() ||
            owner.username ||
            "Unknown"
          : "Unassigned";

        const handleAssignClick = () => {
          setContactToAssign(contact);
          setSelectedUserId(
            owner?.id?.toString() || owner?.documentId?.toString() || ""
          );
          setShowAssignModal(true);
        };

        return (
          <div className="min-w-[180px] flex items-center gap-2">
            <Avatar
              alt={ownerName}
              fallback={(ownerName || "?").charAt(0).toUpperCase()}
              size="sm"
              className="flex-shrink-0"
              className="flex-shrink-0"
            />
            <span className="text-sm font-medium text-gray-900 flex-1 truncate">
              {ownerName}
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
                title="Change Owner"
              >
                <User className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
    {
      key: "created_date",
      label: "CREATED",
      render: (_, contact) => (
        <div className="min-w-[100px]">
          <div className="text-sm text-gray-900">
            {contact.createdAt
              ? new Date(contact.createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Unknown"}
          </div>
          <div className="text-xs text-gray-500">
            {contact.createdAt
              ? (() => {
                  const daysDiff = Math.floor(
                    (new Date() - new Date(contact.createdAt)) /
                      (1000 * 60 * 60 * 24)
                  );
                  return daysDiff === 0
                    ? "Today"
                    : daysDiff === 1
                    ? "1 day ago"
                    : `${daysDiff} days ago`;
                })()
              : ""}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "STATUS",
      width: "140px",
      render: (_, contact) => {
        const status = (contact.status || "ACTIVE")?.toLowerCase();
        const statusColors = {
          active: {
            bg: "bg-green-100",
            text: "text-green-800",
            border: "border-green-400",
            shadow: "shadow-green-200",
          },
          new: {
            bg: "bg-blue-100",
            text: "text-blue-800",
            border: "border-blue-400",
            shadow: "shadow-blue-200",
          },
          qualified: {
            bg: "bg-purple-100",
            text: "text-purple-800",
            border: "border-purple-400",
            shadow: "shadow-purple-200",
          },
          inactive: {
            bg: "bg-gray-100",
            text: "text-gray-800",
            border: "border-gray-400",
            shadow: "shadow-gray-200",
          },
        };

        const colors = statusColors[status] || statusColors.active;
        const displayStatus = contact.status || "ACTIVE";

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
      key: "actions",
      label: "",
      render: (_, contact) => (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* View Contact */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewContact(contact);
            }}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="View Contact"
          >
            <Eye className="w-4 h-4" />
          </Button>

          {/* Edit Contact */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditContact(contact);
            }}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            title="Edit Contact"
          >
            <Edit className="w-4 h-4" />
          </Button>

          {/* Email Contact */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEmailContact(contact);
            }}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            title="Send Email"
            disabled={!contact.email}
          >
            <Mail className="w-4 h-4" />
          </Button>

          {/* Open LinkedIn */}
          {contact.linkedIn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const linkedInUrl = contact.linkedIn.startsWith('http') 
                  ? contact.linkedIn 
                  : `https://${contact.linkedIn}`;
                window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
              }}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title="Open LinkedIn"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}

          {/* Delete Contact */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteContact(contact);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete Contact"
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
      return contactColumnsTable;
    }
    return contactColumnsTable.filter((col) => visibleColumns.includes(col.key));
  };

  const visibleColumnsTable = getVisibleColumns();

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="p-4 space-y-6">
          <PageHeader
            title="Contacts"
            subtitle="Loading contacts..."
            breadcrumb={[
              { label: "Dashboard", href: "/" },
              { label: "Sales", href: "/sales" },
              { label: "Contacts", href: "/sales/contacts" },
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
            title="Contacts"
            subtitle="Error loading contacts"
            breadcrumb={[
              { label: "Dashboard", href: "/" },
              { label: "Sales", href: "/sales" },
              { label: "Contacts", href: "/sales/contacts" },
            ]}
            showProfile={true}
            showSearch={false}
            showActions={false}
          />
          <div className="flex justify-center items-center h-64">
            <EmptyState
              icon={XCircle}
              title="Error loading contacts"
              description={error}
              action={
                <Button onClick={fetchContacts}>
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Success Messages */}
      {showAddSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Contact added successfully!
        </div>
      )}

      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Contact deleted successfully!
        </div>
      )}

      <div className="p-4 space-y-4 bg-white min-h-screen">
        {/* Page Header */}
        <PageHeader
          title="Contacts"
          subtitle="Manage all your contact information in one place"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Sales", href: "/sales" },
            { label: "Contacts", href: "/sales/contacts" },
          ]}
          showSearch={true}
          showActions={true}
          searchPlaceholder="Search contacts..."
          onSearchChange={handleSearchChange}
          onAddClick={() => router.push("/sales/contacts/new")}
          onFilterClick={() => setIsFilterModalOpen(true)}
          hasActiveFilters={Object.values(appliedFilters).some(
            (value) => value && value.toString().trim() !== ""
          )}
          onImportClick={() => setIsImportModalOpen(true)}
          onExportClick={handleExport}
        />
        <div className="space-y-4">
          {/* Stats Overview */}
          <ContactsKPIs statusStats={statusStats} onStatClick={setActiveTab} />

          {/* View Toggle */}
          <ContactsTabs
            tabItems={tabItems}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
            onAddClick={() => router.push("/sales/contacts/new")}
            onExportClick={() => handleExport("csv")}
            onColumnVisibilityClick={() => setIsColumnVisibilityModalOpen(true)}
          />

          {/* Results Count */}
          <div className="text-sm text-gray-600 px-1">
            Showing <span className="font-semibold text-gray-900">{filteredContacts.length}</span> result{filteredContacts.length !== 1 ? 's' : ''}
          </div>

          {/* Contacts Table */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <ContactsListView
              filteredContacts={paginatedContacts}
              contactColumnsTable={visibleColumnsTable}
              selectedContacts={selectedContacts}
              setSelectedContacts={setSelectedContacts}
              searchQuery={searchQuery}
              setSearchQuery={handleSearchChange}
              onAddClick={() => router.push("/sales/contacts/new")}
              onRowClick={(row) => {
                router.push(`/sales/contacts/${row.id}`);
              }}
              pagination={
                totalPages > 1 ? (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredContacts.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                ) : null
              }
            />
          </div>
        </div>
      </div>

      {/* Column Visibility Modal */}
      <ColumnVisibilityModal
        isOpen={isColumnVisibilityModalOpen}
        onClose={() => setIsColumnVisibilityModalOpen(false)}
        columns={contactColumnsTable}
        visibleColumns={visibleColumns}
        onVisibilityChange={setVisibleColumns}
      />

      {/* Filter Modal */}
      <ContactsFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        users={users}
      />

      {/* Import Modal */}
      <ContactsImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && contactToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Contact
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar
                  src={contactToDelete.avatar}
                  alt={`${contactToDelete.firstName} ${contactToDelete.lastName}`}
                  fallback={`${contactToDelete.firstName?.[0] || ""}${
                    contactToDelete.lastName?.[0] || ""
                  }`}
                  className="w-12 h-12"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {contactToDelete.firstName} {contactToDelete.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {contactToDelete.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {contactToDelete.email}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete{" "}
                <strong>{contactToDelete.firstName} {contactToDelete.lastName}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium mb-2">
                  ⚠️ This will permanently delete:
                </p>
                <ul className="text-sm text-red-600 space-y-1">
                  <li>• Contact information and details</li>
                  <li>• Communication history and notes</li>
                  <li>• Associated activities and interactions</li>
                  <li>• Portal access and permissions</li>
                  <li>• All related tasks and reminders</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={cancelDeleteContact}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteContact}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </div>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Contact
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Owner Modal */}
      {showAssignModal && contactToAssign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Change Owner
                </h3>
                <p className="text-sm text-gray-500">
                  Assign contact to a team member
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Select a user to assign{" "}
                <strong>{contactToAssign.firstName} {contactToAssign.lastName}</strong> to:
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
                  setContactToAssign(null);
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
                    await contactService.update(contactToAssign.id, {
                      assignedTo: selectedUserId || null,
                    });
                    // Update local list
                    await fetchContacts();
                    setShowAssignModal(false);
                    setContactToAssign(null);
                    setSelectedUserId("");
                    setShowSuccessMessage(true);
                    setTimeout(() => setShowSuccessMessage(false), 3000);
                  } catch (error) {
                    console.error("Error updating owner:", error);
                    alert("Failed to update owner. Please try again.");
                  }
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
              >
                Update Owner
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
