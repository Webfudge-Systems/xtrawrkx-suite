"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Activity,
  DollarSign,
  FileText,
  TrendingUp,
  Calendar,
  MapPin,
  Globe,
  Phone,
  Mail,
  Edit,
  Share,
  Download,
  MoreHorizontal,
  Plus,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Briefcase,
  PieChart,
  Star,
  ArrowRight,
  UserCircle,
  User,
  Award,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Card,
  Badge,
  Avatar,
  Button,
  Table,
  Select,
} from "../../../../components/ui";
import PageHeader from "../../../../components/PageHeader";
import ActivitiesPanel from "../../../../components/activities/ActivitiesPanel";
import clientAccountService from "../../../../lib/api/clientAccountService";
import contactService from "../../../../lib/api/contactService";
import activityService from "../../../../lib/api/activityService";
import dealService from "../../../../lib/api/dealService";
import clientPortalDocumentService, {
  getDocumentAttachments,
  resolveMediaUrl,
} from "../../../../lib/api/clientPortalDocumentService";
import AddClientPortalDocumentModal from "../../portal-documents/components/AddClientPortalDocumentModal";
import projectService from "../../../../lib/api/projectService";
import strapiClient from "../../../../lib/strapiClient";
import { useAuth } from "../../../../contexts/AuthContext";
import authService from "../../../../lib/authService";
import DedicatedPocCard from "../../../../components/clients/DedicatedPocCard";
import AssignPocDrawer from "../../../../components/clients/AssignPocDrawer";

