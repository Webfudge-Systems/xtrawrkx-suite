"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageHeader from "../../../../components/PageHeader";
import { Card, Badge, Button, Avatar, Table } from "../../../../components/ui";
import ActivitiesPanel from "../../../../components/activities/ActivitiesPanel";
import dealService from "../../../../lib/api/dealService";
import leadCompanyService from "../../../../lib/api/leadCompanyService";
import contactService from "../../../../lib/api/contactService";
import strapiClient from "../../../../lib/strapiClient";
import { useAuth } from "../../../../contexts/AuthContext";
import authService from "../../../../lib/authService";
import { Select } from "../../../../components/ui";
import { formatCurrency } from "../../../../lib/utils/format";
import {
  ArrowLeft,
  Building2,
  User,
  IndianRupee,
  TrendingUp,
  Calendar,
  Target,
  Edit,
  Share,
  MoreHorizontal,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  PhoneCall,
  Globe,
  MapPin,
  Clock,
  Activity,
  CheckCircle,
  Users,
  FileText,
  Plus,
  Upload,
  Download,
  Trash2,
  Eye,
  Package,
  DollarSign,
  File,
  Paperclip,
  StickyNote,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Star,
  MoreVertical,
} from "lucide-react";

export default function DealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = params.id;
  const { user } = useAuth();

  const [deal, setDeal] = useState(null);
  const [activities, setActivities] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    department: "",
    role: "PRIMARY_CONTACT",
  });
  const [tabLoading, setTabLoading] = useState({
    contacts: false,
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [loadingStatusUpdate, setLoadingStatusUpdate] = useState(false);
  const [showCreateProjectPrompt, setShowCreateProjectPrompt] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  // Handle creating project from deal
  const handleCreateProject = async () => {
    if (!deal) return;

    setCreatingProject(true);
    try {
      // Get client name from deal
      const clientName =
        deal.clientAccount?.companyName ||
        deal.clientAccount?.attributes?.companyName ||
        deal.leadCompany?.companyName ||
        deal.leadCompany?.attributes?.companyName ||
        deal.company ||
        deal.name;

      // Generate slug from client name
      const slug = clientName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Generate icon from first letter
      const icon = clientName.charAt(0).toUpperCase();

      // Get deal ID (handle both id and documentId)
      const dealId = deal.id || deal.documentId;

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
        name: `${clientName} - ${deal.name}`,
        slug: `${slug}-${dealId}`,
        description:
          deal.description || `Project created from deal: ${deal.name}`,
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

  const handleDismissProjectPrompt = () => {
    setShowCreateProjectPrompt(false);
    setShowConfetti(false);
  };

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
    if (dealId) {
      fetchDealDetails();
    }
  }, [dealId]);

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (deal && activeTab === "contacts" && deal.leadCompany?.id) {
      fetchContacts();
    }
  }, [activeTab, deal]);

  const fetchDealDetails = async () => {
    try {
      setLoading(true);
      setError(null);


      // Fetch deal data from Strapi
      const response = await dealService.getById(dealId, {
        populate: [
          "leadCompany",
          "clientAccount",
          "contact",
          "assignedTo",
          "activities",
        ],
      });


      const dealData = response?.data;
      if (!dealData || !dealData.id) {
        setError("Deal not found");
        return;
      }

      // Handle both Strapi v4 attributes and direct data
      const deal = dealData.attributes || dealData;

      // Map Strapi stages to UI-friendly values
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

      // Transform deal data
      const transformedDeal = {
        id: dealData.id || deal.id,
        name: deal.name || "",
        company:
          deal.leadCompany?.companyName ||
          deal.leadCompany?.attributes?.companyName ||
          deal.clientAccount?.companyName ||
          deal.clientAccount?.attributes?.companyName ||
          "",
        value: parseFloat(deal.value) || 0,
        stage: stageMap[deal.stage] || deal.stage?.toLowerCase() || "discovery",
        priority:
          priorityMap[deal.priority] ||
          deal.priority?.toLowerCase() ||
          "medium",
        probability: deal.probability || 0,
        closeDate: deal.closeDate || null,
        owner: deal.assignedTo
          ? `${deal.assignedTo.firstName || ""} ${
              deal.assignedTo.lastName || ""
            }`.trim()
          : "Unassigned",
        description: deal.description || "",
        createdAt: deal.createdAt || dealData.createdAt,
        updatedAt: deal.updatedAt || dealData.updatedAt,
        leadCompany: deal.leadCompany || dealData.leadCompany,
        clientAccount: deal.clientAccount || dealData.clientAccount,
        contact: deal.contact || dealData.contact,
        assignedTo: deal.assignedTo || dealData.assignedTo,
        activities: deal.activities?.data || deal.activities || [],
      };

      setDeal(transformedDeal);

      // Fetch contacts if lead company exists
      if (transformedDeal.leadCompany?.id) {
        try {
          const leadCompanyId =
            transformedDeal.leadCompany.id ||
            transformedDeal.leadCompany.documentId;

          const contactsResponse = await contactService.getByLeadCompany(
            leadCompanyId
          );
          const contactsData = contactsResponse?.data || contactsResponse || [];

          const transformedContacts = Array.isArray(contactsData)
            ? contactsData.map((contact) => {
                const contactData = contact.attributes || contact;
                return {
                  id: contact.id || contactData.id,
                  firstName: contactData.firstName || "",
                  lastName: contactData.lastName || "",
                  title: contactData.title || "",
                  email: contactData.email || "",
                  phone: contactData.phone || "",
                  role: contactData.role || "TECHNICAL_CONTACT",
                  status: contactData.status || "ACTIVE",
                  department: contactData.department || "",
                  avatar: contactData.avatar,
                };
              })
            : [];

          setContacts(transformedContacts);
        } catch (contactError) {
          console.error("Error fetching contacts:", contactError);
          setContacts([]);
        }
      } else {
        setContacts([]);
      }

      // Set activities if available
      if (transformedDeal.activities && transformedDeal.activities.length > 0) {
        setActivities(transformedDeal.activities);
      } else {
        setActivities([]);
      }

      // Mock data for documents
      setDocuments([
        {
          id: 1,
          name: "Proposal_Q1_2024.pdf",
          type: "Proposal",
          size: "2.5 MB",
          uploadedAt: "2024-01-20",
          uploadedBy: "John Smith",
        },
        {
          id: 2,
          name: "Contract_Draft.docx",
          type: "Contract",
          size: "150 KB",
          uploadedAt: "2024-01-25",
          uploadedBy: "John Smith",
        },
        {
          id: 3,
          name: "Technical_Specifications.pdf",
          type: "Document",
          size: "1.2 MB",
          uploadedAt: "2024-01-18",
          uploadedBy: "Jane Doe",
        },
      ]);

      // Mock data for notes
      setNotes([
        {
          id: 1,
          content:
            "Initial discussion went well. They are very interested in our enterprise features. Need to schedule a demo for next week.",
          author: "John Smith",
          createdAt: "2024-01-10T10:30:00",
          type: "internal",
        },
        {
          id: 2,
          content:
            "Followed up with Jane about pricing. She mentioned budget approval is pending from finance team. Expected decision by end of week.",
          author: "John Smith",
          createdAt: "2024-01-22T14:15:00",
          type: "internal",
        },
        {
          id: 3,
          content:
            "Demo scheduled for Feb 5th at 2 PM. Will showcase enterprise suite features and custom integration capabilities.",
          author: "Sarah Johnson",
          createdAt: "2024-01-28T09:00:00",
          type: "internal",
        },
      ]);

      // Mock data for products
      setProducts([
        {
          id: 1,
          name: "Enterprise Software License",
          description: "Annual license for enterprise suite",
          quantity: 1,
          unitPrice: 200000,
          discount: 0,
          total: 200000,
        },
        {
          id: 2,
          name: "Premium Support Package",
          description: "24/7 premium support with dedicated account manager",
          quantity: 1,
          unitPrice: 30000,
          discount: 10,
          total: 27000,
        },
        {
          id: 3,
          name: "Custom Integration Services",
          description: "Custom API integration and setup",
          quantity: 1,
          unitPrice: 23000,
          discount: 0,
          total: 23000,
        },
      ]);
    } catch (err) {
      console.error("Error fetching deal details:", err);
      setError("Failed to load deal details");
    } finally {
      setLoading(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const fetchContacts = async () => {
    if (!deal?.leadCompany?.id) {
      setContacts([]);
      return;
    }

    try {
      setTabLoading((prev) => ({ ...prev, contacts: true }));
      const leadCompanyId = deal.leadCompany.id || deal.leadCompany.documentId;

      const contactsResponse = await contactService.getByLeadCompany(
        leadCompanyId
      );
      const contactsData = contactsResponse?.data || contactsResponse || [];

      const transformedContacts = Array.isArray(contactsData)
        ? contactsData.map((contact) => {
            const contactData = contact.attributes || contact;
            return {
              id: contact.id || contactData.id,
              firstName: contactData.firstName || "",
              lastName: contactData.lastName || "",
              title: contactData.title || "",
              email: contactData.email || "",
              phone: contactData.phone || "",
              role: contactData.role || "TECHNICAL_CONTACT",
              status: contactData.status || "ACTIVE",
              department: contactData.department || "",
              avatar: contactData.avatar,
            };
          })
        : [];

      setContacts(transformedContacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setContacts([]);
    } finally {
      setTabLoading((prev) => ({ ...prev, contacts: false }));
    }
  };

  const handleAddContact = () => {
    setContactFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      department: "",
      role: "PRIMARY_CONTACT",
    });
    setShowAddContactModal(true);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    if (!deal?.leadCompany?.id) {
      alert("No lead company associated with this deal");
      return;
    }

    // Validate required fields
    if (!contactFormData.firstName.trim()) {
      alert("First name is required");
      return;
    }
    if (!contactFormData.lastName.trim()) {
      alert("Last name is required");
      return;
    }
    if (!contactFormData.email.trim()) {
      alert("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(contactFormData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      const leadCompanyId = deal.leadCompany.id || deal.leadCompany.documentId;

      const contactData = {
        firstName: contactFormData.firstName.trim(),
        lastName: contactFormData.lastName.trim(),
        email: contactFormData.email.trim(),
        phone: contactFormData.phone?.trim() || "",
        title: contactFormData.title?.trim() || "",
        department: contactFormData.department?.trim() || "",
        role: contactFormData.role,
        leadCompany: leadCompanyId,
        status: "ACTIVE",
        source: "MANUAL",
      };

      await contactService.create(contactData);

      // Refresh contacts
      await fetchContacts();

      setShowAddContactModal(false);
      setContactFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        title: "",
        department: "",
        role: "PRIMARY_CONTACT",
      });
      alert("Contact added successfully!");
    } catch (error) {
      let errorMessage = "Failed to add contact";
      if (
        error.message.includes("duplicate") ||
        error.message.includes("unique")
      ) {
        errorMessage = "A contact with this email already exists";
      } else if (error.message.includes("validation")) {
        errorMessage = "Please check your input and try again";
      } else if (error.message) {
        errorMessage = `Failed to add contact: ${error.message}`;
      }

      alert(errorMessage);
    }
  };

  const handleSetPrimaryContact = async (contactId) => {
    try {
      // First, remove primary contact role from all other contacts
      const updatePromises = contacts.map(async (contact) => {
        if (contact.id !== contactId && contact.role === "PRIMARY_CONTACT") {
          return contactService.update(contact.id, {
            role: "TECHNICAL_CONTACT",
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      // Set the selected contact as primary
      await contactService.update(contactId, { role: "PRIMARY_CONTACT" });

      // Refresh contacts
      await fetchContacts();

      alert("Primary contact updated successfully!");
    } catch (error) {
      console.error("Error setting primary contact:", error);
      alert("Failed to set primary contact");
    }
  };

  // Handle status updates
  const handleStatusUpdate = async (newStage) => {
    if (!deal || !deal.id) {
      console.error("No deal ID provided");
      return;
    }

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
    const isWon = newStage.toLowerCase() === "won";
    const wasWon = deal.stage?.toLowerCase() === "won";

    setLoadingStatusUpdate(true);

    try {

      // Update the stage via API
      await dealService.update(deal.id, { stage: strapiStage });

      // If deal is won, check if we need to convert lead company to client account
      if (strapiStage === "CLOSED_WON" && isWon && !wasWon) {
        try {
          // Fetch the updated deal to get full data including leadCompany
          const updatedDealResponse = await dealService.getById(deal.id, {
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
                await dealService.update(deal.id, {
                  clientAccount: clientAccountId,
                });


                // Show success toast if toast is available
                if (typeof window !== "undefined" && window.toast) {
                  window.toast.success(
                    `Lead company "${
                      leadCompanyData.companyName || "Unknown"
                    }" converted to client account!`,
                    {
                      position: "top-right",
                      autoClose: 5000,
                    }
                  );
                }
              }
            } else {
              // Lead company already converted, just link the existing client account to the deal
              const existingClientAccountId =
                convertedAccount.id || convertedAccount.documentId;

              await dealService.update(deal.id, {
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

      setDeal((prevDeal) => ({
        ...prevDeal,
        stage: uiStage,
      }));

      // Trigger celebratory animation if converting to Won (and wasn't already won)
      if (isWon && !wasWon) {
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
      setLoadingStatusUpdate(false);
    }
  };

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
        >
          {contact.role?.replace(/_/g, " ") || "TECHNICAL CONTACT"}
        </Badge>
      ),
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
        </div>
      ),
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
          {contact.role !== "PRIMARY_CONTACT" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSetPrimaryContact(contact.id)}
              title="Set as Primary Contact"
              className="text-orange-600 hover:text-orange-700"
            >
              <Star className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {}}
            title="More Actions"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Tab items
  const tabItems = [
    { key: "overview", label: "Overview" },
    { key: "contacts", label: "Contacts" },
    { key: "products", label: "Products" },
    { key: "documents", label: "Documents" },
    { key: "notes", label: "Notes" },
    { key: "activity", label: "Activities" },
    { key: "details", label: "Details" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deal details...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Deal not found
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "The deal you're looking for doesn't exist."}
          </p>
          <Button onClick={() => router.push("/sales/deals")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
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

            {/* Success Message Overlay */}
            {showCreateProjectPrompt && (
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
                      <strong>{deal?.name}</strong> has been marked as Won
                    </p>
                    {deal?.value && (
                      <p className="text-sm text-gray-600 mb-4">
                        Deal Value:{" "}
                        <strong>{formatCurrency(deal.value)}</strong>
                      </p>
                    )}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-700 font-medium mb-2">
                        Would you like to create a project for this client?
                      </p>
                      <p className="text-xs text-green-600">
                        This will create a new project in the Projects section
                        linked to this deal's client.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleDismissProjectPrompt}
                      disabled={creatingProject}
                      variant="outline"
                      className="flex-1"
                    >
                      No, Thanks
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
          </div>
        </>
      )}

      <div className="p-4 space-y-4">
        {/* Page Header */}
        <PageHeader
          title={deal ? deal.name : "Loading..."}
          subtitle={
            deal
              ? `${formatCurrency(deal.value || 0)} • ${
                  deal.stage?.toUpperCase() || "NEW"
                } Deal`
              : "Loading deal details..."
          }
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Sales", href: "/sales" },
            { label: "Deals", href: "/sales/deals" },
            {
              label: deal ? deal.name : "Deal",
              href: `/sales/deals/${dealId}`,
            },
          ]}
          showProfile={true}
          actions={[
            {
              icon: Edit,
              onClick: () => router.push(`/sales/deals/${dealId}/edit`),
              className: "",
              title: "Edit Deal",
            },
            {
              icon: Share,
              onClick: () => {},
              className: "",
              title: "Share Deal",
            },
            {
              icon: MoreHorizontal,
              onClick: () => {},
              className: "",
              title: "More Actions",
            },
          ]}
        />

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button
                onClick={() => fetchDealDetails()}
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Deal Content */}
        {!loading && !error && deal && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(() => {
                const stage = deal.stage?.toLowerCase() || "discovery";
                const stageColors = {
                  discovery: {
                    bg: "from-blue-100/70 to-blue-50/40",
                    text: "text-blue-800",
                    iconBg: "bg-blue-100",
                    iconBorder: "border-blue-300",
                    iconText: "text-blue-700",
                  },
                  proposal: {
                    bg: "from-purple-100/70 to-purple-50/40",
                    text: "text-purple-800",
                    iconBg: "bg-purple-100",
                    iconBorder: "border-purple-300",
                    iconText: "text-purple-700",
                  },
                  negotiation: {
                    bg: "from-orange-100/70 to-orange-50/40",
                    text: "text-orange-800",
                    iconBg: "bg-orange-100",
                    iconBorder: "border-orange-300",
                    iconText: "text-orange-700",
                  },
                  won: {
                    bg: "from-green-100/70 to-green-50/40",
                    text: "text-green-800",
                    iconBg: "bg-green-100",
                    iconBorder: "border-green-300",
                    iconText: "text-green-700",
                  },
                  lost: {
                    bg: "from-red-100/70 to-red-50/40",
                    text: "text-red-800",
                    iconBg: "bg-red-100",
                    iconBorder: "border-red-300",
                    iconText: "text-red-700",
                  },
                };

                const colors = stageColors[stage] || stageColors.discovery;
                const displayStage = deal.stage || "Discovery";

                return (
                  <div
                    className={`rounded-2xl bg-gradient-to-br ${colors.bg} backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1 font-medium">
                          Stage
                        </p>
                        <p className={`text-3xl font-black ${colors.text}`}>
                          {displayStage.toUpperCase()}
                        </p>
                      </div>
                      <div
                        className={`w-16 h-16 ${colors.iconBg} backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border ${colors.iconBorder}`}
                      >
                        <Target className={`w-8 h-8 ${colors.iconText}`} />
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1 font-medium">
                      Value
                    </p>
                    <p className="text-3xl font-black text-gray-800">
                      {formatCurrency(deal.value || 0)}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-green-50 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-green-200">
                    <IndianRupee className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1 font-medium">
                      Probability
                    </p>
                    <p className="text-3xl font-black text-gray-800">
                      {deal.probability || 0}%
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-purple-50 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-purple-200">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1 font-medium">
                      Created
                    </p>
                    <p className="text-3xl font-black text-gray-800">
                      {formatDate(deal.createdAt)}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-orange-50 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-orange-200">
                    <Calendar className="w-8 h-8 text-orange-600" />
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
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Deal Information */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Deal Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Deal Name
                        </label>
                        <p className="text-gray-900 mt-1">{deal.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Description
                        </label>
                        <p className="text-gray-900 mt-1">
                          {deal.description || "No description available"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Stage
                          </label>
                          <div className="mt-1">
                            {(() => {
                              const currentStage =
                                deal.stage?.toLowerCase() || "discovery";
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

                              const colors =
                                stageColors[currentStage] ||
                                stageColors.discovery;

                              const statusOptions = [
                                { value: "discovery", label: "Discovery" },
                                { value: "proposal", label: "Proposal" },
                                { value: "negotiation", label: "Negotiation" },
                                { value: "won", label: "Won" },
                                { value: "lost", label: "Lost" },
                              ];

                              return (
                                <div className="min-w-[140px]">
                                  {loadingStatusUpdate ? (
                                    <div className="flex items-center justify-center">
                                      <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                  ) : (
                                    <select
                                      value={currentStage}
                                      onChange={(e) => {
                                        handleStatusUpdate(e.target.value);
                                      }}
                                      className={`w-full ${colors.bg} ${colors.text} ${colors.border} border-2 rounded-lg px-4 py-2 font-bold text-sm text-center shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer appearance-none`}
                                      style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: "no-repeat",
                                        backgroundPosition:
                                          "right 0.5rem center",
                                        paddingRight: "2rem",
                                      }}
                                    >
                                      {statusOptions.map((option) => (
                                        <option
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Priority
                          </label>
                          <div className="mt-1">
                            <Badge
                              variant={getPriorityBadgeVariant(deal.priority)}
                            >
                              {deal.priority?.toUpperCase() || "MEDIUM"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Probability
                          </label>
                          <div className="mt-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-orange-500 h-2 rounded-full"
                                  style={{ width: `${deal.probability || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900 font-medium">
                                {deal.probability || 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Close Date
                          </label>
                          <p className="text-gray-900 mt-1">
                            {deal.closeDate
                              ? new Date(deal.closeDate).toLocaleDateString(
                                  "en-IN"
                                )
                              : "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company Information */}
                  {deal.leadCompany &&
                    (() => {
                      const companyData =
                        deal.leadCompany.attributes || deal.leadCompany;
                      const companyId =
                        deal.leadCompany.id ||
                        companyData.id ||
                        deal.leadCompany.documentId;
                      const companyName =
                        companyData.companyName || deal.company || "";
                      const industry = companyData.industry || "";
                      const website = companyData.website || "";
                      const employees = companyData.employees || "";
                      const headquarters = companyData.headquarters || "";
                      const city = companyData.city || "";
                      const state = companyData.state || "";

                      return (
                        <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Company Information
                          </h3>
                          <div className="space-y-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    {companyName}
                                  </h4>
                                  <Badge variant="info">Lead</Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  {industry && (
                                    <div>
                                      <span className="text-gray-500">
                                        Industry
                                      </span>
                                      <p className="font-medium text-gray-900">
                                        {industry}
                                      </p>
                                    </div>
                                  )}

                                  {website && (
                                    <div>
                                      <span className="text-gray-500">
                                        Website
                                      </span>
                                      <a
                                        href={website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                      >
                                        <Globe className="w-3 h-3" />
                                        {website.replace(/^https?:\/\//, "")}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  )}

                                  {employees && (
                                    <div>
                                      <span className="text-gray-500">
                                        Employees
                                      </span>
                                      <p className="font-medium text-gray-900">
                                        {employees}
                                      </p>
                                    </div>
                                  )}

                                  {(headquarters || (city && state)) && (
                                    <div>
                                      <span className="text-gray-500">
                                        Location
                                      </span>
                                      <p className="font-medium text-gray-900">
                                        {headquarters || `${city}, ${state}`}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {companyId && (
                                  <div className="mt-4 flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        router.push(
                                          `/sales/lead-companies/${companyId}`
                                        )
                                      }
                                      className="flex items-center gap-2"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View Lead Company
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  {/* Primary Contact */}
                  {deal.contact &&
                    (() => {
                      const contactData =
                        deal.contact.attributes || deal.contact;
                      const contactId = deal.contact.id || contactData.id;
                      const firstName = contactData.firstName || "";
                      const lastName = contactData.lastName || "";
                      const title = contactData.title || "Contact";
                      const email = contactData.email || "";
                      const phone = contactData.phone || "";

                      return (
                        <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Primary Contact
                          </h3>
                          <div className="space-y-4">
                            <div className="flex items-start gap-4">
                              <Avatar
                                fallback={`${firstName?.[0] || ""}${
                                  lastName?.[0] || ""
                                }`}
                                className="w-12 h-12"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    {firstName} {lastName}
                                  </h4>
                                  {contactId && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        router.push(
                                          `/sales/contacts/${contactId}`
                                        )
                                      }
                                      className="flex items-center gap-2"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View Contact
                                    </Button>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 mb-3">
                                  {title}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  {email && (
                                    <div>
                                      <span className="text-gray-500">
                                        Email
                                      </span>
                                      <div className="mt-1 flex items-center gap-1">
                                        <Mail className="w-3 h-3 text-gray-400" />
                                        <p className="font-medium text-gray-900">
                                          {email}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  {phone && (
                                    <div>
                                      <span className="text-gray-500">
                                        Phone
                                      </span>
                                      <div className="mt-1 flex items-center gap-1">
                                        <Phone className="w-3 h-3 text-gray-400" />
                                        <p className="font-medium text-gray-900">
                                          {phone}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                </div>

                {/* Deal Owner */}
                <div className="space-y-6">
                  <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Deal Owner
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar
                        alt={
                          deal?.assignedTo
                            ? `${deal.assignedTo.firstName || ""} ${
                                deal.assignedTo.lastName || ""
                              }`.trim() ||
                              deal.assignedTo.username ||
                              "Unknown"
                            : "Unassigned"
                        }
                        fallback={
                          deal?.assignedTo
                            ? (
                                `${deal.assignedTo.firstName || ""} ${
                                  deal.assignedTo.lastName || ""
                                }`.trim() ||
                                deal.assignedTo.username ||
                                "?"
                              )
                                .charAt(0)
                                .toUpperCase()
                            : "?"
                        }
                        size="lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {deal?.assignedTo
                            ? `${deal.assignedTo.firstName || ""} ${
                                deal.assignedTo.lastName || ""
                              }`.trim() ||
                              deal.assignedTo.username ||
                              "Unknown"
                            : "Unassigned"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {(() => {
                            const assignedTo = deal?.assignedTo;
                            if (!assignedTo) return "Sales Manager";

                            // Handle different Strapi response structures
                            const roleName =
                              assignedTo.primaryRole?.name ||
                              assignedTo.primaryRole?.data?.attributes?.name ||
                              assignedTo.primaryRole?.attributes?.name ||
                              assignedTo.role ||
                              null;

                            return roleName || "Sales Manager";
                          })()}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">
                            4.9 rating
                          </span>
                        </div>
                      </div>
                      {isAdmin() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUserId(
                              deal?.assignedTo?.id?.toString() ||
                                deal?.assignedTo?.documentId?.toString() ||
                                ""
                            );
                            setShowAssignModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Change Assignee
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Deal Health */}
                  <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Deal Health
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Progress
                          </span>
                          <span className="text-sm text-gray-900 font-semibold">
                            {deal.probability || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-orange-500 h-3 rounded-full"
                            style={{ width: `${deal.probability || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Days to Close
                          </span>
                          <span className="text-sm text-gray-900 font-semibold">
                            {deal.closeDate
                              ? Math.ceil(
                                  (new Date(deal.closeDate) - new Date()) /
                                    (1000 * 60 * 60 * 24)
                                )
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Next Steps
                      </h3>
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-700 border-orange-300"
                      >
                        Coming Soon
                      </Badge>
                    </div>
                    <div className="flex flex-col items-center justify-center py-12">
                      <Clock className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium mb-2">
                        Next Steps feature coming soon
                      </p>
                      <p className="text-sm text-gray-500 text-center max-w-sm">
                        This feature will allow you to track and manage action
                        items for your deals
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && deal && (
              <ActivitiesPanel
                entityType="deal"
                entityId={deal.id}
                entityName={deal.name}
                onActivityCreated={fetchDealDetails}
              />
            )}

            {activeTab === "contacts" && (
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Deal Contacts & Stakeholders
                  </h3>
                  <Button
                    size="sm"
                    onClick={handleAddContact}
                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
                {tabLoading.contacts ? (
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
                      No contacts found for this deal
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Add contacts to start building relationships
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "products" && (
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Products & Line Items
                  </h3>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>
                {products.length > 0 ? (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                              Product/Service
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                              Quantity
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                              Unit Price
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                              Discount
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                              Total
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product) => (
                            <tr
                              key={product.id}
                              className="border-b border-gray-100 hover:bg-white/50"
                            >
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {product.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {product.description}
                                  </p>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-gray-900">
                                  {product.quantity}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="text-gray-900">
                                  {formatCurrency(product.unitPrice)}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="text-gray-900">
                                  {product.discount > 0
                                    ? `${product.discount}%`
                                    : "-"}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-semibold text-gray-900">
                                  {formatCurrency(product.total)}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-300">
                            <td
                              colSpan={4}
                              className="py-4 px-4 text-right font-semibold text-gray-900"
                            >
                              Total Value:
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(
                                  products.reduce((sum, p) => sum + p.total, 0)
                                )}
                              </span>
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">
                      No products added yet
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Add products and services to build your deal
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "documents" && (
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Documents & Attachments
                  </h3>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
                {documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-white/40 hover:bg-white/70 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <File className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {doc.name}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {doc.type}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {doc.size}
                              </span>
                              <span className="text-sm text-gray-500">
                                Uploaded by {doc.uploadedBy} on{" "}
                                {formatDate(doc.uploadedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">
                      No documents uploaded yet
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Upload proposals, contracts, and other documents here
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "notes" && (
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Deal Notes
                  </h3>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                </div>
                {notes.length > 0 ? (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-4 bg-white/50 rounded-xl border border-white/40 hover:bg-white/70 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <StickyNote className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {note.author}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(note.createdAt).toLocaleString(
                                  "en-IN",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <StickyNote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No notes yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Add internal notes and comments about this deal
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "details" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    System Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Created Date
                      </label>
                      <p className="text-gray-900 mt-1">
                        {deal.createdAt
                          ? formatDate(deal.createdAt)
                          : "Not available"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Last Updated
                      </label>
                      <p className="text-gray-900 mt-1">
                        {deal.updatedAt
                          ? formatDate(deal.updatedAt)
                          : "Not available"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Deal ID
                      </label>
                      <p className="text-gray-900 mt-1">{deal.id}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push(`/sales/deals/${dealId}/edit`)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Deal
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push("/sales/deals")}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Deals
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Assign Owner Modal */}
        {showAssignModal && deal && (
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
                  Select a user to assign <strong>{deal.name}</strong> to:
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
                      await dealService.update(deal.id, {
                        assignedTo: selectedUserId || null,
                      });
                      // Refresh deal data
                      await fetchDealDetails();
                      setShowAssignModal(false);
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

        {/* Add Contact Modal */}
        {showAddContactModal && deal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Add Contact
                  </h2>
                  <Button
                    onClick={() => setShowAddContactModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    variant="ghost"
                    size="sm"
                  >
                    ✕
                  </Button>
                </div>

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={contactFormData.firstName}
                        onChange={(e) =>
                          setContactFormData({
                            ...contactFormData,
                            firstName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={contactFormData.lastName}
                        onChange={(e) =>
                          setContactFormData({
                            ...contactFormData,
                            lastName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={contactFormData.email}
                      onChange={(e) =>
                        setContactFormData({
                          ...contactFormData,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={contactFormData.phone}
                        onChange={(e) =>
                          setContactFormData({
                            ...contactFormData,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={contactFormData.title}
                        onChange={(e) =>
                          setContactFormData({
                            ...contactFormData,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={contactFormData.department}
                        onChange={(e) =>
                          setContactFormData({
                            ...contactFormData,
                            department: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={contactFormData.role}
                        onChange={(e) =>
                          setContactFormData({
                            ...contactFormData,
                            role: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="PRIMARY_CONTACT">Primary Contact</option>
                        <option value="DECISION_MAKER">Decision Maker</option>
                        <option value="INFLUENCER">Influencer</option>
                        <option value="TECHNICAL_CONTACT">
                          Technical Contact
                        </option>
                        <option value="GATEKEEPER">Gatekeeper</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={() => setShowAddContactModal(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                    >
                      Add Contact
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
