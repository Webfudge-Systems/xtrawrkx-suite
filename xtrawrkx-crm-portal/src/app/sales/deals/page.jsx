"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "../../../components/PageHeader";
import dealService from "../../../lib/api/dealService";
import dealGroupService from "../../../lib/api/dealGroupService";
import leadCompanyService from "../../../lib/api/leadCompanyService";
import strapiClient from "../../../lib/strapiClient";
import { useAuth } from "../../../contexts/AuthContext";
import authService from "../../../lib/authService";
import { Select, Pagination } from "../../../components/ui";
import { toast } from "react-toastify";
import DealsKPIs from "./components/DealsKPIs";
import DealsTabs from "./components/DealsTabs";
import DealsListView from "./components/DealsListView";
import DealsBoardView from "./components/DealsBoardView";
import DealsFilterModal from "./components/DealsFilterModal";
import ColumnVisibilityModal from "../lead-companies/components/ColumnVisibilityModal";
import DealGroupModal from "./components/DealGroupModal";
import { Avatar, Badge, Button } from "../../../components/ui";
import { formatCurrency } from "../../../lib/utils/format";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  TrendingUp,
  CheckCircle,
  UserPlus,
  Star,
  XCircle,
  Target,
  IndianRupee,
  Clock,
  Eye,
  Edit,
  Trash2,
  Mail,
  Building2,
  User,
  Calendar,
  List,
  Columns,
  CheckCircle2,
  FolderPlus,
  Folder,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export default function DealsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // State management
  const [deals, setDeals] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    totalValue: 0,
    won: 0,
    averageValue: 0,
  });

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [viewMode, setViewMode] = useState(() => {
    // Check URL parameter for initial view mode
    const viewParam = searchParams?.get("view");
    if (viewParam === "kanban") return "kanban";
    if (viewParam === "grouped") return "grouped";
    return "list";
  }); // "list", "kanban", or "grouped"
  const [dealStats, setDealStats] = useState({
    all: 0,
    new: 0,
    qualified: 0,
    negotiation: 0,
    won: 0,
    lost: 0,
  });

  // Modal states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [dealToAssign, setDealToAssign] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCreateProjectPrompt, setShowCreateProjectPrompt] = useState(false);
  const [dealForProject, setDealForProject] = useState(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [isColumnVisibilityModalOpen, setIsColumnVisibilityModalOpen] =
    useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [isDealGroupModalOpen, setIsDealGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [dealGroups, setDealGroups] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

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

  // Fetch all deals for stats calculation (unfiltered)
  const fetchAllDealsForStats = async () => {
    try {
      const params = {
        populate: ["leadCompany", "clientAccount", "contact", "assignedTo"],
        sort: ["createdAt:desc"],
      };

      const response = await dealService.getAll(params);
      const dealsData = response?.data || [];

      // Transform Strapi data to match component format
      const transformedDeals = dealsData.map((deal) => {
        const stageMap = {
          DISCOVERY: "discovery",
          PROPOSAL: "proposal",
          NEGOTIATION: "negotiation",
          CLOSED_WON: "won",
          CLOSED_LOST: "lost",
        };

        const priorityMap = {
          LOW: "low",
          MEDIUM: "medium",
          HIGH: "high",
        };

        const dealData = deal.attributes || deal;

        return {
          id: deal.id || deal.documentId,
          name: dealData.name || dealData.title || "",
          company:
            dealData.leadCompany?.companyName ||
            dealData.leadCompany?.attributes?.companyName ||
            dealData.clientAccount?.companyName ||
            dealData.clientAccount?.attributes?.companyName ||
            "",
          value: parseFloat(dealData.value) || 0,
          stage:
            stageMap[dealData.stage] ||
            dealData.stage?.toLowerCase() ||
            "discovery",
          priority:
            priorityMap[dealData.priority] ||
            dealData.priority?.toLowerCase() ||
            "medium",
          probability: dealData.probability || 0,
          closeDate: dealData.closeDate || null,
          owner: dealData.assignedTo
            ? `${dealData.assignedTo.firstName || ""} ${
                dealData.assignedTo.lastName || ""
              }`.trim()
            : "Unassigned",
          description: dealData.description || "",
          avatar: null,
          leadCompany: dealData.leadCompany || deal.leadCompany,
          clientAccount: dealData.clientAccount || deal.clientAccount,
          contact: dealData.contact || deal.contact,
          assignedTo: dealData.assignedTo || deal.assignedTo,
          createdAt: dealData.createdAt || deal.createdAt,
          updatedAt: dealData.updatedAt || deal.updatedAt,
          dealGroup: dealData.dealGroup || deal.dealGroup,
          visibility: dealData.visibility || deal.visibility || "PUBLIC",
          visibleTo: dealData.visibleTo || deal.visibleTo || [],
        };
      });

      // Calculate stats from ALL deals (unfiltered)
      const totalValue = transformedDeals.reduce(
        (sum, deal) => sum + deal.value,
        0
      );
      const wonDeals = transformedDeals.filter(
        (deal) => deal.stage === "closed_won" || deal.stage === "won"
      );
      const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);

      setStats({
        total: transformedDeals.length,
        totalValue: totalValue,
        won: wonDeals.length,
        averageValue:
          transformedDeals.length > 0
            ? totalValue / transformedDeals.length
            : 0,
      });

      // Calculate deal stats by stage
      const newDeals = transformedDeals.filter(
        (deal) => deal.stage === "discovery" || deal.stage === "new"
      );
      const qualifiedDeals = transformedDeals.filter(
        (deal) => deal.stage === "proposal" || deal.stage === "qualified"
      );
      const negotiationDeals = transformedDeals.filter(
        (deal) => deal.stage === "negotiation"
      );
      const lostDeals = transformedDeals.filter(
        (deal) => deal.stage === "closed_lost" || deal.stage === "lost"
      );

      setDealStats({
        all: transformedDeals.length,
        new: newDeals.length,
        qualified: qualifiedDeals.length,
        negotiation: negotiationDeals.length,
        won: wonDeals.length,
        lost: lostDeals.length,
      });
    } catch (err) {
      console.error("Error fetching all deals for stats:", err);
    }
  };

  // Fetch all deals for stats on initial mount
  useEffect(() => {
    fetchAllDealsForStats();
  }, []); // Only run once on mount

  // Fetch deals data when component mounts or when filters/tab changes
  useEffect(() => {
    fetchDeals();
  }, [activeTab, appliedFilters]);

  // Filter deals when search term changes (client-side filtering)
  useEffect(() => {
    filterDeals();
  }, [deals, searchQuery]);

  // Show filtered count after data is loaded
  const prevFilteredCountRef = useRef(null);
  useEffect(() => {
    const hasActiveFilters = Object.values(appliedFilters).some(
      (value) => value && value.toString().trim() !== ""
    );

    if (
      hasActiveFilters &&
      !loading &&
      filteredDeals.length !== prevFilteredCountRef.current
    ) {
      prevFilteredCountRef.current = filteredDeals.length;
      toast.success(
        `Filters applied. Showing ${filteredDeals.length} result${
          filteredDeals.length !== 1 ? "s" : ""
        }`
      );
    }
  }, [filteredDeals.length, appliedFilters, loading]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDeals = filteredDeals.slice(startIndex, endIndex);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters, searchQuery, activeTab]);

  // fetch users if admin
  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [user]);

  // Fetch deal groups
  useEffect(() => {
    fetchDealGroups();
  }, []);

  const fetchDealGroups = async () => {
    try {
      const response = await dealGroupService.getAll({
        pagination: { pageSize: 1000 },
        sort: ["name:asc"],
      });
      const groupsData = Array.isArray(response)
        ? response
        : response?.data || [];
      setDealGroups(groupsData);
    } catch (error) {
      console.error("Error fetching deal groups:", error);
    }
  };

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

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = {
        populate: [
          "leadCompany",
          "clientAccount",
          "contact",
          "assignedTo",
          "dealGroup",
          "visibleTo",
        ],
        sort: ["createdAt:desc"],
        // Pass userId for visibility filtering
        userId: user?.id || user?.documentId || null,
      };

      // Add stage filter if active tab is not "all"
      if (activeTab !== "all") {
        // Map tab keys to Strapi stage values
        const stageMap = {
          new: "DISCOVERY",
          qualified: "PROPOSAL",
          negotiation: "NEGOTIATION",
          won: "CLOSED_WON",
          lost: "CLOSED_LOST",
        };

        const mappedStage =
          stageMap[activeTab.toLowerCase()] || activeTab.toUpperCase();
        params.filters = {
          stage: {
            $eq: mappedStage,
          },
        };
      }

      // Add applied filters - transform filter values to match API format
      if (Object.keys(appliedFilters).length > 0) {
        const filterConditions = {};

        // Stage filter - map UI values to API values
        if (appliedFilters.stage) {
          const stageMap = {
            new: "DISCOVERY",
            qualified: "PROPOSAL",
            proposal: "PROPOSAL",
            negotiation: "NEGOTIATION",
            won: "CLOSED_WON",
            lost: "CLOSED_LOST",
          };
          const mappedStage =
            stageMap[appliedFilters.stage.toLowerCase()] ||
            appliedFilters.stage.toUpperCase();
          filterConditions.stage = { $eq: mappedStage };
        }

        // Company filter - search in related companies
        if (appliedFilters.company) {
          filterConditions.$or = [
            {
              "leadCompany.companyName": { $containsi: appliedFilters.company },
            },
            {
              "clientAccount.companyName": {
                $containsi: appliedFilters.company,
              },
            },
          ];
        }

        // Priority filter - map to uppercase
        if (appliedFilters.priority) {
          filterConditions.priority = {
            $eq: appliedFilters.priority.toUpperCase(),
          };
        }

        // Value range filters
        if (appliedFilters.valueMin || appliedFilters.valueMax) {
          filterConditions.value = {};
          if (appliedFilters.valueMin) {
            filterConditions.value.$gte = parseFloat(appliedFilters.valueMin);
          }
          if (appliedFilters.valueMax) {
            filterConditions.value.$lte = parseFloat(appliedFilters.valueMax);
          }
        }

        // Probability range filters
        if (appliedFilters.probabilityMin || appliedFilters.probabilityMax) {
          filterConditions.probability = {};
          if (appliedFilters.probabilityMin) {
            filterConditions.probability.$gte = parseInt(
              appliedFilters.probabilityMin
            );
          }
          if (appliedFilters.probabilityMax) {
            filterConditions.probability.$lte = parseInt(
              appliedFilters.probabilityMax
            );
          }
        }

        // Close date range filters
        if (appliedFilters.closeDateFrom || appliedFilters.closeDateTo) {
          filterConditions.closeDate = {};
          if (appliedFilters.closeDateFrom) {
            filterConditions.closeDate.$gte = appliedFilters.closeDateFrom;
          }
          if (appliedFilters.closeDateTo) {
            filterConditions.closeDate.$lte = appliedFilters.closeDateTo;
          }
        }

        // Merge filter conditions with existing filters
        if (Object.keys(filterConditions).length > 0) {
          params.filters = {
            ...params.filters,
            ...filterConditions,
          };
        }
      }

      const response = await dealService.getAll(params);

      const dealsData = response?.data || [];

      // Transform Strapi data to match component format
      const transformedDeals = dealsData.map((deal) => {
        // Map Strapi stages to UI-friendly values
        const stageMap = {
          DISCOVERY: "discovery",
          PROPOSAL: "proposal",
          NEGOTIATION: "negotiation",
          CLOSED_WON: "won",
          CLOSED_LOST: "lost",
        };

        // Map Strapi priority to lowercase
        const priorityMap = {
          LOW: "low",
          MEDIUM: "medium",
          HIGH: "high",
        };

        const dealData = deal.attributes || deal;

        return {
          id: deal.id || deal.documentId,
          name: dealData.name || dealData.title || "",
          company:
            dealData.leadCompany?.companyName ||
            dealData.leadCompany?.attributes?.companyName ||
            dealData.clientAccount?.companyName ||
            dealData.clientAccount?.attributes?.companyName ||
            "",
          value: parseFloat(dealData.value) || 0,
          stage:
            stageMap[dealData.stage] ||
            dealData.stage?.toLowerCase() ||
            "discovery",
          priority:
            priorityMap[dealData.priority] ||
            dealData.priority?.toLowerCase() ||
            "medium",
          probability: dealData.probability || 0,
          closeDate: dealData.closeDate || null,
          owner: dealData.assignedTo
            ? `${dealData.assignedTo.firstName || ""} ${
                dealData.assignedTo.lastName || ""
              }`.trim()
            : "Unassigned",
          description: dealData.description || "",
          avatar: null,
          leadCompany: dealData.leadCompany || deal.leadCompany,
          clientAccount: dealData.clientAccount || deal.clientAccount,
          contact: dealData.contact || deal.contact,
          assignedTo: dealData.assignedTo || deal.assignedTo,
          createdAt: dealData.createdAt || deal.createdAt,
          updatedAt: dealData.updatedAt || deal.updatedAt,
          dealGroup: dealData.dealGroup || deal.dealGroup,
          visibility: dealData.visibility || deal.visibility || "PUBLIC",
          visibleTo: dealData.visibleTo || deal.visibleTo || [],
        };
      });

      setDeals(transformedDeals);

      // Don't update stats here - stats are calculated from all deals in fetchAllDealsForStats
    } catch (err) {
      console.error("Error fetching deals:", err);
      setError("Failed to load deals");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDeals = () => {
    let filtered = [...deals];

    // Filter by search term (client-side for instant results)
    if (searchQuery) {
      filtered = filtered.filter(
        (deal) =>
          deal.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.owner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Additional client-side filters for appliedFilters not handled server-side
    if (appliedFilters.priority) {
      filtered = filtered.filter(
        (deal) =>
          deal.priority?.toLowerCase() === appliedFilters.priority.toLowerCase()
      );
    }
    if (appliedFilters.owner) {
      // Match by user ID
      const filterUserId = appliedFilters.owner.toString();
      filtered = filtered.filter((deal) => {
        const assignedUser = deal.assignedTo;
        const assignedUserId = assignedUser
          ? (assignedUser.id || assignedUser.documentId)?.toString()
          : "";
        return assignedUserId === filterUserId;
      });
    }
    if (appliedFilters.company) {
      filtered = filtered.filter((deal) =>
        deal.company
          ?.toLowerCase()
          .includes(appliedFilters.company.toLowerCase())
      );
    }
    if (appliedFilters.valueMin) {
      filtered = filtered.filter(
        (deal) => deal.value >= parseFloat(appliedFilters.valueMin)
      );
    }
    if (appliedFilters.valueMax) {
      filtered = filtered.filter(
        (deal) => deal.value <= parseFloat(appliedFilters.valueMax)
      );
    }
    if (appliedFilters.probabilityMin) {
      filtered = filtered.filter(
        (deal) => deal.probability >= parseInt(appliedFilters.probabilityMin)
      );
    }
    if (appliedFilters.probabilityMax) {
      filtered = filtered.filter(
        (deal) => deal.probability <= parseInt(appliedFilters.probabilityMax)
      );
    }

    setFilteredDeals(filtered);
  };

  const handleAddDeal = () => {
    router.push("/sales/deals/new");
  };

  // Kanban drag and drop handler
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;


    if (!destination) {
      return;
    }

    // Find the dragged deal - check both id and documentId
    const draggedDeal = filteredDeals.find(
      (deal) =>
        deal.id?.toString() === draggableId ||
        deal.documentId?.toString() === draggableId ||
        (deal.id || deal.documentId)?.toString() === draggableId
    );

    if (!draggedDeal) {
      return;
    }


    // Map column IDs to deal stages
    const stageMap = {
      discovery: "DISCOVERY",
      proposal: "PROPOSAL",
      negotiation: "NEGOTIATION",
      "closed-won": "CLOSED_WON",
      "closed-lost": "CLOSED_LOST",
    };

    const newStage = stageMap[destination.droppableId];

    if (!newStage || draggedDeal.stage === newStage) return;

    try {
      // Update deal stage via API
      await dealService.update(draggedDeal.id, { stage: newStage });

      // Update local state
      setDeals((prevDeals) =>
        prevDeals.map((deal) =>
          deal.id === draggedDeal.id ? { ...deal, stage: newStage } : deal
        )
      );

    } catch (error) {
      console.error("Error updating deal stage:", error);
      // You could show a toast notification here
    }
  };

  // Group deals by stage for Kanban view
  const groupDealsByStage = () => {
    const stages = {
      discovery: [],
      proposal: [],
      negotiation: [],
      "closed-won": [],
      "closed-lost": [],
    };

    filteredDeals.forEach((deal) => {
      // Ensure each deal has a valid ID for dragging (must be string for react-beautiful-dnd)
      const dealId = (
        deal.id ||
        deal.documentId ||
        `deal-${Date.now()}-${Math.random()}`
      ).toString();
      const dealWithId = {
        ...deal,
        id: dealId,
      };

      const stageKey =
        deal.stage?.toLowerCase().replace("_", "-") || "discovery";
      if (stages[stageKey]) {
        stages[stageKey].push(dealWithId);
      }
    });

    return stages;
  };

  // Group deals by dealGroup for Grouped view
  const groupDealsByGroup = () => {
    const grouped = {
      ungrouped: [],
    };

    filteredDeals.forEach((deal) => {
      const groupId =
        deal.dealGroup?.id || deal.dealGroup?.documentId || deal.dealGroup;
      if (groupId) {
        const groupKey = groupId.toString();
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(deal);
      } else {
        grouped.ungrouped.push(deal);
      }
    });

    return grouped;
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Render grouped view
  const renderGroupedView = () => {
    const grouped = groupDealsByGroup();
    const groupIds = Object.keys(grouped).filter((key) => key !== "ungrouped");

    // Get group details for each group ID
    const groupsWithDetails = groupIds.map((groupId) => {
      const group = dealGroups.find(
        (g) => (g.id || g.documentId).toString() === groupId
      );
      return {
        id: groupId,
        name: group?.name || group?.attributes?.name || "Unknown Group",
        description: group?.description || group?.attributes?.description || "",
        department: group?.department || group?.attributes?.department || "",
        team: group?.team || group?.attributes?.team || "",
        deals: grouped[groupId],
      };
    });

    return (
      <div className="space-y-4">
        {/* Grouped Deals */}
        {groupsWithDetails.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          const totalValue = group.deals.reduce(
            (sum, deal) => sum + (deal.value || 0),
            0
          );

          return (
            <div
              key={group.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Group Header */}
              <div
                className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-pink-50 border-b border-gray-200 cursor-pointer hover:from-orange-100 hover:to-pink-100 transition-colors"
                onClick={() => toggleGroup(group.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                  <Folder className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {group.name}
                    </h3>
                    {(group.description || group.department || group.team) && (
                      <div className="flex gap-4 mt-1 text-xs text-gray-600">
                        {group.description && <span>{group.description}</span>}
                        {group.department && (
                          <span>Dept: {group.department}</span>
                        )}
                        {group.team && <span>Team: {group.team}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {group.deals.length}
                      </div>
                      <div className="text-xs text-gray-600">
                        deal{group.deals.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(totalValue)}
                      </div>
                      <div className="text-xs text-gray-600">total value</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Content */}
              {isExpanded && (
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <DealsListView
                      filteredDeals={group.deals}
                      dealColumnsTable={visibleColumnsTable}
                      selectedDeals={selectedDeals}
                      setSelectedDeals={setSelectedDeals}
                      searchQuery=""
                      setSearchQuery={() => {}}
                      onAddClick={handleAddDeal}
                      onRowClick={(deal) => handleViewDeal(deal)}
                      pagination={null}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Ungrouped Deals */}
        {grouped.ungrouped.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div
              className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleGroup("ungrouped")}
            >
              <div className="flex items-center gap-3 flex-1">
                {expandedGroups.has("ungrouped") ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
                <Folder className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    Ungrouped Deals
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Deals not assigned to any group
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {grouped.ungrouped.length}
                    </div>
                    <div className="text-xs text-gray-600">
                      deal{grouped.ungrouped.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(
                        grouped.ungrouped.reduce(
                          (sum, deal) => sum + (deal.value || 0),
                          0
                        )
                      )}
                    </div>
                    <div className="text-xs text-gray-600">total value</div>
                  </div>
                </div>
              </div>
            </div>

            {expandedGroups.has("ungrouped") && (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <DealsListView
                    filteredDeals={grouped.ungrouped}
                    dealColumnsTable={visibleColumnsTable}
                    selectedDeals={selectedDeals}
                    setSelectedDeals={setSelectedDeals}
                    searchQuery=""
                    setSearchQuery={() => {}}
                    onAddClick={handleAddDeal}
                    onRowClick={(deal) => handleViewDeal(deal)}
                    pagination={null}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {groupsWithDetails.length === 0 && grouped.ungrouped.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No deals found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or create a new deal
            </p>
            <Button onClick={handleAddDeal}>
              <Plus className="w-4 h-4 mr-2" />
              Create Deal
            </Button>
          </div>
        )}
      </div>
    );
  };

  const handleApplyFilters = (filters) => {

    // Check if any filters are active
    const hasActiveFilters = Object.values(filters).some(
      (value) => value && value.toString().trim() !== ""
    );

    if (hasActiveFilters) {
      setAppliedFilters(filters);
      // fetchDeals will be called by useEffect when appliedFilters changes
    } else {
      setAppliedFilters({});
      toast.info("Filters cleared");
      // fetchDeals will be called by useEffect when appliedFilters changes
    }
  };

  const handleExport = () => {
    // Generate CSV content
    const csvContent = [
      // Header
      [
        "Deal Name",
        "Company",
        "Value",
        "Stage",
        "Priority",
        "Probability",
        "Close Date",
        "Owner",
        "Description",
      ].join(","),
      // Data rows
      ...filteredDeals.map((deal) =>
        [
          `"${deal.name}"`,
          `"${deal.company}"`,
          deal.value,
          deal.stage,
          deal.priority,
          deal.probability,
          deal.closeDate,
          `"${deal.owner}"`,
          `"${deal.description}"`,
        ].join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deals_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteDeal = async () => {
    if (!dealToDelete) return;

    const loadingKey = `${dealToDelete.id}-delete`;
    setLoadingActions((prev) => ({ ...prev, [loadingKey]: true }));

    try {

      // Delete the deal via API
      await dealService.delete(dealToDelete.id);

      // Remove from local state
      setDeals((prev) => prev.filter((deal) => deal.id !== dealToDelete.id));
      setFilteredDeals((prev) =>
        prev.filter((deal) => deal.id !== dealToDelete.id)
      );

      // Refresh stats
      await fetchDeals();

      // Close modal and reset state
      setShowDeleteModal(false);
      setDealToDelete(null);

    } catch (error) {
      console.error("Error deleting deal:", error);
      alert("Failed to delete deal. Please try again.");
    } finally {
      setLoadingActions((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handler functions for table actions
  const handleViewDeal = (deal) => {
    router.push(`/sales/deals/${deal.id}`);
  };

  const handleEditDeal = (deal) => {
    router.push(`/sales/deals/${deal.id}/edit`);
  };

  const handleEmailDeal = (deal) => {
    // Implement email functionality
  };

  const handleDeleteDealFromTable = (deal) => {
    setDealToDelete(deal);
    setShowDeleteModal(true);
  };

  // Handle status updates
  const handleStatusUpdate = async (dealId, newStage) => {
    if (!dealId) {
      console.error("No deal ID provided");
      return;
    }

    // Find the deal to check if it was already won
    const deal = deals.find((d) => d.id === dealId);
    const isWon = newStage.toLowerCase() === "won";
    const wasWon = deal?.stage?.toLowerCase() === "won";

    // Map UI stage to Strapi stage
    const stageMap = {
      discovery: "DISCOVERY",
      proposal: "PROPOSAL",
      negotiation: "NEGOTIATION",
      won: "CLOSED_WON",
      lost: "CLOSED_LOST",
    };

    const strapiStage =
      stageMap[newStage.toLowerCase()] || newStage.toUpperCase();
    const loadingKey = `${dealId}-${newStage.toLowerCase()}`;

    // Set loading state
    setLoadingActions((prev) => ({ ...prev, [loadingKey]: true }));

    try {

      // Update the stage via API
      await dealService.update(dealId, { stage: strapiStage });

      // If deal is won, check if we need to convert lead company to client account
      if (strapiStage === "CLOSED_WON" && isWon && !wasWon) {
        try {
          // Fetch the updated deal to get full data including leadCompany
          const updatedDealResponse = await dealService.getById(dealId, {
            populate: {
              leadCompany: {
                populate: ["convertedAccount"],
              },
              clientAccount: true,
            },
          });

          const fullDealData = updatedDealResponse?.data;
          const dealAttributes = fullDealData?.attributes || fullDealData;

          // Check if deal has a leadCompany and no clientAccount
          const leadCompany =
            dealAttributes?.leadCompany?.data || dealAttributes?.leadCompany;
          const clientAccount =
            dealAttributes?.clientAccount?.data ||
            dealAttributes?.clientAccount;

          if (leadCompany && !clientAccount) {
            const leadCompanyId = leadCompany.id || leadCompany.documentId;
            const leadCompanyData = leadCompany.attributes || leadCompany;

            // Check if lead company has already been converted
            const convertedAccount =
              leadCompanyData?.convertedAccount?.data ||
              leadCompanyData?.convertedAccount;

            if (!convertedAccount) {

              // Convert lead company to client account
              const conversionResponse =
                await leadCompanyService.convertToClient(leadCompanyId);
              const newClientAccount =
                conversionResponse?.data?.convertedAccount?.data ||
                conversionResponse?.convertedAccount ||
                conversionResponse?.data;

              if (newClientAccount) {
                const clientAccountId =
                  newClientAccount.id || newClientAccount.documentId;

                // Update deal to link to the new client account
                await dealService.update(dealId, {
                  clientAccount: clientAccountId,
                });


                toast.success(
                  `Lead company "${
                    leadCompanyData.companyName || "Unknown"
                  }" converted to client account!`,
                  {
                    position: "top-right",
                    autoClose: 5000,
                  }
                );
              }
            } else {
              // Lead company already converted, just link the existing client account to the deal
              const existingClientAccountId =
                convertedAccount.id || convertedAccount.documentId;

              await dealService.update(dealId, {
                clientAccount: existingClientAccountId,
              });

            }
          }
        } catch (conversionError) {
          console.error(
            "Error converting lead company to client account:",
            conversionError
          );
          // Don't fail the deal update if conversion fails, just log the error
          toast.warning(
            "Deal marked as won, but there was an issue converting the lead company to a client account.",
            {
              position: "top-right",
              autoClose: 5000,
            }
          );
        }
      }

      // Update local state - map Strapi stage back to UI stage
      const uiStageMap = {
        DISCOVERY: "discovery",
        PROPOSAL: "proposal",
        NEGOTIATION: "negotiation",
        CLOSED_WON: "won",
        CLOSED_LOST: "lost",
      };

      const uiStage = uiStageMap[strapiStage] || newStage.toLowerCase();

      const updatedDeal = {
        ...deal,
        stage: uiStage,
      };

      setDeals((prevDeals) =>
        prevDeals.map((d) => (d.id === dealId ? updatedDeal : d))
      );

      setFilteredDeals((prevDeals) =>
        prevDeals.map((d) => (d.id === dealId ? updatedDeal : d))
      );

      // Refresh stats
      await fetchDeals();

      // Trigger celebratory animation if converting to Won (and wasn't already won)
      if (isWon && !wasWon) {
        setDealForProject(updatedDeal);
        setShowConfetti(true);
        setShowCreateProjectPrompt(true);
      }

    } catch (error) {
      console.error("Error updating deal stage:", error);
      console.error("Error details:", error.message);

      // Show user-friendly error message
      const errorMessage =
        error.message || "Failed to update stage. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      // Clear loading state
      setLoadingActions((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle creating project from deal
  const handleCreateProject = async () => {
    if (!dealForProject) return;

    setCreatingProject(true);
    try {
      // Get client name from deal
      const clientName =
        dealForProject.clientAccount?.companyName ||
        dealForProject.clientAccount?.attributes?.companyName ||
        dealForProject.leadCompany?.companyName ||
        dealForProject.leadCompany?.attributes?.companyName ||
        dealForProject.company ||
        dealForProject.name;

      // Generate slug from client name
      const slug = clientName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Generate icon from first letter
      const icon = clientName.charAt(0).toUpperCase();

      // Get deal ID (handle both id and documentId)
      const dealId = dealForProject.id || dealForProject.documentId;

      // Try to find account by company name (account entity, not clientAccount)
      let accountId = null;
      try {
        if (clientName) {
          const accountsResponse = await strapiClient.get("/accounts", {
            "filters[companyName][$eq]": clientName,
          });

          if (accountsResponse?.data && accountsResponse.data.length > 0) {
            const account = accountsResponse.data[0];
            accountId = account.id || account.documentId;
          }
        }
      } catch (accountError) {
        // Continue without account relation
      }

      // Prepare project payload
      const projectData = {
        name: `${clientName} - ${dealForProject.name}`,
        slug: `${slug}-${dealId}`,
        description:
          dealForProject.description ||
          `Project created from deal: ${dealForProject.name}`,
        status: "PLANNING",
        icon: icon,
        color: "from-blue-400 to-blue-600",
        deal: dealId, // Connect to the deal
      };

      // Only add account if we found one
      if (accountId) {
        projectData.account = accountId;
      }

      // Create project using Strapi API
      const response = await strapiClient.post("/projects", {
        data: projectData,
      });

      if (response.data) {
        alert(`Project "${projectData.name}" created successfully!`);
        setShowCreateProjectPrompt(false);
        setShowConfetti(false);
        setDealForProject(null);
        // Optionally navigate to the project
        // router.push(`/projects/${response.data.slug || response.data.id}`);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert(`Failed to create project: ${error.message || "Unknown error"}`);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleCloseProjectPrompt = () => {
    setShowCreateProjectPrompt(false);
    setShowConfetti(false);
    setDealForProject(null);
  };

  // Helper functions for badges
  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "won":
        return "success";
      case "lost":
        return "danger";
      case "negotiation":
        return "warning";
      case "proposal":
        return "info";
      case "qualified":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Initialize visible columns from localStorage or default to all columns
  useEffect(() => {
    const STORAGE_KEY = "dealColumnsVisibility";
    const allColumnKeys = [
      "deal",
      "company",
      "value",
      "stage",
      "probability",
      "closeDate",
      "owner",
      "priority",
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
      const STORAGE_KEY = "dealColumnsVisibility";
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
      } catch (error) {
        console.error("Error saving column visibility to localStorage:", error);
      }
    }
  }, [visibleColumns]);

  // Table columns configuration
  const dealColumnsTable = [
    {
      key: "deal",
      label: "DEAL",
      render: (_, deal) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar
            src={deal.avatar}
            alt={deal.name}
            fallback={deal.name?.charAt(0)}
            size="sm"
            className="flex-shrink-0 w-10 h-10"
          />
          <div>
            <div className="font-medium text-gray-900">{deal.name}</div>
            <div className="text-sm text-gray-500">
              {deal.description
                ? deal.description.length > 40
                  ? `${deal.description.substring(0, 40)}...`
                  : deal.description
                : ""}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "company",
      label: "COMPANY",
      render: (_, deal) => (
        <div className="min-w-[150px]">
          <div className="font-medium text-gray-900">
            {deal.company || "Not specified"}
          </div>
        </div>
      ),
    },
    {
      key: "value",
      label: "VALUE",
      render: (_, deal) => (
        <div className="min-w-[120px]">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {formatCurrency(deal.value || 0)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "stage",
      label: "STAGE",
      render: (_, deal) => {
        const currentStage = deal.stage?.toLowerCase() || "discovery";
        const stageColors = {
          discovery: {
            bg: "bg-blue-100",
            text: "text-blue-800",
            border: "border-blue-400",
            shadow: "shadow-blue-200",
          },
          proposal: {
            bg: "bg-purple-100",
            text: "text-purple-800",
            border: "border-purple-400",
            shadow: "shadow-purple-200",
          },
          negotiation: {
            bg: "bg-orange-100",
            text: "text-orange-800",
            border: "border-orange-400",
            shadow: "shadow-orange-200",
          },
          won: {
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

        const colors = stageColors[currentStage] || stageColors.discovery;
        // Check if any status update is in progress for this deal
        const isLoading = Object.keys(loadingActions).some(
          (key) => key.startsWith(`${deal.id}-`) && loadingActions[key]
        );

        const statusOptions = [
          { value: "discovery", label: "Discovery" },
          { value: "proposal", label: "Proposal" },
          { value: "negotiation", label: "Negotiation" },
          { value: "won", label: "Won" },
          { value: "lost", label: "Lost" },
        ];

        return (
          <div className="min-w-[140px]" onClick={(e) => e.stopPropagation()}>
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <select
                value={currentStage}
                onChange={(e) => {
                  e.stopPropagation();
                  handleStatusUpdate(deal.id, e.target.value);
                }}
                className={`w-full ${colors.bg} ${colors.text} ${colors.border} border-2 rounded-lg px-3 py-2 font-bold text-xs text-center shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer appearance-none`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.5rem center",
                  paddingRight: "2rem",
                }}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      },
    },
    {
      key: "probability",
      label: "PROBABILITY",
      render: (_, deal) => (
        <div className="min-w-[120px]">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: `${deal.probability || 0}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">
              {deal.probability || 0}%
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "closeDate",
      label: "CLOSE DATE",
      render: (_, deal) => (
        <div className="min-w-[120px]">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm text-gray-900">
              {deal.closeDate
                ? new Date(deal.closeDate).toLocaleDateString("en-IN")
                : "Not set"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "owner",
      label: "OWNER",
      render: (_, deal) => {
        const owner = deal.assignedTo;
        const ownerName = owner
          ? `${owner.firstName || ""} ${owner.lastName || ""}`.trim() ||
            owner.username ||
            "Unknown"
          : "Unassigned";

        const handleAssignClick = () => {
          setDealToAssign(deal);
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
      key: "priority",
      label: "PRIORITY",
      render: (_, deal) => {
        const priority = deal.priority?.toLowerCase() || "medium";
        const priorityColors = {
          high: {
            bg: "bg-red-100",
            text: "text-red-800",
            border: "border-red-400",
            shadow: "shadow-red-200",
          },
          medium: {
            bg: "bg-yellow-100",
            text: "text-yellow-800",
            border: "border-yellow-400",
            shadow: "shadow-yellow-200",
          },
          low: {
            bg: "bg-blue-100",
            text: "text-blue-800",
            border: "border-blue-400",
            shadow: "shadow-blue-200",
          },
        };

        const colors = priorityColors[priority] || priorityColors.medium;
        const displayPriority = deal.priority || "Medium";

        return (
          <div className="min-w-[100px]">
            <div
              className={`${colors.bg} ${colors.text} ${colors.border} border-2 rounded-lg px-3 py-2 font-bold text-xs text-center shadow-md ${colors.shadow} transition-all duration-200 hover:scale-105 hover:shadow-lg`}
            >
              {displayPriority.charAt(0).toUpperCase() +
                displayPriority.slice(1)}
            </div>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      label: "CREATED",
      render: (_, deal) => (
        <div className="min-w-[110px]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-600">
              {deal.createdAt
                ? new Date(deal.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "N/A"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (_, deal) => (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* View Deal */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDeal(deal);
            }}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="View Deal"
          >
            <Eye className="w-4 h-4" />
          </Button>

          {/* Edit Deal */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditDeal(deal);
            }}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            title="Edit Deal"
          >
            <Edit className="w-4 h-4" />
          </Button>

          {/* Email Deal */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEmailDeal(deal);
            }}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            title="Send Email"
          >
            <Mail className="w-4 h-4" />
          </Button>

          {/* Delete Deal */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteDealFromTable(deal);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete Deal"
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
      return dealColumnsTable;
    }
    return dealColumnsTable.filter((col) => visibleColumns.includes(col.key));
  };

  const visibleColumnsTable = getVisibleColumns();

  // Status stats for KPIs
  const statusStats = [
    {
      label: "All",
      count: dealStats.all,
      color: "bg-orange-50",
      borderColor: "border-orange-200",
      iconColor: "text-orange-600",
      icon: Target,
    },
    {
      label: "New",
      count: dealStats.new,
      color: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      icon: UserPlus,
    },
    {
      label: "Qualified",
      count: dealStats.qualified,
      color: "bg-purple-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
      icon: Star,
    },
    {
      label: "Won",
      count: dealStats.won,
      color: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      icon: CheckCircle,
    },
  ];

  // Tab items
  const tabItems = [
    { key: "all", label: "All Deals", badge: dealStats.all },
    { key: "new", label: "Discovery", badge: dealStats.new },
    { key: "qualified", label: "Proposal", badge: dealStats.qualified },
    { key: "negotiation", label: "Negotiation", badge: dealStats.negotiation },
    { key: "won", label: "Won", badge: dealStats.won },
    { key: "lost", label: "Lost", badge: dealStats.lost },
  ];

  if (loading) {
    return (
      <div className="p-4 space-y-4 bg-white min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-4 bg-white min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchDeals}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Confetti Animation */}
      {showConfetti && (
        <>
          <style
            dangerouslySetInnerHTML={{
              __html: `
              @keyframes confetti-fall {
                0% {
                  transform: translateY(0) rotate(0deg);
                  opacity: 1;
                }
                100% {
                  transform: translateY(100vh) rotate(720deg);
                  opacity: 0;
                }
              }
            `,
            }}
          />
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(150)].map((_, i) => {
              const colors = [
                "#10B981", // green
                "#3B82F6", // blue
                "#F59E0B", // amber
                "#EF4444", // red
                "#8B5CF6", // purple
                "#EC4899", // pink
                "#14B8A6", // teal
                "#F97316", // orange
                "#FFD700", // gold
                "#FF6B6B", // coral
              ];
              const color = colors[Math.floor(Math.random() * colors.length)];
              const left = Math.random() * 100;
              const delay = Math.random() * 3;
              const duration = 3 + Math.random() * 2;
              const size = 10 + Math.random() * 15;

              return (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${left}%`,
                    top: "-10px",
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    animation: `confetti-fall ${duration}s ease-out ${delay}s forwards`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Project Creation Modal */}
      {showCreateProjectPrompt && dealForProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  🎉 Deal Won!
                </h3>
                <p className="text-sm text-gray-500">
                  Congratulations on closing this deal
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                <strong>{dealForProject.name}</strong> has been marked as Won
              </p>
              {dealForProject.value && (
                <p className="text-sm text-gray-600 mb-4">
                  Deal Value:{" "}
                  <strong>{formatCurrency(dealForProject.value)}</strong>
                </p>
              )}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700 font-medium mb-2">
                  Would you like to create a project for this client?
                </p>
                <p className="text-xs text-green-600">
                  This will create a new project in the Projects section linked
                  to this deal's client.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCloseProjectPrompt}
                variant="outline"
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={creatingProject}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
              >
                {creatingProject ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  "Yes, Create Project"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4 bg-white min-h-screen">
        {/* Page Header */}
        <PageHeader
          title="Deals"
          subtitle="Manage your sales pipeline and track deal progress"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Sales", href: "/sales" },
            { label: "Deals", href: "/sales/deals" },
          ]}
          showSearch={true}
          showActions={true}
          searchPlaceholder="Search deals..."
          onSearchChange={setSearchQuery}
          onAddClick={handleAddDeal}
          onFilterClick={() => setIsFilterModalOpen(true)}
          hasActiveFilters={Object.values(appliedFilters).some(
            (value) => value && value.toString().trim() !== ""
          )}
          onExportClick={() => handleExport()}
          customActions={
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDealGroupModalOpen(true)}
                className="flex items-center gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                Groups
              </Button>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 ${
                    viewMode === "list"
                      ? "bg-white shadow-sm"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <List className="w-4 h-4 mr-1" />
                  List
                </Button>
                <Button
                  variant={viewMode === "kanban" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("kanban")}
                  className={`px-3 py-1.5 ${
                    viewMode === "kanban"
                      ? "bg-white shadow-sm"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <Columns className="w-4 h-4 mr-1" />
                  Kanban
                </Button>
                <Button
                  variant={viewMode === "grouped" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grouped")}
                  className={`px-3 py-1.5 ${
                    viewMode === "grouped"
                      ? "bg-white shadow-sm"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <Folder className="w-4 h-4 mr-1" />
                  Grouped
                </Button>
              </div>
            </div>
          }
        />
        <div className="space-y-4">
          {/* Stats Overview */}
          <DealsKPIs statusStats={statusStats} onStatClick={setActiveTab} />

          {/* View Toggle */}
          <DealsTabs
            tabItems={tabItems}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAddClick={handleAddDeal}
            onExportClick={() => handleExport()}
            onColumnVisibilityClick={() => setIsColumnVisibilityModalOpen(true)}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          {/* Results Count */}
          <div className="text-sm text-gray-600 px-1">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {filteredDeals.length}
            </span>{" "}
            result{filteredDeals.length !== 1 ? "s" : ""}
          </div>

          {/* Groups Button - Shown only in Grouped View */}
          {viewMode === "grouped" && (
            <div className="flex items-center justify-between px-1 mb-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDealGroupModalOpen(true)}
                  className="flex items-center gap-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                >
                  <FolderPlus className="w-4 h-4" />
                  Manage Groups
                </Button>
              </div>
            </div>
          )}

          {/* Deals Content - List, Kanban, or Grouped View */}
          {viewMode === "list" ? (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <DealsListView
                filteredDeals={paginatedDeals}
                dealColumnsTable={visibleColumnsTable}
                selectedDeals={selectedDeals}
                setSelectedDeals={setSelectedDeals}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAddClick={handleAddDeal}
                onRowClick={(deal) => handleViewDeal(deal)}
                pagination={
                  totalPages > 1 ? (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredDeals.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                    />
                  ) : null
                }
              />
            </div>
          ) : viewMode === "grouped" ? (
            renderGroupedView()
          ) : (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <DealsBoardView
                columns={groupDealsByStage()}
                onDragEnd={handleDragEnd}
                onItemClick={handleViewDeal}
              />
            </div>
          )}
        </div>

        {/* Modals */}
        {/* Column Visibility Modal */}
        <ColumnVisibilityModal
          isOpen={isColumnVisibilityModalOpen}
          onClose={() => setIsColumnVisibilityModalOpen(false)}
          columns={dealColumnsTable}
          visibleColumns={visibleColumns}
          onVisibilityChange={setVisibleColumns}
        />

        <DealsFilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApplyFilters={handleApplyFilters}
          users={users}
          appliedFilters={appliedFilters}
        />

        {/* Deal Group Modal */}
        <DealGroupModal
          isOpen={isDealGroupModalOpen}
          onClose={() => setIsDealGroupModalOpen(false)}
          onGroupCreated={() => {
            fetchDealGroups();
            fetchDeals();
          }}
          onGroupUpdated={() => {
            fetchDealGroups();
            fetchDeals();
          }}
          onGroupDeleted={() => {
            fetchDealGroups();
            fetchDeals();
          }}
        />

        {/* Assign Owner Modal */}
        {showAssignModal && dealToAssign && (
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
                    Assign deal to a team member
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Select a user to assign <strong>{dealToAssign.name}</strong>{" "}
                  to:
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
                    setDealToAssign(null);
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
                      await dealService.update(dealToAssign.id, {
                        assignedTo: selectedUserId || null,
                      });
                      // Update local list
                      await fetchDeals();
                      setShowAssignModal(false);
                      setDealToAssign(null);
                      setSelectedUserId("");
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && dealToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Deal
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Are you sure you want to delete{" "}
                  <strong>{dealToDelete.name}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700 font-medium mb-2">
                    ⚠️ This will permanently delete:
                  </p>
                  <ul className="text-sm text-red-600 space-y-1">
                    <li>• Deal information and details</li>
                    <li>• All associated activities</li>
                    <li>• All proposals linked to this deal</li>
                    <li>• Activity history and notes</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDealToDelete(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteDeal}
                  disabled={loadingActions[`${dealToDelete.id}-delete`]}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
                >
                  {loadingActions[`${dealToDelete.id}-delete`] ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </div>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Deal
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
