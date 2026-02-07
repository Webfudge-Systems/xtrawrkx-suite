"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import leadCompanyService from "../../../../lib/api/leadCompanyService";
import contactService from "../../../../lib/api/contactService";
import dealService from "../../../../lib/api/dealService";
import strapiClient from "../../../../lib/strapiClient";
import { useAuth } from "../../../../contexts/AuthContext";
import authService from "../../../../lib/authService";
import { formatCurrency } from "../../../../lib/utils";
import {
  Card,
  Badge,
  Avatar,
  Button,
  Tabs,
  StatCard,
  Table,
  Select,
} from "../../../../components/ui";
import PageHeader from "../../../../components/PageHeader";
import ActivitiesPanel from "../../../../components/activities/ActivitiesPanel";
import {
  ArrowLeft,
  Building2,
  Users,
  User,
  IndianRupee,
  TrendingUp,
  Globe,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  Activity,
  Briefcase,
  Edit,
  MoreVertical,
  Plus,
  Eye,
  MessageSquare,
  FileText,
  Share2,
  Download,
  CheckCircle2,
  PhoneCall,
  UserPlus,
  Clock,
  ClipboardList,
  ArrowRight,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

export default function LeadCompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [activeActivityActions, setActiveActivityActions] = useState(null);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [showAddProposalModal, setShowAddProposalModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    department: "",
    role: "TECHNICAL_CONTACT",
  });
  const [dealFormData, setDealFormData] = useState({
    name: "",
    value: "",
    stage: "DISCOVERY",
    probability: 25,
    closeDate: "",
    description: "",
  });

  // Real-time data for tabs
  const [contacts, setContacts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [proposals, setProposals] = useState([]);
  // Formatting functions for display
  const formatIndustry = (industry) => {
    if (!industry) return "Not specified";
    return (
      industry.charAt(0).toUpperCase() + industry.slice(1).replace(/-/g, " ")
    );
  };

  const formatEmployeeSize = (employees) => {
    if (!employees) return "Not specified";
    const sizeMap = {
      SIZE_1_10: "1-10 employees",
      SIZE_11_50: "11-50 employees",
      SIZE_51_200: "51-200 employees",
      SIZE_201_500: "201-500 employees",
      SIZE_501_1000: "501-1000 employees",
      SIZE_1000_PLUS: "1000+ employees",
    };
    return sizeMap[employees] || employees;
  };

  const formatLeadSource = (source) => {
    if (!source) return "Not specified";
    const sourceMap = {
      WEBSITE: "Website",
      REFERRAL: "Referral",
      COLD_OUTREACH: "Cold Outreach",
      SOCIAL_MEDIA: "Social Media",
      EVENT: "Event",
      PARTNER: "Partner",
      ADVERTISING: "Advertising",
      MANUAL: "Manual",
    };
    return sourceMap[source] || source.replace(/_/g, " ");
  };

  const formatStatus = (status) => {
    if (!status) return "Not specified";
    const statusMap = {
      NEW: "New",
      CONTACTED: "Contacted",
      QUALIFIED: "Qualified",
      PROPOSAL_SENT: "Proposal Sent",
      NEGOTIATION: "Negotiation",
      LOST: "Lost",
      CONVERTED: "Converted",
    };
    return statusMap[status] || status.replace(/_/g, " ");
  };

  const getLeadSourceVariant = (source) => {
    if (!source) return "gray";
    const variantMap = {
      WEBSITE: "primary",
      REFERRAL: "success",
      COLD_OUTREACH: "warning",
      SOCIAL_MEDIA: "primary",
      EVENT: "success",
      PARTNER: "success",
      ADVERTISING: "warning",
      MANUAL: "gray",
    };
    return variantMap[source] || "gray";
  };

  const [tabLoading, setTabLoading] = useState({
    contacts: false,
    activities: false,
    deals: false,
    proposals: false,
  });

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

  // Fetch lead company data from Strapi
  useEffect(() => {
    fetchCompanyData();
  }, [params.id]);

  // Fetch users if admin
  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [user]);

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

  // Fetch all related data when company is loaded (for accurate stats)
  useEffect(() => {
    if (company && company.id) {
      const loadRelatedData = async () => {
        await Promise.all([
          fetchContacts(),
          fetchDeals(),
          fetchActivities(),
          fetchProposals(),
        ]);
      };

      loadRelatedData();
    }
  }, [company]);

  // Fetch tab-specific data when tab changes (for refresh/updates)
  useEffect(() => {
    if (company && activeTab !== "overview") {
      fetchTabData(activeTab);
    }
  }, [activeTab, company]);

  const fetchTabData = async (tab) => {
    if (!company) return;

    setTabLoading((prev) => ({ ...prev, [tab]: true }));

    try {
      switch (tab) {
        case "contacts":
          await fetchContacts();
          break;
        case "activities":
          await fetchActivities();
          break;
        case "deals":
          await fetchDeals();
          break;
        case "proposals":
          await fetchProposals();
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
    } finally {
      setTabLoading((prev) => ({ ...prev, [tab]: false }));
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await contactService.getByLeadCompany(company.id);
      const contactsData = response.data || [];
      setContacts(contactsData);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setContacts([]);
    }
  };

  const handleSetPrimaryContact = async (contactId) => {
    try {
      const selectedContact = contacts.find((c) => c.id === contactId);
      
      // If already primary, demote to technical contact
      if (selectedContact?.role === "PRIMARY_CONTACT") {
        await contactService.update(contactId, { role: "TECHNICAL_CONTACT" });
        await fetchContacts();
        await fetchCompanyData();
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

      // Refresh contacts and company data
      await fetchContacts();
      await fetchCompanyData();

      alert("Primary contact updated successfully!");
    } catch (error) {
      console.error("Error setting primary contact:", error);
      alert("Failed to update contact role");
    }
  };

  const handleRoleChange = async (contactId, newRole) => {
    try {
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

      // Refresh contacts and company data
      await fetchContacts();
      await fetchCompanyData();
    } catch (error) {
      console.error("Error updating contact role:", error);
      alert("Failed to update contact role");
    }
  };

  const fetchActivities = async () => {
    try {
      // TODO: Replace with actual API call when activities service is ready
      // const response = await activityService.getByLeadCompany(company.id);
      setActivities([]);
    } catch (error) {
      console.error("Error fetching activities:", error);
      setActivities([]);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await dealService.getByLeadCompany(company.id);
      const dealsData = response.data || [];

      // Transform Strapi data to flatten attributes structure
      const transformedDeals = dealsData.map((deal) => {
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
      });

      setDeals(transformedDeals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      setDeals([]);
    }
  };

  const fetchProposals = async () => {
    try {
      // TODO: Replace with actual API call when proposals service is ready
      // const response = await proposalService.getByLeadCompany(company.id);
      setProposals([]);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      setProposals([]);
    }
  };

  const fetchCompanyData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await leadCompanyService.getById(params.id);

      // Handle the service response structure (response.data)
      const leadCompanyData = response.data || response;

      if (leadCompanyData) {
        // Transform Strapi data to match component expectations
        const transformedCompany = {
          id: leadCompanyData.id,
          documentId: leadCompanyData.documentId,
          name: leadCompanyData.companyName,
          companyName: leadCompanyData.companyName,
          industry: leadCompanyData.industry,
          type: leadCompanyData.type,
          subType: leadCompanyData.subType,
          status: leadCompanyData.status,
          segment: leadCompanyData.segment || "WARM",
          contacts: contacts.length, // Real count from state
          deals: deals.length, // Real count from state
          dealValue: leadCompanyData.dealValue || 0,
          activities: activities.length, // Real count from state
          owner:
            leadCompanyData.assignedTo?.firstName &&
            leadCompanyData.assignedTo?.lastName
              ? `${leadCompanyData.assignedTo.firstName} ${leadCompanyData.assignedTo.lastName}`
              : "Unassigned",
          assignedTo: leadCompanyData.assignedTo,
          health: leadCompanyData.healthScore || 50,
          score: leadCompanyData.leadScore || leadCompanyData.score || 50,
          lastActivity: "No recent activity", // Will be populated when activities API is ready
          website: leadCompanyData.website,
          employees: leadCompanyData.employees,
          location:
            leadCompanyData.city && leadCompanyData.state
              ? `${leadCompanyData.city}, ${leadCompanyData.state}`
              : leadCompanyData.city ||
                leadCompanyData.state ||
                "Not specified",
          description:
            leadCompanyData.description || "No description available",
          founded: leadCompanyData.founded,
          headquarters:
            leadCompanyData.city && leadCompanyData.state
              ? `${leadCompanyData.city}, ${leadCompanyData.state}`
              : leadCompanyData.address || "Not specified",
          phone: leadCompanyData.phone,
          email: leadCompanyData.email,
          linkedIn: leadCompanyData.linkedIn,
          twitter: leadCompanyData.twitter,
          source:
            leadCompanyData.leadSource || leadCompanyData.source || "MANUAL",
          createdAt: leadCompanyData.createdAt,
          updatedAt: leadCompanyData.updatedAt,
          convertedAt: leadCompanyData.convertedAt,
          address: leadCompanyData.address,
          city: leadCompanyData.city,
          state: leadCompanyData.state,
          country: leadCompanyData.country,
          zipCode: leadCompanyData.zipCode,
          notes: leadCompanyData.notes,
          convertedAccount: leadCompanyData.convertedAccount,
        };

        setCompany(transformedCompany);
      } else {
        setError("Lead company not found");
      }
    } catch (err) {
      console.error("Error fetching company data:", err);
      setError("Failed to load company data");
    } finally {
      setIsLoading(false);
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
            {contact.phone || "No contact"}
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
          {contact.clientAccount && (
            <div className="mt-1">
              <Badge variant="info" className="text-xs">
                Client Account
              </Badge>
            </div>
          )}
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
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/sales/contacts/${contact.id}`);
            }}
            title="View Contact"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleSetPrimaryContact(contact.id);
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/sales/contacts/${contact.id}/edit`);
            }}
            title="Edit Contact"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

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
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/sales/deals/${row.id}`);
            }}
            title="View Deal"
          >
            <Eye className="w-4 h-4 text-gray-400 hover:text-blue-600" />
          </button>
          <button
            className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/sales/deals/${row.id}/edit`);
            }}
            title="Edit Deal"
          >
            <Edit className="w-4 h-4 text-gray-400 hover:text-orange-600" />
          </button>
          <button
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // Add delete functionality here
            }}
            title="Delete Deal"
          >
            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  const proposalColumns = [
    {
      key: "title",
      label: "Proposal Title",
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">Version {row.version}</div>
        </div>
      ),
    },
    {
      key: "value",
      label: "Value",
      render: (value) => (
        <span className="font-semibold text-gray-900">₹{value}K</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const variants = {
          Draft: "default",
          Sent: "info",
          "Under Review": "warning",
          Accepted: "success",
          Rejected: "destructive",
        };
        return <Badge variant={variants[value] || "default"}>{value}</Badge>;
      },
    },
    {
      key: "sentDate",
      label: "Sent Date",
      render: (value) => <span className="text-sm text-gray-600">{value}</span>,
    },
    {
      key: "expiryDate",
      label: "Expiry Date",
      render: (value) => <span className="text-sm text-gray-600">{value}</span>,
    },
    {
      key: "actions",
      label: "",
      render: () => (
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors">
            <Eye className="w-4 h-4 text-gray-400 hover:text-orange-600" />
          </button>
          <button className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors">
            <MoreVertical className="w-4 h-4 text-gray-400 hover:text-orange-600" />
          </button>
        </div>
      ),
    },
  ];

  const mockContacts = [
    {
      id: 1,
      name: "David Martinez",
      title: "CEO",
      email: "david.m@techinnovations.com",
      phone: "+1 (555) 987-6543",
      role: "Decision Maker",
      lastContact: "2 hours ago",
    },
    {
      id: 2,
      name: "Lisa Chen",
      title: "CTO",
      email: "lchen@techinnovations.com",
      phone: "+1 (555) 987-6544",
      role: "Technical Lead",
      lastContact: "1 day ago",
    },
    {
      id: 3,
      name: "Robert Taylor",
      title: "VP Sales",
      email: "rtaylor@techinnovations.com",
      phone: "+1 (555) 987-6545",
      role: "Influencer",
      lastContact: "3 days ago",
    },
  ];

  const mockDeals = [
    {
      id: 1,
      name: "Enterprise AI Platform License",
      stage: "Proposal",
      value: 85,
      probability: 70,
      closeDate: "Dec 20, 2024",
    },
    {
      id: 2,
      name: "Custom Development Services",
      stage: "Qualification",
      value: 40,
      probability: 55,
      closeDate: "Jan 15, 2025",
    },
  ];

  const mockProposals = [
    {
      id: 1,
      title: "Enterprise AI Platform - Q1 2025",
      version: 2.1,
      value: 85,
      status: "Under Review",
      sentDate: "Nov 10, 2024",
      expiryDate: "Dec 10, 2024",
    },
    {
      id: 2,
      title: "Custom Development Package",
      version: 1.0,
      value: 40,
      status: "Draft",
      sentDate: "-",
      expiryDate: "-",
    },
  ];

  const activityItems = [
    {
      id: 1,
      type: "call",
      title: "Discovery call scheduled",
      description:
        "Discussed AI platform requirements and implementation timeline",
      timestamp: "2 hours ago",
      user: "Sarah Johnson",
      contact: "David Martinez",
    },
    {
      id: 2,
      type: "email",
      title: "Proposal sent to David Martinez",
      description: "Sent enterprise AI platform proposal v2.1",
      timestamp: "1 day ago",
      user: "Sarah Johnson",
      contact: "David Martinez",
    },
    {
      id: 3,
      type: "meeting",
      title: "Technical demo scheduled",
      description: "Product demo with technical team",
      timestamp: "2 days ago",
      user: "Sarah Johnson",
      contact: "Lisa Chen",
    },
    {
      id: 4,
      type: "note",
      title: "Note added",
      description:
        "Company shows strong interest. Budget approved for Q1 2025.",
      timestamp: "3 days ago",
      user: "Sarah Johnson",
      contact: null,
    },
    {
      id: 5,
      type: "deal",
      title: "Deal created",
      description: "Enterprise AI Platform License deal created",
      timestamp: "1 week ago",
      user: "Sarah Johnson",
      contact: null,
    },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case "call":
        return <PhoneCall className="w-4 h-4 text-green-600" />;
      case "email":
        return <Mail className="w-4 h-4 text-orange-600" />;
      case "meeting":
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case "note":
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
      case "deal":
        return <Briefcase className="w-4 h-4 text-blue-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityBg = (type) => {
    switch (type) {
      case "call":
        return "bg-green-100";
      case "email":
        return "bg-orange-100";
      case "meeting":
        return "bg-purple-100";
      case "note":
        return "bg-gray-100";
      case "deal":
        return "bg-blue-100";
      default:
        return "bg-gray-100";
    }
  };

  const handleConvertToClient = async () => {
    if (!company) return;

    // Set loading state
    setIsConverting(true);

    try {
      await leadCompanyService.convertToClient(company.id);
      setShowConvertModal(false);

      // Show confetti animation
      setShowConfetti(true);

      // Hide confetti after animation and redirect
      setTimeout(() => {
        setShowConfetti(false);
        // Redirect to client accounts list page
        router.push("/clients/accounts");
      }, 3500);
    } catch (error) {
      console.error("Error converting to client:", error);
      setIsConverting(false);
      alert("Failed to convert to client. Please try again.");
    }
  };

  // Button handlers for PageHeader actions
  const handleEditCompany = () => {
    router.push(`/sales/lead-companies/${company.id}/edit`);
  };

  const handleShareCompany = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${company.companyName} - Lead Company`,
        text: `Check out this lead company: ${company.companyName}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Company link copied to clipboard!");
    }
  };

  const handleExportCompany = () => {
    const companyData = {
      companyName: company.companyName,
      industry: company.industry,
      email: company.email,
      phone: company.phone,
      website: company.website,
      status: company.status,
      dealValue: company.dealValue,
      contacts: contacts.length,
      activities: activities.length,
      deals: deals.length,
      proposals: proposals.length,
    };

    const dataStr = JSON.stringify(companyData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${company.companyName.replace(
      /\s+/g,
      "_"
    )}_lead_company.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleAddContact = () => {
    setContactFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      department: "",
      role: "TECHNICAL_CONTACT",
    });
    setShowAddContactModal(true);
  };

  const handleAddDeal = () => {
    // Navigate to new deal page with lead company pre-selected
    router.push(`/sales/deals/new?leadCompany=${company.id}`);
  };

  const handleAddProposal = () => {
    router.push(`/sales/lead-companies/${company.id}/proposals/new`);
  };

  // Form submission handlers

  const handleContactSubmit = async (e) => {
    e.preventDefault();

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
      // If the new contact is being created as PRIMARY_CONTACT, ensure existing
      // primary contacts for this lead company are demoted first so we don't end up
      // with multiple primary contacts.
      if (contactFormData.role === "PRIMARY_CONTACT") {
        const demotePromises = contacts
          .filter((c) => c.role === "PRIMARY_CONTACT")
          .map((c) =>
            contactService.update(c.id, {
              role: "TECHNICAL_CONTACT",
            })
          );
        if (demotePromises.length > 0) {
          await Promise.all(demotePromises);
        }
      }

      const contactData = {
        firstName: contactFormData.firstName.trim(),
        lastName: contactFormData.lastName.trim(),
        email: contactFormData.email.trim(),
        phone: contactFormData.phone?.trim() || "",
        title: contactFormData.title?.trim() || "",
        department: contactFormData.department?.trim() || "",
        role: contactFormData.role,
        leadCompany: company.id,
        status: "ACTIVE",
        source: "MANUAL",
      };

      await contactService.create(contactData);

      // Refresh contacts and company data
      await fetchContacts();
      await fetchCompanyData();

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

  const handleDealSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!dealFormData.name.trim()) {
      alert("Deal name is required");
      return;
    }

    try {
      const dealData = {
        name: dealFormData.name.trim(),
        value: dealFormData.value ? parseFloat(dealFormData.value) : 0,
        stage: dealFormData.stage,
        probability: dealFormData.probability
          ? parseInt(dealFormData.probability)
          : 50,
        closeDate: dealFormData.closeDate || null,
        description: dealFormData.description?.trim() || "",
        leadCompany: company.id,
        source: "FROM_LEAD",
        priority: "MEDIUM",
        // Auto-assign to current user
        assignedTo: user?.id || user?.documentId || null,
      };

      await dealService.create(dealData);

      // Refresh deals and company data
      await fetchDeals();
      await fetchCompanyData();

      setShowAddDealModal(false);
      setDealFormData({
        name: "",
        value: "",
        stage: "DISCOVERY",
        probability: 25,
        closeDate: "",
        description: "",
      });
      alert("Deal added successfully!");
    } catch (error) {
      console.error("Error adding deal:", error);

      let errorMessage = "Failed to add deal";
      if (error.message.includes("validation")) {
        errorMessage = "Please check your input and try again";
      } else if (error.message) {
        errorMessage = `Failed to add deal: ${error.message}`;
      }

      alert(errorMessage);
    }
  };

  const tabItems = [
    { key: "overview", label: "Overview" },
    { key: "contacts", label: "Contacts" },
    { key: "activities", label: "Activities" },
    { key: "deals", label: "Deals" },
    { key: "proposals", label: "Proposals" },
    { key: "meetings", label: "Meetings" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Company not found
          </h2>
          <p className="text-gray-600 mb-4">
            The lead company you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/sales/lead-companies")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lead Companies
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Enhanced Confetti Animation */}
      {showConfetti && (
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
              @keyframes confetti-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `,
            }}
          />
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {/* Enhanced Confetti Particles */}
            {[...Array(150)].map((_, i) => {
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
              const shape = Math.random() > 0.5 ? "rounded-full" : "rounded-sm";
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
                    boxShadow: `0 0 ${size / 2}px ${color}40`,
                  }}
                />
              );
            })}
          </div>
        </>
      )}

      <div className="p-4 space-y-4">
        <PageHeader
          title={company.name}
          subtitle={`${company.industry} • ${
            company.status === "CONVERTED" && company.convertedAccount
              ? "ACTIVE Client"
              : `${company.status} Lead`
          }`}
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Sales", href: "/sales" },
            { label: "Lead Companies", href: "/sales/lead-companies" },
            {
              label: company.name,
              href: `/sales/lead-companies/${company.id}`,
            },
          ]}
          showProfile={true}
          actions={[
            {
              icon: Edit,
              onClick: handleEditCompany,
              className: "",
              title: "Edit Company",
            },
            {
              icon: Share2,
              onClick: handleShareCompany,
              className: "",
              title: "Share Company",
            },
            {
              icon: Download,
              onClick: handleExportCompany,
              className: "",
              title: "Export Company Data",
            },
          ]}
        >
          {company.status === "CONVERTED" && company.convertedAccount ? (
            <Button
              onClick={() =>
                router.push(`/clients/accounts/${company.convertedAccount.id}`)
              }
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              View Client Account
            </Button>
          ) : (
            <Button
              onClick={() => setShowConvertModal(true)}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Convert to Client
            </Button>
          )}
        </PageHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1 font-medium">
                  Total Contacts
                </p>
                <p className="text-3xl font-black text-gray-800">
                  {contacts.length}
                </p>
              </div>
              <div className="w-16 h-16 bg-orange-50 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-orange-200">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1 font-medium">
                  Active Deals
                </p>
                <p className="text-3xl font-black text-gray-800">
                  {deals.length}
                </p>
              </div>
              <div className="w-16 h-16 bg-green-50 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-green-200">
                <Briefcase className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1 font-medium">
                  Deal Value
                </p>
                <p className="text-3xl font-black text-gray-800">
                  {formatCurrency(
                    deals.reduce(
                      (total, deal) => total + (parseFloat(deal.value) || 0),
                      0
                    )
                  )}
                </p>
              </div>
              <div className="w-16 h-16 bg-purple-50 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-purple-200">
                <IndianRupee className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1 font-medium">
                  Lead Score
                </p>
                <p className="text-3xl font-black text-gray-800">
                  {company.score}
                </p>
              </div>
              <div className="w-16 h-16 bg-yellow-50 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-yellow-200">
                <TrendingUp className="w-8 h-8 text-yellow-600" />
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
            {/* Company Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Company Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Industry
                      </label>
                      <p className="text-gray-900 mt-1">
                        {formatIndustry(company.industry)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Company Type
                      </label>
                      <p className="text-gray-900 mt-1">
                        {company.type === "startup-corporate"
                          ? "Startup and Corporates"
                          : company.type === "investor"
                          ? "Investors"
                          : company.type === "enablers-academia"
                          ? "Enablers & Academia"
                          : company.type || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Sub-Type
                      </label>
                      <p className="text-gray-900 mt-1">
                        {company.subType || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Founded
                      </label>
                      <p className="text-gray-900 mt-1">
                        {company.founded || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Employees
                      </label>
                      <p className="text-gray-900 mt-1">
                        {formatEmployeeSize(company.employees)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Headquarters
                      </label>
                      <p className="text-gray-900 mt-1">
                        {company.headquarters || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Lead Source
                      </label>
                      <div className="mt-1">
                        <Badge variant={getLeadSourceVariant(company.source)}>
                          {formatLeadSource(company.source)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Status
                      </label>
                      <div className="mt-1">
                        <Badge
                          variant={
                            company.status === "CONVERTED" &&
                            company.convertedAccount
                              ? "success"
                              : company.status === "LOST"
                              ? "gray"
                              : company.status === "QUALIFIED"
                              ? "success"
                              : "warning"
                          }
                        >
                          {company.status === "CONVERTED" &&
                          company.convertedAccount
                            ? "Active Client"
                            : formatStatus(company.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Description
                    </label>
                    <p className="text-gray-900 mt-1">
                      {company.description || "No description available"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                      <a
                        href={`https://${company.website}`}
                        className="text-orange-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {company.website}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-gray-900">{company.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900">{company.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="text-gray-900">{company.location}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Contact Information */}
              {(() => {
                const primaryContact = contacts.find(
                  (contact) => contact.role === "PRIMARY_CONTACT"
                );
                return (
                  primaryContact && (
                    <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Primary Contact Information
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {primaryContact.firstName}{" "}
                                {primaryContact.lastName}
                              </h4>
                              <Badge variant="info">Primary Contact</Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {primaryContact.title && (
                                <div>
                                  <span className="text-gray-500">
                                    Job Title
                                  </span>
                                  <p className="font-medium text-gray-900">
                                    {primaryContact.title}
                                  </p>
                                </div>
                              )}

                              {primaryContact.department && (
                                <div>
                                  <span className="text-gray-500">
                                    Department
                                  </span>
                                  <p className="font-medium text-gray-900">
                                    {primaryContact.department}
                                  </p>
                                </div>
                              )}

                              {primaryContact.email && (
                                <div>
                                  <span className="text-gray-500">Email</span>
                                  <a
                                    href={`mailto:${primaryContact.email}`}
                                    className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  >
                                    <Mail className="w-3 h-3" />
                                    {primaryContact.email}
                                  </a>
                                </div>
                              )}

                              {primaryContact.phone && (
                                <div>
                                  <span className="text-gray-500">Phone</span>
                                  <a
                                    href={`tel:${primaryContact.phone}`}
                                    className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  >
                                    <Phone className="w-3 h-3" />
                                    {primaryContact.phone}
                                  </a>
                                </div>
                              )}

                              {primaryContact.preferredContactMethod && (
                                <div>
                                  <span className="text-gray-500">
                                    Preferred Contact
                                  </span>
                                  <p className="font-medium text-gray-900">
                                    {primaryContact.preferredContactMethod}
                                  </p>
                                </div>
                              )}

                              {primaryContact.status && (
                                <div>
                                  <span className="text-gray-500">Status</span>
                                  <Badge
                                    variant={
                                      primaryContact.status === "ACTIVE"
                                        ? "success"
                                        : primaryContact.status === "NEW"
                                        ? "info"
                                        : primaryContact.status === "QUALIFIED"
                                        ? "warning"
                                        : "secondary"
                                    }
                                  >
                                    {primaryContact.status}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(
                                    `/sales/contacts/${primaryContact.id}`
                                  )
                                }
                                className="flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Contact Details
                              </Button>
                              {primaryContact.email && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    (window.location.href = `mailto:${primaryContact.email}`)
                                  }
                                  className="flex items-center gap-2"
                                >
                                  <Mail className="w-4 h-4" />
                                  Send Email
                                </Button>
                              )}
                              {primaryContact.phone && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    (window.location.href = `tel:${primaryContact.phone}`)
                                  }
                                  className="flex items-center gap-2"
                                >
                                  <Phone className="w-4 h-4" />
                                  Call
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                );
              })()}
            </div>

            {/* Company Owner & Stats */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Lead Owner
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar
                    alt={
                      company.assignedTo
                        ? `${company.assignedTo.firstName || ""} ${
                            company.assignedTo.lastName || ""
                          }`.trim() ||
                          company.assignedTo.username ||
                          "Unknown"
                        : "Unassigned"
                    }
                    fallback={
                      company.assignedTo
                        ? (
                            `${company.assignedTo.firstName || ""} ${
                              company.assignedTo.lastName || ""
                            }`.trim() ||
                            company.assignedTo.username ||
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
                      {company.assignedTo
                        ? `${company.assignedTo.firstName || ""} ${
                            company.assignedTo.lastName || ""
                          }`.trim() ||
                          company.assignedTo.username ||
                          "Unknown"
                        : "Unassigned"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {(() => {
                        const assignedTo = company.assignedTo;
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
                      <span className="text-sm text-gray-600">4.9 rating</span>
                    </div>
                  </div>
                  {isAdmin() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUserId(
                          company.assignedTo?.id?.toString() ||
                            company.assignedTo?.documentId?.toString() ||
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

              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Lead Health
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Health Score
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {company.health}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          company.health >= 80
                            ? "bg-green-500"
                            : company.health >= 60
                            ? "bg-orange-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${company.health}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last Activity</span>
                      <span className="text-gray-900">
                        {company.lastActivity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Activities</span>
                      <span className="text-gray-900">{activities.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Created Date</span>
                      <span className="text-gray-900">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Segment</span>
                      <Badge variant="warning">{company.segment}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Contacts</h3>
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
                <span className="ml-2 text-gray-600">Loading contacts...</span>
              </div>
            ) : contacts.length > 0 ? (
              <Table columns={contactColumns} data={contacts} />
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">👥</div>
                <p className="text-gray-600">
                  No contacts found for this company
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Add contacts to start building relationships
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "activities" && company && (
          <ActivitiesPanel
            entityType="leadCompany"
            entityId={company.id}
            entityName={company.name}
            onActivityCreated={fetchActivities}
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
            {tabLoading.deals ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-gray-600">Loading deals...</span>
              </div>
            ) : deals.length > 0 ? (
              <Table columns={dealColumns} data={deals} />
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">💼</div>
                <p className="text-gray-600">No deals found for this company</p>
                <p className="text-sm text-gray-500 mt-1">
                  Create deals to track opportunities
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "proposals" && (
          <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Proposals</h3>
              <Button
                size="sm"
                onClick={handleAddProposal}
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Proposal
              </Button>
            </div>
            {tabLoading.proposals ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-gray-600">Loading proposals...</span>
              </div>
            ) : proposals.length > 0 ? (
              <Table columns={proposalColumns} data={proposals} />
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📄</div>
                <p className="text-gray-600">
                  No proposals found for this company
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Create proposals to present your solutions
                </p>
              </div>
            )}
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
                able to schedule, manage, and track meetings with this company
                soon.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Convert to Client Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-pink-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-orange-600" />
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
                <strong>{company.companyName}</strong> to a client account?
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
                onClick={() => setShowConvertModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConvertToClient}
                disabled={isConverting}
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isConverting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Converting...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Convert to Client
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && (
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

      {/* Add Deal Modal */}
      {showAddDealModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add Deal</h2>
                <Button
                  onClick={() => setShowAddDealModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  variant="ghost"
                  size="sm"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleDealSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deal Name *
                  </label>
                  <input
                    type="text"
                    value={dealFormData.name}
                    onChange={(e) =>
                      setDealFormData({ ...dealFormData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deal Value
                    </label>
                    <input
                      type="number"
                      value={dealFormData.value}
                      onChange={(e) =>
                        setDealFormData({
                          ...dealFormData,
                          value: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stage
                    </label>
                    <select
                      value={dealFormData.stage}
                      onChange={(e) =>
                        setDealFormData({
                          ...dealFormData,
                          stage: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="DISCOVERY">Discovery</option>
                      <option value="PROPOSAL">Proposal</option>
                      <option value="NEGOTIATION">Negotiation</option>
                      <option value="CLOSED_WON">Closed Won</option>
                      <option value="CLOSED_LOST">Closed Lost</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Probability (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={dealFormData.probability}
                      onChange={(e) =>
                        setDealFormData({
                          ...dealFormData,
                          probability: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Close Date
                    </label>
                    <input
                      type="date"
                      value={dealFormData.closeDate}
                      onChange={(e) =>
                        setDealFormData({
                          ...dealFormData,
                          closeDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={dealFormData.description}
                    onChange={(e) =>
                      setDealFormData({
                        ...dealFormData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowAddDealModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                  >
                    Add Deal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign User Modal */}
      {showAssignModal && (
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
                Select a user to assign <strong>{company?.companyName}</strong>{" "}
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
                    await leadCompanyService.update(company.id, {
                      assignedTo: selectedUserId || null,
                    });
                    // Refresh company data
                    await fetchCompanyData();
                    // Close modal
                    setShowAssignModal(false);
                    setSelectedUserId("");
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
