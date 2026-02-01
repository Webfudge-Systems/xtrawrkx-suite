"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Eye,
  Edit,
  Download,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Send,
  Mail,
  Filter,
  Search,
  List,
  Columns,
  Trash2,
  X,
  FileCheck,
} from "lucide-react";
import { Badge, Avatar, Button, Table, Select } from "../../../components/ui";
import PageHeader from "../../../components/PageHeader";
import proposalService from "../../../lib/api/proposalService";
import clientAccountService from "../../../lib/api/clientAccountService";
import dealService from "../../../lib/api/dealService";
import { useAuth } from "../../../contexts/AuthContext";
import ProposalsKPIs from "./components/ProposalsKPIs";
import ProposalsTabs from "./components/ProposalsTabs";
import ProposalsListView from "./components/ProposalsListView";
import AddProposalModal from "./components/AddProposalModal";
import ViewProposalModal from "./components/ViewProposalModal";
import EditProposalModal from "./components/EditProposalModal";
import DeleteProposalModal from "./components/DeleteProposalModal";

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function ProposalsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // State management
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeView, setActiveView] = useState("list");
  const [selectedProposals, setSelectedProposals] = useState([]);
  const [showAddProposalModal, setShowAddProposalModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [proposalToView, setProposalToView] = useState(null);
  const [proposalToEdit, setProposalToEdit] = useState(null);
  const [proposalToDelete, setProposalToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [proposalFormData, setProposalFormData] = useState({
    title: "",
    proposalContent: "",
    validUntil: "",
    status: "DRAFT",
    clientAccount: "",
    deal: "",
    sentToContact: "",
  });
  const [clientAccounts, setClientAccounts] = useState([]);
  const [deals, setDeals] = useState([]);

  // Fetch proposals
  useEffect(() => {
    fetchProposals();
    fetchClientAccounts();
    fetchDeals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await proposalService.getAll({
        populate: [
          "clientAccount",
          "deal",
          "contact",
          "sentToContact",
          "createdBy",
        ],
        "pagination[pageSize]": 1000,
      });
      const proposalsData = response.data || [];
      setProposals(proposalsData);
      calculateStats(proposalsData);
    } catch (err) {
      console.error("Error fetching proposals:", err);
      setError("Failed to load proposals");
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientAccounts = async () => {
    try {
      const response = await clientAccountService.getAll({
        pagination: {
          pageSize: 1000,
        },
      });

      // Handle different response structures
      const accounts = Array.isArray(response)
        ? response
        : response?.data || [];
      setClientAccounts(accounts);
    } catch (err) {
      console.error("Error fetching client accounts:", err);
      console.error("Error details:", err.response?.data || err.message);
      setClientAccounts([]);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await dealService.getAll({
        populate: ["clientAccount", "leadCompany", "contact", "assignedTo"],
        pagination: { pageSize: 1000 },
        sort: ["createdAt:desc"],
      });
      const dealsData = response.data || [];
      setDeals(dealsData);
    } catch (err) {
      console.error("Error fetching deals:", err);
      setDeals([]);
    }
  };


  const calculateStats = (proposalsData) => {
    const stats = {
      total: proposalsData.length,
      byStatus: {
        DRAFT: 0,
        SENT: 0,
        ACCEPTED: 0,
        REJECTED: 0,
        EXPIRED: 0,
      },
    };

    proposalsData.forEach((proposal) => {
      const status = proposal.status || "DRAFT";
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });

    setStats(stats);
  };

  // Filter proposals based on active tab and search
  const filteredProposals = proposals.filter((proposal) => {
    const matchesTab = activeTab === "all" || proposal.status === activeTab;
    const matchesSearch =
      !searchQuery.trim() ||
      proposal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.clientAccount?.companyName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      proposal.clientAccount?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      proposal.deal?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Sort proposals
  const sortedProposals = [...filteredProposals].sort((a, b) => {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  // Handle create proposal
  const handleCreateProposal = async (e) => {
    e.preventDefault();

    if (!proposalFormData.title.trim()) {
      alert("Proposal title is required");
      return;
    }
    if (!proposalFormData.proposalContent.trim()) {
      alert("Proposal content is required");
      return;
    }
    if (!proposalFormData.clientAccount) {
      alert("Client account is required");
      return;
    }

    try {
      const proposalData = {
        title: proposalFormData.title.trim(),
        proposalContent: proposalFormData.proposalContent.trim(),
        validUntil: proposalFormData.validUntil
          ? new Date(proposalFormData.validUntil).toISOString()
          : null,
        status: proposalFormData.status,
        clientAccount: proposalFormData.clientAccount,
        deal: proposalFormData.deal || null,
        sentToContact: proposalFormData.sentToContact || null,
      };

      await proposalService.create(proposalData);
      await fetchProposals();

      setShowAddProposalModal(false);
      setProposalFormData({
        title: "",
        proposalContent: "",
        validUntil: "",
        status: "DRAFT",
        clientAccount: "",
        deal: "",
        sentToContact: "",
      });
      alert("Proposal created successfully!");
    } catch (error) {
      console.error("Error creating proposal:", error);
      alert(`Failed to create proposal: ${error.message || "Unknown error"}`);
    }
  };

  // Handle update proposal
  const handleUpdateProposal = async (e) => {
    e.preventDefault();
    if (!proposalToEdit) return;

    if (!proposalFormData.title.trim()) {
      alert("Proposal title is required");
      return;
    }
    if (!proposalFormData.proposalContent.trim()) {
      alert("Proposal content is required");
      return;
    }
    if (!proposalFormData.clientAccount) {
      alert("Client account is required");
      return;
    }

    try {
      setIsUpdating(true);
      const proposalData = {
        title: proposalFormData.title.trim(),
        proposalContent: proposalFormData.proposalContent.trim(),
        validUntil: proposalFormData.validUntil
          ? new Date(proposalFormData.validUntil).toISOString()
          : null,
        status: proposalFormData.status,
        clientAccount: proposalFormData.clientAccount,
        deal: proposalFormData.deal || null,
        sentToContact: proposalFormData.sentToContact || null,
      };

      await proposalService.update(
        proposalToEdit.id || proposalToEdit.documentId,
        proposalData
      );
      await fetchProposals();

      setShowEditModal(false);
      setProposalToEdit(null);
      setProposalFormData({
        title: "",
        proposalContent: "",
        validUntil: "",
        status: "DRAFT",
        clientAccount: "",
        deal: "",
        sentToContact: "",
      });
      alert("Proposal updated successfully!");
    } catch (error) {
      console.error("Error updating proposal:", error);
      alert(`Failed to update proposal: ${error.message || "Unknown error"}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete proposal
  const handleDeleteProposal = async () => {
    if (!proposalToDelete) return;

    try {
      setIsDeleting(true);
      await proposalService.delete(
        proposalToDelete.id || proposalToDelete.documentId
      );
      await fetchProposals();
      setShowDeleteModal(false);
      setProposalToDelete(null);
      alert("Proposal deleted successfully!");
    } catch (error) {
      console.error("Error deleting proposal:", error);
      alert(`Failed to delete proposal: ${error.message || "Unknown error"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Tab configuration
  const tabsConfig = [
    { key: "all", label: "All Proposals", count: stats.total || 0 },
    { key: "DRAFT", label: "Draft", count: stats.byStatus?.DRAFT || 0 },
    { key: "SENT", label: "Sent", count: stats.byStatus?.SENT || 0 },
    {
      key: "ACCEPTED",
      label: "Accepted",
      count: stats.byStatus?.ACCEPTED || 0,
    },
    {
      key: "REJECTED",
      label: "Rejected",
      count: stats.byStatus?.REJECTED || 0,
    },
    {
      key: "EXPIRED",
      label: "Expired",
      count: stats.byStatus?.EXPIRED || 0,
    },
  ];

  // KPI stats
  const statusStats = [
    {
      label: "Total",
      count: stats.total || 0,
      icon: FileText,
      color: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      label: "Draft",
      count: stats.byStatus?.DRAFT || 0,
      icon: FileCheck,
      color: "bg-gray-50",
      iconColor: "text-gray-600",
      borderColor: "border-gray-200",
    },
    {
      label: "Sent",
      count: stats.byStatus?.SENT || 0,
      icon: Send,
      color: "bg-yellow-50",
      iconColor: "text-yellow-600",
      borderColor: "border-yellow-200",
    },
    {
      label: "Accepted",
      count: stats.byStatus?.ACCEPTED || 0,
      icon: CheckCircle,
      color: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
    },
  ];

  // Table columns
  const proposalColumns = [
    {
      key: "title",
      label: "Proposal Title",
      render: (value, row) => (
        <div className="cursor-pointer hover:text-orange-500">
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">
            {row.clientAccount?.companyName || row.clientAccount?.name || "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "clientAccount",
      label: "Client Account",
      render: (value, row) => (
        <div className="text-gray-900">
          {row.clientAccount?.companyName || row.clientAccount?.name || "N/A"}
        </div>
      ),
    },
    {
      key: "deal",
      label: "Related Deal",
      render: (value, row) => (
        <div className="text-gray-900">{row.deal?.name || "—"}</div>
      ),
    },
    {
      key: "status",
      label: "STATUS",
      width: "140px",
      render: (_, row) => {
        const status = (row.status || "DRAFT")?.toLowerCase();
        const statusColors = {
          draft: {
            bg: "bg-gray-100",
            text: "text-gray-800",
            border: "border-gray-400",
            shadow: "shadow-gray-200",
          },
          sent: {
            bg: "bg-yellow-100",
            text: "text-yellow-800",
            border: "border-yellow-400",
            shadow: "shadow-yellow-200",
          },
          accepted: {
            bg: "bg-green-100",
            text: "text-green-800",
            border: "border-green-400",
            shadow: "shadow-green-200",
          },
          rejected: {
            bg: "bg-red-100",
            text: "text-red-800",
            border: "border-red-400",
            shadow: "shadow-red-200",
          },
          expired: {
            bg: "bg-red-100",
            text: "text-red-800",
            border: "border-red-400",
            shadow: "shadow-red-200",
          },
        };

        const colors = statusColors[status] || statusColors.draft;
        const displayStatus = row.status || "DRAFT";

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
      key: "validUntil",
      label: "Valid Until",
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? formatDate(value) : "—"}
        </span>
      ),
    },
    {
      key: "sentAt",
      label: "Sent Date",
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? formatDate(value) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (_, row) => (
        <div
          className="flex items-center gap-1 min-w-[120px]"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setProposalToView(row);
              setShowViewModal(true);
            }}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200"
            title="View Proposal"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setProposalToEdit(row);
              setProposalFormData({
                title: row.title || "",
                proposalContent: row.proposalContent || "",
                validUntil: row.validUntil
                  ? new Date(row.validUntil).toISOString().split("T")[0]
                  : "",
                status: row.status || "DRAFT",
                clientAccount: row.clientAccount?.id || "",
                deal: row.deal?.id || "",
                sentToContact: row.sentToContact?.id || "",
              });
              setShowEditModal(true);
            }}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2 rounded-lg transition-all duration-200"
            title="Edit Proposal"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setProposalToDelete(row);
              setShowDeleteModal(true);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
            title="Delete Proposal"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (error && proposals.length === 0) {
    return (
      <div className="p-4 space-y-4 bg-white min-h-screen">
        <PageHeader
          title="Proposals"
          subtitle="Manage all client proposals"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Clients", href: "/clients" },
            { label: "Proposals", href: "/clients/proposals" },
          ]}
        />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-4 bg-white min-h-screen">
        {/* Page Header */}
        <PageHeader
          title="Proposals"
          subtitle="Manage and track all client proposals"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Clients", href: "/clients" },
            { label: "Proposals", href: "/clients/proposals" },
          ]}
          showActions={true}
          onAddClick={() => setShowAddProposalModal(true)}
        />

        <div className="space-y-4">
          {/* Stats Overview */}
          <ProposalsKPIs statusStats={statusStats} />

          {/* Tabs and Filters */}
          <ProposalsTabs
            tabItems={tabsConfig}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeView={activeView}
            setActiveView={setActiveView}
            onFilterClick={() => {}}
            onAddClick={() => setShowAddProposalModal(true)}
            onExportClick={() => {}}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {/* Single Horizontal Scroll Container */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-gray-600">Loading proposals...</span>
              </div>
            ) : (
              <ProposalsListView
                filteredProposals={sortedProposals}
                proposalColumnsTable={proposalColumns}
                selectedProposals={selectedProposals}
                setSelectedProposals={setSelectedProposals}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAddClick={() => setShowAddProposalModal(true)}
                onRowClick={(row) => {
                  setProposalToView(row);
                  setShowViewModal(true);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add Proposal Modal */}
      <AddProposalModal
        isOpen={showAddProposalModal}
        onClose={() => {
          setShowAddProposalModal(false);
          setProposalFormData({
            title: "",
            proposalContent: "",
            validUntil: "",
            status: "DRAFT",
            clientAccount: "",
            deal: "",
            sentToContact: "",
          });
        }}
        onSubmit={handleCreateProposal}
        proposalFormData={proposalFormData}
        setProposalFormData={setProposalFormData}
        clientAccounts={clientAccounts}
        deals={deals}
        isSubmitting={false}
      />

      {/* View Proposal Modal */}
      <ViewProposalModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setProposalToView(null);
        }}
        proposal={proposalToView}
      />

      {/* Edit Proposal Modal */}
      <EditProposalModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setProposalToEdit(null);
          setProposalFormData({
            title: "",
            proposalContent: "",
            validUntil: "",
            status: "DRAFT",
            clientAccount: "",
            deal: "",
            sentToContact: "",
          });
        }}
        onSubmit={handleUpdateProposal}
        proposalFormData={proposalFormData}
        setProposalFormData={setProposalFormData}
        clientAccounts={clientAccounts}
        deals={deals}
        isSubmitting={isUpdating}
      />

      {/* Delete Proposal Modal */}
      <DeleteProposalModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProposalToDelete(null);
        }}
        onConfirm={handleDeleteProposal}
        proposal={proposalToDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
