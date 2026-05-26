"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  FileText,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  Archive,
} from "lucide-react";
import { Button } from "../../../components/ui";
import PageHeader from "../../../components/PageHeader";
import clientPortalDocumentService, {
  getDocumentAttachments,
  resolveMediaUrl,
} from "../../../lib/api/clientPortalDocumentService";
import clientAccountService from "../../../lib/api/clientAccountService";
import AddClientPortalDocumentModal from "./components/AddClientPortalDocumentModal";
import PortalDocumentsKPIs from "./components/PortalDocumentsKPIs";
import PortalDocumentsTabs from "./components/PortalDocumentsTabs";
import PortalDocumentsListView from "./components/PortalDocumentsListView";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const emptyForm = () => ({
  name: "",
  clientAccount: "",
  issueDate: new Date().toISOString().slice(0, 10),
  status: "ACTIVE",
  notes: "",
  files: [],
});

export default function ClientPortalDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeView, setActiveView] = useState("list");
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm());
  const [clientAccounts, setClientAccounts] = useState([]);

  useEffect(() => {
    fetchDocuments();
    fetchClientAccounts();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clientPortalDocumentService.getAll({
        populate: ["clientAccount", "createdBy", "documents"],
        "pagination[pageSize]": 1000,
        sort: "issueDate:desc",
      });
      const documentsData = response.data || [];
      setDocuments(documentsData);
      calculateStats(documentsData);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientAccounts = async () => {
    try {
      const response = await clientAccountService.getAll({
        "pagination[pageSize]": 1000,
      });
      const accounts = Array.isArray(response)
        ? response
        : response?.data || [];
      setClientAccounts(
        accounts.map((a) =>
          a.attributes ? { id: a.id, ...a.attributes } : a,
        ),
      );
    } catch {
      setClientAccounts([]);
    }
  };

  const calculateStats = (documentsData) => {
    const nextStats = {
      total: documentsData.length,
      byStatus: {
        DRAFT: 0,
        ACTIVE: 0,
        ARCHIVED: 0,
      },
      totalFiles: 0,
    };

    documentsData.forEach((doc) => {
      const status = doc.status || "DRAFT";
      nextStats.byStatus[status] = (nextStats.byStatus[status] || 0) + 1;
      nextStats.totalFiles += getDocumentAttachments(doc).length;
    });

    setStats(nextStats);
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesTab = activeTab === "all" || doc.status === activeTab;
    const matchesSearch =
      !searchQuery.trim() ||
      doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clientAccount?.companyName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      doc.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    return new Date(b.issueDate || b.createdAt) - new Date(a.issueDate || a.createdAt);
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.clientAccount || !formData.issueDate) {
      alert("Name, client account, and issue date are required");
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await clientPortalDocumentService.create({
        name: formData.name.trim(),
        clientAccount: formData.clientAccount,
        issueDate: new Date(formData.issueDate).toISOString(),
        status: formData.status,
        notes: formData.notes?.trim() || "",
      });

      if (formData.files?.length && created?.id) {
        await clientPortalDocumentService.uploadFiles(created.id, formData.files);
      }

      setShowAddModal(false);
      setFormData(emptyForm());
      await fetchDocuments();
      alert("Document created successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to create document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    try {
      await clientPortalDocumentService.delete(row.id);
      await fetchDocuments();
    } catch {
      alert("Failed to delete document");
    }
  };

  const tabsConfig = [
    { key: "all", label: "All Documents", count: stats.total || 0 },
    { key: "DRAFT", label: "Draft", count: stats.byStatus?.DRAFT || 0 },
    { key: "ACTIVE", label: "Active", count: stats.byStatus?.ACTIVE || 0 },
    { key: "ARCHIVED", label: "Archived", count: stats.byStatus?.ARCHIVED || 0 },
  ];

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
      label: "Active",
      count: stats.byStatus?.ACTIVE || 0,
      icon: CheckCircle,
      color: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
    },
    {
      label: "Draft",
      count: stats.byStatus?.DRAFT || 0,
      icon: Clock,
      color: "bg-yellow-50",
      iconColor: "text-yellow-600",
      borderColor: "border-yellow-200",
    },
    {
      label: "Archived",
      count: stats.byStatus?.ARCHIVED || 0,
      icon: Archive,
      color: "bg-red-50",
      iconColor: "text-red-600",
      borderColor: "border-red-200",
    },
  ];

  const documentColumns = [
    {
      key: "name",
      label: "Document Name",
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
      key: "files",
      label: "Files",
      render: (_, row) => {
        const files = getDocumentAttachments(row);
        return (
          <span className="font-semibold text-gray-900">
            {files.length} file{files.length !== 1 ? "s" : ""}
          </span>
        );
      },
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
          active: {
            bg: "bg-green-100",
            text: "text-green-800",
            border: "border-green-400",
            shadow: "shadow-green-200",
          },
          archived: {
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
              {displayStatus}
            </div>
          </div>
        );
      },
    },
    {
      key: "issueDate",
      label: "Issue Date",
      render: (value) => (
        <span className="text-sm text-gray-600">{formatDate(value)}</span>
      ),
    },
    {
      key: "notes",
      label: "Notes",
      render: (value) => (
        <span className="text-sm text-gray-600 line-clamp-1">
          {value || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (_, row) => {
        const files = getDocumentAttachments(row);
        const firstUrl = files[0] ? resolveMediaUrl(files[0].url) : null;
        return (
          <div
            className="flex items-center gap-1 min-w-[120px]"
            onClick={(e) => e.stopPropagation()}
          >
            {firstUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(firstUrl, "_blank");
                }}
                className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 p-2 rounded-lg transition-all duration-200"
                title="Download Document"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
              title="Delete Document"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (error && documents.length === 0) {
    return (
      <div className="p-4 space-y-4 bg-white min-h-screen">
        <PageHeader
          title="Client Portal Documents"
          subtitle="Upload and manage documents visible to client accounts"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Clients", href: "/clients" },
            { label: "Portal Documents", href: "/clients/portal-documents" },
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
        <PageHeader
          title="Client Portal Documents"
          subtitle="Upload and manage documents visible to client accounts"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Clients", href: "/clients" },
            { label: "Portal Documents", href: "/clients/portal-documents" },
          ]}
          showActions={true}
          onAddClick={() => setShowAddModal(true)}
        />

        <div className="space-y-4">
          <PortalDocumentsKPIs statusStats={statusStats} />

          <PortalDocumentsTabs
            tabItems={tabsConfig}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeView={activeView}
            setActiveView={setActiveView}
            onAddClick={() => setShowAddModal(true)}
            onExportClick={() => {}}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-gray-600">Loading documents...</span>
              </div>
            ) : (
              <PortalDocumentsListView
                filteredDocuments={sortedDocuments}
                documentColumnsTable={documentColumns}
                selectedDocuments={selectedDocuments}
                setSelectedDocuments={setSelectedDocuments}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAddClick={() => setShowAddModal(true)}
                onRowClick={() => {}}
              />
            )}
          </div>
        </div>
      </div>

      <AddClientPortalDocumentModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData(emptyForm());
        }}
        onSubmit={handleCreate}
        formData={formData}
        setFormData={setFormData}
        clientAccounts={clientAccounts}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