const ClientAccountDetailPage = ({ params }) => {
  const router = useRouter();
  const { id } = params;
  const { user } = useAuth();

  const [account, setAccount] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [portalDocuments, setPortalDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [contactsLoading, setContactsLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [communityMemberships, setCommunityMemberships] = useState([]);
  const [communitySubmissions, setCommunitySubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAssignDrawer, setShowAssignDrawer] = useState(false);
  const [assigningPoc, setAssigningPoc] = useState(false);
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [isSubmittingDocument, setIsSubmittingDocument] = useState(false);
  const [documentFormData, setDocumentFormData] = useState({
    name: "",
    clientAccount: "",
    issueDate: new Date().toISOString().slice(0, 10),
    status: "ACTIVE",
    notes: "",
    files: [],
  });

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

  useEffect(() => {
    if (id) {
      fetchAccountDetails();
    }
  }, [id]);

  // Fetch deals when deals tab is active
  useEffect(() => {
    if (activeTab === "deals" && account) {
      // Use id or documentId from account
      const accountId = account.id || account.documentId || account;
      if (accountId) {
        fetchDeals(accountId);
      }
    }
  }, [activeTab, account]);

  // Fetch documents when documents tab is active
  useEffect(() => {
    if (activeTab === "documents" && account?.id) {
      fetchPortalDocuments(account.id);
    }
  }, [activeTab, account?.id]);

  // Fetch projects when projects tab is active
  useEffect(() => {
    if (activeTab === "projects" && account?.id) {
      fetchProjects(account.id);
    }
  }, [activeTab, account?.id]);

  // Fetch communities when communities tab is active
  useEffect(() => {
    const accountKey = account?.id || account?.documentId;
    if (activeTab === "communities" && accountKey) {
      fetchCommunities(accountKey);
    }
  }, [activeTab, account?.id, account?.documentId]);

  // Fetch users for assignment
  useEffect(() => {
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
            populate: "primaryRole,userRoles,department,avatar",
          };
          const response = await strapiClient.getXtrawrkxUsers(queryParams);
          const usersData = response?.data || [];
          if (Array.isArray(usersData)) {
            const extracted = usersData.map((u) =>
              u.attributes ? { id: u.id, documentId: u.id, ...u.attributes } : u
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
      } catch (e) {
        console.error("Error fetching users:", e);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    if (isAdmin()) fetchUsers();
  }, [user]);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);

      // Fetch account data first with error handling
      let accountData;
      try {
        accountData = await clientAccountService.getById(id);
        setAccount(accountData);

        // Set initial community data if available
        if (accountData?.communityMemberships) {
          setCommunityMemberships(
            Array.isArray(accountData.communityMemberships)
              ? accountData.communityMemberships
              : []
          );
        }
        if (accountData?.communitySubmissions) {
          setCommunitySubmissions(
            Array.isArray(accountData.communitySubmissions)
              ? accountData.communitySubmissions
              : []
          );
        }
      } catch (accountError) {
        console.error("Failed to fetch account:", accountError);
        setError(
          `Account with ID ${id} not found. Please check if the account exists.`
        );
        return;
      }

      // Fetch related data with error handling
      const [contactsData, activitiesData, healthData] =
        await Promise.allSettled([
          contactService
            .getByClientAccount(id, {
              pagination: { pageSize: 50 },
            })
            .catch((err) => {
              console.warn("Failed to fetch contacts:", err);
              return { data: [] };
            }),
          activityService
            .getByClientAccount(id, {
              pagination: { pageSize: 50 },
            })
            .catch((err) => {
              console.warn("Failed to fetch activities:", err);
              return { data: [] };
            }),
          clientAccountService.getHealthDetails(id).catch((err) => {
            console.warn("Failed to fetch health details:", err);
            return {};
          }),
        ]);

      // Handle settled promises
      setContacts(
        contactsData.status === "fulfilled"
          ? contactsData.value?.data || []
          : []
      );
      setActivities(
        activitiesData.status === "fulfilled"
          ? activitiesData.value?.data || []
          : []
      );

      // Fetch deals when account is loaded
      const accountId = accountData?.id || accountData?.documentId;
      if (accountId) {
        await fetchDeals(accountId);
      }

      // Projects will be fetched when projects tab is active via useEffect
      setProjects([]);

      // Documents loaded when documents tab is active
      setPortalDocuments([]);
    } catch (err) {
      console.error("Error fetching account details:", err);
      setError("Failed to load account details");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async (accountId) => {
    try {
      setDealsLoading(true);

      // Ensure we use the correct ID format (id or documentId)
      const accountIdToUse =
        accountId?.id || accountId?.documentId || accountId;

      const response = await dealService.getByClientAccount(accountIdToUse);

      // Handle different response structures
      const dealsData = response?.data || response || [];

      // Transform Strapi data to flatten attributes structure
      const transformedDeals = (Array.isArray(dealsData) ? dealsData : []).map(
        (deal) => {
          const dealData = deal.attributes || deal;
          return {
            id: deal.id || deal.documentId,
            name: dealData.name || dealData.title || "",
            value: parseFloat(dealData.value) || 0,
            stage: dealData.stage || "", // Keep original stage value (CLOSED_WON, etc.)
            probability: dealData.probability || 0,
            closeDate: dealData.closeDate || null,
            description: dealData.description || "",
            leadCompany: dealData.leadCompany || deal.leadCompany,
            clientAccount: dealData.clientAccount || deal.clientAccount,
            contact: dealData.contact || deal.contact,
            assignedTo: dealData.assignedTo || deal.assignedTo,
            createdAt: dealData.createdAt || deal.createdAt,
            updatedAt: dealData.updatedAt || deal.updatedAt,
          };
        }
      );

      setDeals(transformedDeals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      setDeals([]);
    } finally {
      setDealsLoading(false);
    }
  };

  const handleAddDeal = () => {
    // Navigate to new deal page with client account pre-selected
    const accountId = account?.id || account?.documentId || id;
    router.push(`/sales/deals/new?clientAccount=${accountId}`);
  };

  const dealColumns = [
    {
      key: "name",
      label: "Deal Name",
      render: (value, row) => {
        // Format stage text for display under deal name
        const formatStage = (stage) => {
          const stageMap = {
            DISCOVERY: "Discovery",
            PROPOSAL: "Proposal",
            NEGOTIATION: "Negotiation",
            CLOSED_WON: "Closed Won",
            CLOSED_LOST: "Closed Lost",
            discovery: "Discovery",
            proposal: "Proposal",
            negotiation: "Negotiation",
            won: "Won",
            lost: "Lost",
          };
          return (
            stageMap[stage] || stageMap[stage?.toUpperCase()] || stage || ""
          );
        };

        return (
          <div
            className="cursor-pointer hover:text-orange-500"
            onClick={() => router.push(`/sales/deals/${row.id}`)}
          >
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">
              {formatStage(row.stage)}
            </div>
          </div>
        );
      },
    },
    {
      key: "value",
      label: "Value",
      render: (value) => (
        <span className="font-semibold text-gray-900">₹{value}K</span>
      ),
    },
    {
      key: "stage",
      label: "Stage",
      render: (value, row) => {
        // Handle both flat and Strapi attributes structure
        const stageValue = value || row?.stage || row?.attributes?.stage || "";

        // Map Strapi stage values to Badge variants and format text
        const stageMap = {
          DISCOVERY: { variant: "primary", label: "Discovery" },
          PROPOSAL: { variant: "warning", label: "Proposal" },
          NEGOTIATION: { variant: "warning", label: "Negotiation" },
          CLOSED_WON: { variant: "success", label: "Closed Won" },
          CLOSED_LOST: { variant: "error", label: "Closed Lost" },
          // Handle lowercase variations
          discovery: { variant: "primary", label: "Discovery" },
          proposal: { variant: "warning", label: "Proposal" },
          negotiation: { variant: "warning", label: "Negotiation" },
          won: { variant: "success", label: "Won" },
          lost: { variant: "error", label: "Lost" },
          // Handle legacy values
          Prospecting: { variant: "primary", label: "Prospecting" },
          Qualification: { variant: "warning", label: "Qualification" },
          "Closed Won": { variant: "success", label: "Closed Won" },
          "Closed Lost": { variant: "error", label: "Closed Lost" },
        };

        const stageInfo = stageMap[stageValue] ||
          stageMap[stageValue?.toUpperCase()] || {
            variant: "gray",
            label: stageValue || "Unknown",
          };

        return <Badge variant={stageInfo.variant}>{stageInfo.label}</Badge>;
      },
    },
    {
      key: "probability",
      label: "Probability",
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-orange-500 h-1.5 rounded-full"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-900">{value}%</span>
        </div>
      ),
    },
    {
      key: "closeDate",
      label: "Close Date",
      render: (value) => <span className="text-sm text-gray-600">{value}</span>,
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
              router.push(`/sales/deals/${row.id}`);
            }}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200"
            title="View Deal"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/sales/deals/${row.id}/edit`);
            }}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2 rounded-lg transition-all duration-200"
            title="Edit Deal"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const fetchPortalDocuments = async (accountId) => {
    try {
      setDocumentsLoading(true);
      const response = await clientPortalDocumentService.getByClientAccount(
        accountId
      );
      setPortalDocuments(response.data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setPortalDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const fetchProjects = async (accountId) => {
    const accountIdToUse = accountId?.id || accountId?.documentId || accountId;

    try {
      setProjectsLoading(true);

      // Fetch all projects and filter by clientAccount client-side
      // This is more reliable than server-side filtering until the relation is fully set up
      const allProjects = await projectService.getAll({
        pageSize: 100,
        populate: ["projectManager", "teamMembers", "account", "clientAccount"],
      });

      // Log the first project's full structure to debug
      if (allProjects?.data && allProjects.data.length > 0) {
      }


      // Filter projects by clientAccount ID
      const projectsData = allProjects?.data || [];

      const filteredProjects = projectsData.filter((project) => {
        const projectData = project.attributes || project;

        // Check direct clientAccount relation - handle multiple possible structures
        let projectClientAccount = null;
        let projectClientAccountId = null;

        // Try different ways to access clientAccount
        if (projectData.clientAccount) {
          if (projectData.clientAccount.attributes) {
            projectClientAccount = projectData.clientAccount.attributes;
            projectClientAccountId =
              projectClientAccount.id || projectClientAccount.documentId;
          } else if (
            projectData.clientAccount.id ||
            projectData.clientAccount.documentId
          ) {
            projectClientAccount = projectData.clientAccount;
            projectClientAccountId =
              projectClientAccount.id || projectClientAccount.documentId;
          } else if (
            typeof projectData.clientAccount === "number" ||
            typeof projectData.clientAccount === "string"
          ) {
            // clientAccount might be just an ID
            projectClientAccountId = projectData.clientAccount;
          }
        }

        // Debug logging for each project

        // If clientAccount is null or undefined, skip this project
        if (!projectClientAccountId) {
          return false;
        }

        // Normalize IDs for comparison
        const accountIdNum =
          typeof accountIdToUse === "string"
            ? parseInt(accountIdToUse, 10)
            : accountIdToUse;
        const projectClientAccountIdNum =
          typeof projectClientAccountId === "string"
            ? parseInt(projectClientAccountId, 10)
            : projectClientAccountId;

        // Try multiple comparison methods
        const matches =
          projectClientAccountIdNum === accountIdNum ||
          projectClientAccountId?.toString() === accountIdToUse?.toString() ||
          projectClientAccountId === accountIdToUse ||
          projectClientAccountId === parseInt(accountIdToUse) ||
          parseInt(projectClientAccountId) === parseInt(accountIdToUse);

        if (matches) {
        } else {
        }

        return matches;
      });


      // Transform projects to match UI format
      const transformedProjects = filteredProjects.map((project) => {
        const projectData = project.attributes || project;
        const projectManager =
          projectData.projectManager?.attributes || projectData.projectManager;

        // Calculate progress from tasks or use provided progress
        const progress = projectData.progress || 0;

        return {
          id: project.id || project.documentId,
          slug: projectData.slug || null,
          name: projectData.name || "Unnamed Project",
          status: projectData.status || "PLANNING",
          progress: progress,
          startDate: projectData.startDate || null,
          endDate: projectData.endDate || null,
          manager: projectManager
            ? `${projectManager.firstName || ""} ${
                projectManager.lastName || ""
              }`.trim() ||
              projectManager.username ||
              "Unassigned"
            : "Unassigned",
          description: projectData.description || "",
          budget: projectData.budget || 0,
          spent: projectData.spent || 0,
        };
      });

      setProjects(transformedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      // Final fallback: get all projects and filter client-side by any matching criteria
      try {
        const allProjects = await projectService.getAll({
          pageSize: 100,
          populate: [
            "projectManager",
            "teamMembers",
            "account",
            "clientAccount",
          ],
        });

        const projectsData = allProjects?.data || [];

        // Get client account data for filtering
        const clientAccountData = await clientAccountService.getById(
          accountIdToUse
        );
        const companyName = clientAccountData?.companyName;

        // Filter projects by:
        // 1. Direct clientAccount relation match
        // 2. Account company name match (if account was converted from client account)
        const filteredProjects = projectsData.filter((project) => {
          const projectData = project.attributes || project;

          // Check direct clientAccount relation
          const projectClientAccount =
            projectData.clientAccount?.attributes || projectData.clientAccount;
          const projectClientAccountId =
            projectClientAccount?.id || projectClientAccount?.documentId;
          if (projectClientAccountId === accountIdToUse) {
            return true;
          }

          // Check account company name match
          if (companyName) {
            const account =
              projectData.account?.attributes || projectData.account;
            const accountCompanyName = account?.companyName;
            if (accountCompanyName === companyName) {
              return true;
            }
          }

          return false;
        });

        const transformedProjects = filteredProjects.map((project) => {
          const projectData = project.attributes || project;
          const projectManager =
            projectData.projectManager?.attributes ||
            projectData.projectManager;

          return {
            id: project.id || project.documentId,
            slug: projectData.slug || null,
            name: projectData.name || "Unnamed Project",
            status: projectData.status || "PLANNING",
            progress: projectData.progress || 0,
            startDate: projectData.startDate || null,
            endDate: projectData.endDate || null,
            manager: projectManager
              ? `${projectManager.firstName || ""} ${
                  projectManager.lastName || ""
                }`.trim() ||
                projectManager.username ||
                "Unassigned"
              : "Unassigned",
            description: projectData.description || "",
            budget: projectData.budget || 0,
            spent: projectData.spent || 0,
          };
        });

        setProjects(transformedProjects);
      } catch (fallbackError) {
        console.error("Error in final fallback project fetch:", fallbackError);
        setProjects([]);
      }
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchCommunities = async (accountId) => {
    try {
      setCommunitiesLoading(true);

      const idParam = encodeURIComponent(String(accountId));

      // Strapi 5 REST relation filters return 400; use custom list-for-client routes.
      const membershipUrl = `/community-memberships/list-for-client?clientAccountId=${idParam}&pageSize=100`;
      const submissionUrl = `/community-submissions/list-for-client?clientAccountId=${idParam}&pageSize=100`;

      // Fetch community memberships and submissions
      const [membershipsResponse, submissionsResponse] =
        await Promise.allSettled([
          strapiClient
            .request(membershipUrl, {
              method: "GET",
            })
            .catch(() => ({ data: [] })),
          strapiClient
            .request(submissionUrl, {
              method: "GET",
            })
            .catch(() => ({ data: [] })),
        ]);

      const memberships =
        membershipsResponse.status === "fulfilled"
          ? membershipsResponse.value?.data || []
          : [];
      const submissions =
        submissionsResponse.status === "fulfilled"
          ? submissionsResponse.value?.data || []
          : [];

      // Handle Strapi response structure (attributes pattern)
      const processedMemberships = memberships.map((m) => ({
        id: m.id ?? m.documentId,
        ...(m.attributes || m),
      }));
      const processedSubmissions = submissions.map((s) => ({
        id: s.id ?? s.documentId,
        ...(s.attributes || s),
      }));

      setCommunityMemberships(processedMemberships);
      setCommunitySubmissions(processedSubmissions);
    } catch (error) {
      console.error("Error fetching communities:", error);
      // Fallback: use data from account if available
      if (account?.communityMemberships) {
        setCommunityMemberships(account.communityMemberships);
      } else {
        setCommunityMemberships([]);
      }
      if (account?.communitySubmissions) {
        setCommunitySubmissions(account.communitySubmissions);
      } else {
        setCommunitySubmissions([]);
      }
    } finally {
      setCommunitiesLoading(false);
    }
  };

  const handleCreateProject = () => {
    // Navigate to PM dashboard to create a new project
    // Or open a create project modal
    const accountId = account?.id || account?.documentId || id;
    // Determine PM dashboard URL based on environment
    const isProduction =
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";
    const pmDashboardBaseUrl = isProduction
      ? "https://pm.xtrawrkx.com"
      : "http://localhost:3005";
    // Navigate to PM dashboard with pre-filled account
    window.open(
      `${pmDashboardBaseUrl}/projects/add?account=${accountId}`,
      "_blank"
    );
  };

  const handleAddDocument = () => {
    setDocumentFormData((prev) => ({
      ...prev,
      clientAccount: String(account?.id || ""),
    }));
    setShowAddDocumentModal(true);
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!documentFormData.name.trim()) {
      alert("Document name is required");
      return;
    }
    if (!documentFormData.issueDate) {
      alert("Issue date is required");
      return;
    }

    try {
      setIsSubmittingDocument(true);
      const created = await clientPortalDocumentService.create({
        name: documentFormData.name.trim(),
        clientAccount: account.id,
        issueDate: new Date(documentFormData.issueDate).toISOString(),
        status: documentFormData.status,
        notes: documentFormData.notes?.trim() || "",
      });

      if (documentFormData.files?.length && created?.id) {
        await clientPortalDocumentService.uploadFiles(
          created.id,
          documentFormData.files
        );
      }

      await fetchPortalDocuments(account.id);
      setShowAddDocumentModal(false);
      setDocumentFormData({
        name: "",
        clientAccount: String(account?.id || ""),
        issueDate: new Date().toISOString().slice(0, 10),
        status: "ACTIVE",
        notes: "",
        files: [],
      });
    } catch (error) {
      console.error("Error creating document:", error);
      alert(error.message || "Failed to create document");
    } finally {
      setIsSubmittingDocument(false);
    }
  };

  const documentColumns = [
    {
      key: "name",
      label: "Name",
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const variants = {
          DRAFT: "gray",
          ACTIVE: "success",
          ARCHIVED: "warning",
        };
        const labels = {
          DRAFT: "Draft",
          ACTIVE: "Active",
          ARCHIVED: "Archived",
        };
        return (
          <Badge variant={variants[value] || "gray"}>
            {labels[value] || value}
          </Badge>
        );
      },
    },
    {
      key: "issueDate",
      label: "Issue Date",
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? new Date(value).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "notes",
      label: "Notes",
      render: (value) => (
        <span className="text-sm text-gray-600 line-clamp-2 max-w-xs">
          {value || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const files = getDocumentAttachments(row);
        const firstUrl = files[0] ? resolveMediaUrl(files[0].url) : null;
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {firstUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(firstUrl, "_blank")}
                title="Download"
              >
                <Download className="w-4 h-4 text-pink-600" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (!window.confirm(`Delete "${row.name}"?`)) return;
                await clientPortalDocumentService.delete(row.id);
                await fetchPortalDocuments(account.id);
              }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleEdit = () => {
    router.push(`/clients/accounts/${id}/edit`);
  };

  const handleDelete = async () => {
    if (
      window.confirm("Are you sure you want to delete this client account?")
    ) {
      try {
        await clientAccountService.delete(id);
        router.push("/clients/accounts");
      } catch (err) {
        console.error("Error deleting account:", err);
        alert("Failed to delete account");
      }
    }
  };

  const handleSetPrimaryContact = async (contactId) => {
    try {
      setContactsLoading(true);

      const selectedContact = contacts.find((c) => c.id === contactId);
      
      // If already primary, demote to technical contact
      if (selectedContact?.role === "PRIMARY_CONTACT") {
        await contactService.update(contactId, { role: "TECHNICAL_CONTACT" });
        const contactsData = await contactService.getByClientAccount(id, {
          pagination: { pageSize: 50 },
        });
        setContacts(contactsData.data || []);
        alert("Contact role updated to Technical Contact");
        return;
      }

      // Otherwise, remove primary from others and set this one as primary
      const updatePromises = contacts.map(async (contact) => {
        if (contact.id !== contactId && contact.role === "PRIMARY_CONTACT") {
          return contactService.update(contact.id, {
            role: "TECHNICAL_CONTACT",
          });
        }
        return Promise.resolve();
      });

      // Wait for all role removals to complete
      await Promise.all(updatePromises);

      // Set the selected contact as primary
      await contactService.update(contactId, { role: "PRIMARY_CONTACT" });

      // Refresh contacts data
      const contactsData = await contactService.getByClientAccount(id, {
        pagination: { pageSize: 50 },
      });
      setContacts(contactsData.data || []);

      alert("Primary contact updated successfully!");
    } catch (error) {
      console.error("Error setting primary contact:", error);
      alert("Failed to update contact role");
    } finally {
      setContactsLoading(false);
    }
  };

  const handleRoleChange = async (contactId, newRole) => {
    try {
      setContactsLoading(true);

      // If changing to primary contact, remove primary from others
      if (newRole === "PRIMARY_CONTACT") {
        const updatePromises = contacts.map(async (contact) => {
          if (contact.id !== contactId && contact.role === "PRIMARY_CONTACT") {
            return contactService.update(contact.id, {
              role: "TECHNICAL_CONTACT",
            });
          }
          return Promise.resolve();
        });
        await Promise.all(updatePromises);
      }

      // Update the contact role
      await contactService.update(contactId, { role: newRole });

      // Refresh contacts data
      const contactsData = await contactService.getByClientAccount(id, {
        pagination: { pageSize: 50 },
      });
      setContacts(contactsData.data || []);
    } catch (error) {
      console.error("Error updating contact role:", error);
      alert("Failed to update contact role");
    } finally {
      setContactsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "CHURNED":
        return "bg-red-100 text-red-800";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800";
      case "REGISTERED":
        return "bg-blue-100 text-blue-800";
      case "COMMUNITY_MEMBER":
        return "bg-indigo-100 text-indigo-800";
      case "COMMUNITY_PAID":
        return "bg-emerald-100 text-emerald-800";
      case "COMMUNITY_NON_PAID":
        return "bg-cyan-100 text-cyan-800";
      case "LOST":
        return "bg-rose-100 text-rose-800";
      case "STOPPED":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getHealthScoreBg = (score) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    if (score >= 40) return "bg-orange-100";
    return "bg-red-100";
  };

  const getDealStageColor = (stage) => {
    switch (stage) {
      case "CLOSED_WON":
        return "bg-green-100 text-green-800";
      case "CLOSED_LOST":
        return "bg-red-100 text-red-800";
      case "NEGOTIATION":
        return "bg-blue-100 text-blue-800";
      case "PROPOSAL":
        return "bg-purple-100 text-purple-800";
      case "QUALIFICATION":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProjectStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
      case "ACTIVE":
        return "bg-blue-100 text-blue-800";
      case "PLANNED":
      case "PLANNING":
        return "bg-gray-100 text-gray-800";
      case "ON_HOLD":
      case "ONHOLD":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const projectColumns = [
    {
      key: "name",
      label: "Project Name",
      render: (value, row) => {
        const formatStatus = (status) => {
          const statusMap = {
            PLANNING: "Planning",
            IN_PROGRESS: "In Progress",
            COMPLETED: "Completed",
            ON_HOLD: "On Hold",
            CANCELLED: "Cancelled",
          };
          return (
            statusMap[status] ||
            statusMap[status?.toUpperCase()] ||
            status?.replace("_", " ") ||
            "Planning"
          );
        };

        return (
          <div
            className="cursor-pointer hover:text-orange-500"
            onClick={() => {
              const projectIdentifier = row.slug || row.id;
              if (projectIdentifier) {
                const isProduction =
                  typeof window !== "undefined" &&
                  window.location.hostname !== "localhost" &&
                  window.location.hostname !== "127.0.0.1";
                const pmDashboardBaseUrl = isProduction
                  ? "https://pm.xtrawrkx.com"
                  : "http://localhost:3005";
                window.open(
                  `${pmDashboardBaseUrl}/projects/${projectIdentifier}`,
                  "_blank"
                );
              }
            }}
          >
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">
              {formatStatus(row.status)}
            </div>
          </div>
        );
      },
    },
    {
      key: "manager",
      label: "Manager",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900">{value || "Unassigned"}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const statusValue = value || "PLANNING";
        const statusMap = {
          COMPLETED: { variant: "success", label: "Completed" },
          IN_PROGRESS: { variant: "info", label: "In Progress" },
          ACTIVE: { variant: "info", label: "Active" },
          PLANNING: { variant: "secondary", label: "Planning" },
          PLANNED: { variant: "secondary", label: "Planned" },
          ON_HOLD: { variant: "warning", label: "On Hold" },
          CANCELLED: { variant: "error", label: "Cancelled" },
        };

        const statusInfo = statusMap[statusValue] ||
          statusMap[statusValue?.toUpperCase()] || {
            variant: "secondary",
            label: statusValue?.replace("_", " ") || "Planning",
          };

        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
      },
    },
    {
      key: "progress",
      label: "Progress",
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-orange-500 h-1.5 rounded-full"
              style={{ width: `${value || 0}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-900 min-w-[35px]">
            {value || 0}%
          </span>
        </div>
      ),
    },
    {
      key: "budget",
      label: "Budget",
      render: (value, row) => (
        <div>
          {value > 0 ? (
            <>
              <span className="font-semibold text-gray-900">
                ₹{(value || 0).toLocaleString()}
              </span>
              {row.spent > 0 && (
                <div className="text-xs text-gray-500">
                  Spent: ₹{(row.spent || 0).toLocaleString()}
                </div>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-400">Not set</span>
          )}
        </div>
      ),
    },
    {
      key: "startDate",
      label: "Start Date",
      render: (value, row) => {
        if (!value)
          return <span className="text-sm text-gray-400">Not set</span>;
        return (
          <div>
            <span className="text-sm text-gray-900">
              {new Date(value).toLocaleDateString()}
            </span>
            {row.endDate && (
              <div className="text-xs text-gray-500">
                End: {new Date(row.endDate).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (_, row) => {
        const projectIdentifier = row.slug || row.id;
        return (
          <div
            className="flex items-center gap-1 min-w-[120px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (projectIdentifier) {
                  const isProduction =
                    typeof window !== "undefined" &&
                    window.location.hostname !== "localhost" &&
                    window.location.hostname !== "127.0.0.1";
                  const pmDashboardBaseUrl = isProduction
                    ? "https://pm.xtrawrkx.com"
                    : "http://localhost:3005";
                  window.open(
                    `${pmDashboardBaseUrl}/projects/${projectIdentifier}`,
                    "_blank"
                  );
                }
              }}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200"
              title="View Project"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const getActivityTypeColor = (type) => {
    switch (type) {
      case "CALL":
        return "bg-blue-100 text-blue-800";
      case "EMAIL":
        return "bg-green-100 text-green-800";
      case "MEETING":
        return "bg-purple-100 text-purple-800";
      case "NOTE":
        return "bg-gray-100 text-gray-800";
      case "TASK":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInvoiceStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="p-4 space-y-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || (!loading && !account)) {
    return (
      <div className="bg-white min-h-screen">
        <div className="p-4 space-y-4">
          <div className="text-center py-12">
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Account Not Found
              </h2>
              <div className="text-red-600 mb-4">
                {error || `Account with ID ${id} could not be found.`}
              </div>
              <p className="text-gray-600 mb-6">
                This account may have been deleted, or you may not have
                permission to view it.
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push("/clients/accounts")}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                Back to Accounts
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalDealValue = deals.reduce(
    (sum, deal) => sum + (deal.value || 0),
    0
  );
  const wonDeals = deals.filter((deal) => deal.stage === "CLOSED_WON");
  const activeDealValue = deals
    .filter((deal) => !["CLOSED_WON", "CLOSED_LOST"].includes(deal.stage))
    .reduce((sum, deal) => sum + (deal.value || 0), 0);

  // Contact columns configuration for table
  const contactColumns = [
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
            className="w-10 h-10"
          />
          <div>
            <div className="flex items-center gap-2">
              <div className="font-medium text-gray-900">
                {contact.firstName} {contact.lastName}
              </div>
              {contact.role === "PRIMARY_CONTACT" && (
                <Badge variant="success" className="text-xs">
                  Primary
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-500">{contact.title}</div>
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
        <div className="min-w-[180px]">
          <select
            value={contact.role || "TECHNICAL_CONTACT"}
            onChange={(e) => handleRoleChange(contact.id, e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
            style={{
              color:
                contact.role === "PRIMARY_CONTACT"
                  ? "#10b981"
                  : contact.role === "DECISION_MAKER"
                  ? "#f59e0b"
                  : contact.role === "INFLUENCER"
                  ? "#3b82f6"
                  : "#6b7280",
              fontWeight: "500",
            }}
          >
            <option value="PRIMARY_CONTACT">Primary Contact</option>
            <option value="DECISION_MAKER">Decision Maker</option>
            <option value="INFLUENCER">Influencer</option>
            <option value="TECHNICAL_CONTACT">Technical Contact</option>
            <option value="GATEKEEPER">Gatekeeper</option>
          </select>
        </div>
      ),
    },
    {
      key: "portal_role",
      label: "PORTAL ROLE",
      render: (_, contact) => {
        const portalRoleRaw =
          contact?.portalAccess?.roleName ||
          (contact?.role === "PRIMARY_CONTACT" ? "ADMIN" : "MEMBER");
        const portalRole = String(portalRoleRaw).replaceAll("_", " ");
        return (
          <div className="min-w-[150px]">
            <Badge variant="secondary" className="text-xs">
              {portalRole}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "STATUS",
      render: (_, contact) => (
        <div className="min-w-[120px]">
          <Badge
            variant={
              contact.status === "ACTIVE"
                ? "success"
                : contact.status === "INACTIVE"
                ? "secondary"
                : "warning"
            }
          >
            {contact.status || "ACTIVE"}
          </Badge>
          {contact.leadCompany && (
            <div className="mt-1">
              <Badge variant="warning" className="text-xs">
                Lead Company
              </Badge>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "last_activity",
      label: "LAST ACTIVITY",
      render: (_, contact) => {
        const lastActivity =
          contact?.portalAccess?.lastLogin ||
          contact?.lastContactDate ||
          contact?.updatedAt;
        const recentlyUpdated = contact?.updatedAt
          ? Date.now() - new Date(contact.updatedAt).getTime() < 1000 * 60 * 60 * 24 * 3
          : false;
        return (
          <div className="min-w-[180px]">
            <div className="text-sm text-gray-900">
              {lastActivity ? new Date(lastActivity).toLocaleString() : "No activity"}
            </div>
            {recentlyUpdated && (
              <div className="mt-1">
                <Badge variant="warning" className="text-xs">
                  Recently Updated
                </Badge>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "",
      render: (_, contact) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/sales/contacts/${contact.id}`)}
            title="View Contact"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSetPrimaryContact(contact.id)}
            title={
              contact.role === "PRIMARY_CONTACT"
                ? "Remove Primary Contact"
                : "Set as Primary Contact"
            }
            className={
              contact.role === "PRIMARY_CONTACT"
                ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                : "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            }
          >
            <Star
              className={`w-4 h-4 ${
                contact.role === "PRIMARY_CONTACT" ? "fill-current" : ""
              }`}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/sales/contacts/${contact.id}/edit`)}
            title="Edit Contact"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const tabItems = [
    { key: "overview", label: "Overview" },
    { key: "contacts", label: "Contacts" },
    { key: "activities", label: "Activities" },
    { key: "deals", label: "Deals" },
    { key: "projects", label: "Projects" },
    { key: "documents", label: "Documents" },
    { key: "communities", label: "Communities" },
    { key: "meetings", label: "Meetings" },
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="p-4 space-y-4">
        <PageHeader
          title={
            account?.onboardingData?.signupCompany ||
            account?.onboardingData?.company ||
            account.companyName
          }
          subtitle={`Client Account • ${
            account.industry || "Industry not specified"
          } • ${account.type || "Customer"}`}
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Clients", href: "/clients" },
            { label: "Client Accounts", href: "/clients/accounts" },
            {
              label:
                account?.onboardingData?.signupCompany ||
                account?.onboardingData?.company ||
                account.companyName,
              href: `/clients/accounts/${id}`,
            },
          ]}
          showSearch={false}
          showActions={true}
          actions={[
            {
              label: "Edit",
              icon: Edit,
              onClick: handleEdit,
              variant: "primary",
            },
            {
              label: "Share",
              icon: Share,
              onClick: () => {},
              variant: "secondary",
            },
            {
              label: "Export",
              icon: Download,
              onClick: () => {},
              variant: "secondary",
            },
            {
              label: "Delete",
              icon: Trash2,
              onClick: handleDelete,
              variant: "danger",
            },
          ]}
        />

        {/* Account Header Card */}
        <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                <Building2 className="w-10 h-10 text-green-600" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {account.companyName}
                  </h1>
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                      account.status
                    )}`}
                  >
                    {account.status || "ACTIVE"}
                  </span>
                  {account.healthScore && (
                    <div
                      className={`flex items-center gap-1 px-3 py-1 rounded-full ${getHealthScoreBg(
                        account.healthScore
                      )}`}
                    >
                      <TrendingUp
                        className={`w-4 h-4 ${getHealthScoreColor(
                          account.healthScore
                        )}`}
                      />
                      <span
                        className={`text-sm font-semibold ${getHealthScoreColor(
                          account.healthScore
                        )}`}
                      >
                        {account.healthScore}% Health
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    <span>{account.industry || "Industry not specified"}</span>
                  </div>

                  {account.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{account.location}</span>
                    </div>
                  )}

                  {account.employees && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        {(() => {
                          const employees = account.employees;
                          const sizeMap = {
                            SIZE_1_10: "1-10 employees",
                            SIZE_11_50: "11-50 employees",
                            SIZE_51_200: "51-200 employees",
                            SIZE_201_500: "201-500 employees",
                            SIZE_501_1000: "501-1000 employees",
                            SIZE_1000_PLUS: "1000+ employees",
                          };
                          return sizeMap[employees] || `${employees} employees`;
                        })()}
                      </span>
                    </div>
                  )}

                  {account.founded && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Founded {account.founded}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600">
                  {account.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <a
                        href={`mailto:${account.email}`}
                        className="hover:text-orange-600 transition-colors"
                      >
                        {account.email}
                      </a>
                    </div>
                  )}

                  {account.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <a
                        href={`tel:${account.phone}`}
                        className="hover:text-orange-600 transition-colors"
                      >
                        {account.phone}
                      </a>
                    </div>
                  )}

                  {account.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <a
                        href={account.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-orange-600 transition-colors"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                ₹{totalDealValue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Deal Value</div>
              {account.conversionDate && (
                <div className="text-xs text-gray-500 mt-2">
                  Client since{" "}
                  {new Date(account.conversionDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Contacts
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {contacts.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Deals
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    deals.filter(
                      (deal) =>
                        !["CLOSED_WON", "CLOSED_LOST"].includes(deal.stage)
                    ).length
                  }
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Won Deals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {wonDeals.length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Projects
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    projects.filter(
                      (project) => project.status === "IN_PROGRESS"
                    ).length
                  }
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-2 shadow-lg">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab.key
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-transparent text-gray-700 hover:bg-white/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Company Information */}
                <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Company Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Industry
                      </label>
                      <span className="text-gray-900">
                        {account.industry || "Not specified"}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Company Type
                      </label>
                      <span className="text-gray-900">
                        {account.companyType === "startup-corporate"
                          ? "Startup and Corporates"
                          : account.companyType === "investor"
                          ? "Investors"
                          : account.companyType === "enablers-academia"
                          ? "Enablers & Academia"
                          : account.companyType || "Not specified"}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Sub-Type
                      </label>
                      <span className="text-gray-900">
                        {account.subType || "Not specified"}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Account Type
                      </label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          account.type === "CUSTOMER"
                            ? "bg-blue-100 text-blue-800"
                            : account.type === "PARTNER"
                            ? "bg-green-100 text-green-800"
                            : account.type === "VENDOR"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {account.type || "CUSTOMER"}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Company Size
                      </label>
                      <span className="text-gray-900">
                        {account.employees || "Not specified"}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Founded
                      </label>
                      <span className="text-gray-900">
                        {account.founded || "Not specified"}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Annual Revenue
                      </label>
                      <span className="text-gray-900">
                        {account.revenue
                          ? `₹${account.revenue.toLocaleString()}`
                          : "Not specified"}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Website
                      </label>
                      {account.website ? (
                        <a
                          href={account.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:text-orange-800 transition-colors flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3" />
                          {account.website}
                        </a>
                      ) : (
                        <span className="text-gray-900">Not provided</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Location
                      </label>
                      <span className="text-gray-900 flex items-center gap-1">
                        {account.location ? (
                          <>
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {account.location}
                          </>
                        ) : (
                          "Not specified"
                        )}
                      </span>
                    </div>

                    {account.interests && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Interests
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(account.interests) &&
                          account.interests.length > 0 ? (
                            account.interests.map((interest, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                              >
                                {interest}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">
                              No interests specified
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Client Since
                      </label>
                      <span className="text-gray-900">
                        {account.conversionDate
                          ? new Date(
                              account.conversionDate
                            ).toLocaleDateString()
                          : "Not specified"}
                      </span>
                    </div>
                  </div>

                  {/* Company Description */}
                  {account.description && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Company Description
                      </label>
                      <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">
                        {account.description}
                      </p>
                    </div>
                  )}

                  {/* Address Information */}
                  {(account.address ||
                    account.city ||
                    account.state ||
                    account.country) && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-600 mb-3">
                        Address Information
                      </label>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        {account.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-900">
                              {account.address}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-700 ml-6">
                          {account.city && <span>{account.city}</span>}
                          {account.state && <span>{account.state}</span>}
                          {account.zipCode && <span>{account.zipCode}</span>}
                          {account.country && <span>{account.country}</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Conversion History */}
                {account.convertedFromLead && (
                  <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Conversion History
                    </h3>

                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Converted from Lead Company
                          </h4>
                          <p className="text-sm text-gray-600">
                            Originally "{account.convertedFromLead.companyName}"
                            lead company
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Converted on{" "}
                            {new Date(
                              account.conversionDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {account.notes && (
                  <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Notes
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {account.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <DedicatedPocCard
                  account={account}
                  isAdmin={isAdmin()}
                  assigning={assigningPoc}
                  onAssign={() => setShowAssignDrawer(true)}
                  onChange={() => setShowAssignDrawer(true)}
                  onRemove={async () => {
                    if (!window.confirm("Remove the dedicated POC from this client?")) return;
                    try {
                      setAssigningPoc(true);
                      await clientAccountService.update(id, { accountManager: null });
                      await fetchAccountDetails();
                      window.dispatchEvent(
                        new CustomEvent("accountUpdated", { detail: { accountId: id } })
                      );
                    } catch (error) {
                      console.error("Error removing POC:", error);
                      alert("Failed to remove POC assignment.");
                    } finally {
                      setAssigningPoc(false);
                    }
                  }}
                />

                {/* Recent Activity */}
                <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Activity
                  </h3>

                  <div className="space-y-3">
                    {activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div
                          className={`p-1.5 rounded-lg ${getActivityTypeColor(
                            activity.activityType
                          )}`}
                        >
                          <Activity className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}

                    {activities.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No recent activities
                      </p>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                {(account.linkedIn || account.twitter) && (
                  <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Social Profiles
                    </h3>

                    <div className="space-y-2">
                      {account.linkedIn && (
                        <a
                          href={account.linkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4" />
                          </div>
                          LinkedIn Profile
                        </a>
                      )}

                      {account.twitter && (
                        <a
                          href={account.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-600 transition-colors"
                        >
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Globe className="w-4 h-4" />
                          </div>
                          Twitter Profile
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other tabs content would go here - contacts, activities, deals, projects, health */}
          {/* For brevity, I'll implement the key tabs */}

          {activeTab === "contacts" && (
            <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Contacts
                </h3>
                <Button
                  size="sm"
                  onClick={() => {}}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>
              {contactsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  <span className="ml-2 text-gray-600">
                    Loading contacts...
                  </span>
                </div>
              ) : contacts.length > 0 ? (
                <Table columns={contactColumns} data={contacts} />
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">👥</div>
                  <p className="text-gray-600">
                    No contacts found for this account
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Add contacts to start building relationships
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "activities" && account && (
            <ActivitiesPanel
              entityType="clientAccount"
              entityId={account.id}
              entityName={account.companyName || account.name}
              onActivityCreated={fetchAccountDetails}
            />
          )}

          {activeTab === "deals" && (
            <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Deals</h3>
                <Button
                  size="sm"
                  onClick={handleAddDeal}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Deal
                </Button>
              </div>
              {dealsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  <span className="ml-2 text-gray-600">Loading deals...</span>
                </div>
              ) : deals.length > 0 ? (
                <Table columns={dealColumns} data={deals} />
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">💼</div>
                  <p className="text-gray-600">
                    No deals found for this account
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Create deals to track opportunities
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "projects" && (
            <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Projects
                </h3>
                <Button
                  size="sm"
                  onClick={handleCreateProject}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </div>
              {projectsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  <span className="ml-2 text-gray-600">
                    Loading projects...
                  </span>
                </div>
              ) : projects.length > 0 ? (
                <Table columns={projectColumns} data={projects} />
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📁</div>
                  <p className="text-gray-600">
                    No projects found for this account
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Create projects to track work
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Documents
                </h3>
                <Button
                  size="sm"
                  onClick={handleAddDocument}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Document
                </Button>
              </div>
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  <span className="ml-2 text-gray-600">
                    Loading documents...
                  </span>
                </div>
              ) : portalDocuments.length > 0 ? (
                <Table columns={documentColumns} data={portalDocuments} />
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📄</div>
                  <p className="text-gray-600">
                    No documents for this account
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Add documents to share with the client portal
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "communities" && (
            <div className="space-y-6">
              {(() => {
                const selectedCommunities = Array.isArray(account?.selectedCommunities)
                  ? account.selectedCommunities
                  : [];
                const activeMemberships = communityMemberships.filter((membership) => {
                  const membershipData = membership.attributes || membership;
                  return membershipData.status === "ACTIVE";
                }).length;
                const pendingSubmissions = communitySubmissions.filter((submission) => {
                  const submissionData = submission.attributes || submission;
                  return (submissionData.status || "SUBMITTED") === "PENDING";
                }).length;

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-2xl bg-gradient-to-br from-white/80 to-white/50 backdrop-blur-xl border border-white/40 shadow-lg p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Selected
                            </p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                              {selectedCommunities.length}
                            </p>
                          </div>
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <UserCircle className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-gradient-to-br from-white/80 to-white/50 backdrop-blur-xl border border-white/40 shadow-lg p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Active Memberships
                            </p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                              {activeMemberships}
                            </p>
                          </div>
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-gradient-to-br from-white/80 to-white/50 backdrop-blur-xl border border-white/40 shadow-lg p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Pending Submissions
                            </p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                              {pendingSubmissions}
                            </p>
                          </div>
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div className="rounded-2xl bg-gradient-to-br from-white/75 to-white/45 backdrop-blur-xl border border-white/35 shadow-xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Selected Communities
                            </h3>
                            <p className="text-sm text-gray-500">
                              Chosen during onboarding
                            </p>
                          </div>
                        </div>

                        {selectedCommunities.length > 0 ? (
                          <div className="space-y-3">
                            {selectedCommunities.map((community, idx) => {
                              const code = String(community || "").toUpperCase();
                              const communityMeta = {
                                XEN: {
                                  name: "XEN",
                                  category: "Hardware & Automotive Startups",
                                  theme: "from-blue-50 to-cyan-50 border-blue-200",
                                  badge: "bg-blue-100 text-blue-700",
                                  iconBg: "from-blue-100 to-cyan-100 text-blue-700",
                                },
                                XEVFIN: {
                                  name: "XEV.FIN",
                                  category: "Finance & Investment",
                                  theme: "from-emerald-50 to-green-50 border-emerald-200",
                                  badge: "bg-emerald-100 text-emerald-700",
                                  iconBg: "from-emerald-100 to-green-100 text-emerald-700",
                                },
                                XEVTG: {
                                  name: "XEVTG",
                                  category: "Talent & Training",
                                  theme: "from-sky-50 to-cyan-50 border-sky-200",
                                  badge: "bg-sky-100 text-sky-700",
                                  iconBg: "from-sky-100 to-cyan-100 text-sky-700",
                                },
                                XDD: {
                                  name: "xD&D",
                                  category: "Drones and Designs",
                                  theme: "from-amber-50 to-yellow-50 border-amber-200",
                                  badge: "bg-amber-100 text-amber-700",
                                  iconBg: "from-amber-100 to-yellow-100 text-amber-700",
                                },
                              }[code] || {
                                name: code || "Community",
                                category: "Community",
                                theme: "from-purple-50 to-pink-50 border-purple-200",
                                badge: "bg-purple-100 text-purple-700",
                                iconBg: "from-purple-100 to-pink-100 text-purple-700",
                              };

                              return (
                                <div
                                  key={idx}
                                  className={`rounded-xl border bg-gradient-to-r px-4 py-4 ${communityMeta.theme}`}
                                >
                                  <div className="flex items-start gap-4">
                                    <div
                                      className={`w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-xs font-bold ${communityMeta.iconBg}`}
                                    >
                                      {code || "C"}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-[28px] leading-8 font-semibold text-gray-900 tracking-tight">
                                          {communityMeta.name}
                                        </p>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-0.5">
                                        {communityMeta.category}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-10">
                            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-700 font-medium">
                              No communities selected
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              This account has not selected communities yet.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl bg-gradient-to-br from-white/75 to-white/45 backdrop-blur-xl border border-white/35 shadow-xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                            <Award className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Community Memberships
                            </h3>
                            <p className="text-sm text-gray-500">
                              Membership status by community
                            </p>
                          </div>
                        </div>

                        {communitiesLoading ? (
                          <div className="flex items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                            <span className="ml-2 text-gray-600">
                              Loading memberships...
                            </span>
                          </div>
                        ) : communityMemberships.length > 0 ? (
                          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                            {communityMemberships.map((membership) => {
                              const membershipData = membership.attributes || membership;
                              const isActive = membershipData.status === "ACTIVE";
                              return (
                                <div
                                  key={membership.id}
                                  className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                          isActive
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-gray-100 text-gray-500"
                                        }`}
                                      >
                                        <Award className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">
                                          {membershipData.community}
                                        </p>
                                        {membershipData.joinedAt && (
                                          <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Joined{" "}
                                            {new Date(membershipData.joinedAt).toLocaleDateString()}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={isActive ? "success" : "secondary"}
                                        className="text-xs"
                                      >
                                        {membershipData.status || "UNKNOWN"}
                                      </Badge>
                                      {membershipData.membershipType && (
                                        <Badge
                                          variant={
                                            membershipData.membershipType === "PREMIUM"
                                              ? "warning"
                                              : "info"
                                          }
                                          className="text-xs"
                                        >
                                          {membershipData.membershipType}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-10">
                            <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-700 font-medium">
                              No memberships found
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Membership entries will appear here once created.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-white/75 to-white/45 backdrop-blur-xl border border-white/35 shadow-xl p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Community Submissions
                          </h3>
                          <p className="text-sm text-gray-500">
                            Application history and approval status
                          </p>
                        </div>
                      </div>

                      {communitiesLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                          <span className="ml-2 text-gray-600">
                            Loading submissions...
                          </span>
                        </div>
                      ) : communitySubmissions.length > 0 ? (
                        <div className="space-y-3">
                          {communitySubmissions.map((submission) => {
                            const submissionData = submission.attributes || submission;
                            const status = submissionData.status || "SUBMITTED";
                            const statusColors = {
                              SUBMITTED: "bg-blue-100 text-blue-800",
                              APPROVED: "bg-green-100 text-green-800",
                              REJECTED: "bg-red-100 text-red-800",
                              PENDING: "bg-yellow-100 text-yellow-800",
                            };
                            return (
                              <div
                                key={submission.id}
                                className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold text-gray-900 truncate">
                                        {submissionData.community}
                                      </p>
                                      <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                          statusColors[status] || statusColors.PENDING
                                        }`}
                                      >
                                        {status}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      {submissionData.submissionId && (
                                        <span className="font-mono">
                                          #{submissionData.submissionId}
                                        </span>
                                      )}
                                      {submissionData.createdAt && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {new Date(submissionData.createdAt).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-700 font-medium">
                            No submissions found
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Community applications will appear here once submitted.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === "meetings" && (
            <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mb-6">
                  <Calendar className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Coming Soon
                </h3>
                <p className="text-gray-600 text-center max-w-md">
                  The Meetings feature is currently under development. You'll be
                  able to schedule, manage, and track meetings with this account
                  soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddClientPortalDocumentModal
        isOpen={showAddDocumentModal}
        onClose={() => setShowAddDocumentModal(false)}
        onSubmit={handleDocumentSubmit}
        formData={documentFormData}
        setFormData={setDocumentFormData}
        lockClientAccount
        lockedAccountLabel={
          account?.companyName ||
          account?.onboardingData?.signupCompany ||
          "This account"
        }
        isSubmitting={isSubmittingDocument}
      />

      <AssignPocDrawer
        open={showAssignDrawer}
        onClose={() => setShowAssignDrawer(false)}
        companyName={account?.companyName}
        users={users}
        loadingUsers={loadingUsers}
        currentPocId={
          account?.accountManager?.id?.toString() ||
          account?.accountManager?.documentId?.toString() ||
          ""
        }
        assigning={assigningPoc}
        onAssign={async (selectedUserId) => {
          try {
            setAssigningPoc(true);
            await clientAccountService.update(id, {
              accountManager: selectedUserId || null,
            });
            await fetchAccountDetails();
            window.dispatchEvent(
              new CustomEvent("accountUpdated", { detail: { accountId: id } })
            );
            setShowAssignDrawer(false);
          } catch (error) {
            console.error("Error assigning POC:", error);
            alert("Failed to assign POC. Please try again.");
          } finally {
            setAssigningPoc(false);
          }
        }}
      />
    </div>
  );
};

export default ClientAccountDetailPage;
