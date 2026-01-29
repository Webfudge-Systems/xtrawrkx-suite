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
} from "lucide-react";
import { Card, Badge, Avatar, Button, Table } from "../../../../components/ui";
import PageHeader from "../../../../components/PageHeader";
import clientAccountService from "../../../../lib/api/clientAccountService";
import contactService from "../../../../lib/api/contactService";
import activityService from "../../../../lib/api/activityService";

const ClientAccountDetailPage = ({ params }) => {
  const router = useRouter();
  const { id } = params;

  const [account, setAccount] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [healthDetails, setHealthDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [contactsLoading, setContactsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAccountDetails();
    }
  }, [id]);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);

      // Fetch account data first with error handling
      let accountData;
      try {
        accountData = await clientAccountService.getById(id);
        setAccount(accountData);
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
      setHealthDetails(
        healthData.status === "fulfilled" ? healthData.value : {}
      );

      // Mock deals and projects data - replace with actual API calls when available
      setDeals([
        {
          id: 1,
          name: "Enterprise Software License",
          value: 150000,
          stage: "CLOSED_WON",
          probability: 100,
          closeDate: "2024-01-20",
          createdAt: "2023-12-01",
        },
        {
          id: 2,
          name: "Consulting Services Q2",
          value: 75000,
          stage: "NEGOTIATION",
          probability: 80,
          closeDate: "2024-03-15",
          createdAt: "2024-01-15",
        },
        {
          id: 3,
          name: "Support & Maintenance",
          value: 25000,
          stage: "PROPOSAL",
          probability: 60,
          closeDate: "2024-02-28",
          createdAt: "2024-01-10",
        },
      ]);

      setProjects([
        {
          id: 1,
          name: "System Implementation",
          status: "IN_PROGRESS",
          progress: 75,
          startDate: "2024-01-01",
          endDate: "2024-03-31",
          manager: "John Smith",
        },
        {
          id: 2,
          name: "Data Migration",
          status: "COMPLETED",
          progress: 100,
          startDate: "2023-11-01",
          endDate: "2023-12-31",
          manager: "Sarah Johnson",
        },
        {
          id: 3,
          name: "Training Program",
          status: "PLANNED",
          progress: 0,
          startDate: "2024-04-01",
          endDate: "2024-05-15",
          manager: "Mike Chen",
        },
      ]);

      setInvoices([
        {
          id: "INV-2024-001",
          amount: 150000,
          status: "PAID",
          issueDate: "2024-01-15",
          dueDate: "2024-02-15",
          paidDate: "2024-02-10",
          description: "Enterprise Software License - Annual",
          items: [
            {
              description: "Software License",
              quantity: 1,
              rate: 120000,
              amount: 120000,
            },
            {
              description: "Implementation Services",
              quantity: 1,
              rate: 30000,
              amount: 30000,
            },
          ],
        },
        {
          id: "INV-2024-002",
          amount: 25000,
          status: "PENDING",
          issueDate: "2024-02-01",
          dueDate: "2024-03-01",
          paidDate: null,
          description: "Monthly Support & Maintenance",
          items: [
            {
              description: "Support Services",
              quantity: 1,
              rate: 25000,
              amount: 25000,
            },
          ],
        },
        {
          id: "INV-2024-003",
          amount: 75000,
          status: "OVERDUE",
          issueDate: "2023-12-15",
          dueDate: "2024-01-15",
          paidDate: null,
          description: "Consulting Services Q4 2023",
          items: [
            {
              description: "Consulting Hours",
              quantity: 150,
              rate: 500,
              amount: 75000,
            },
          ],
        },
      ]);
    } catch (err) {
      console.error("Error fetching account details:", err);
      setError("Failed to load account details");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/sales/accounts/${id}/edit`);
  };

  const handleDelete = async () => {
    if (
      window.confirm("Are you sure you want to delete this client account?")
    ) {
      try {
        await clientAccountService.delete(id);
        router.push("/sales/accounts");
      } catch (err) {
        console.error("Error deleting account:", err);
        alert("Failed to delete account");
      }
    }
  };

  const handleSetPrimaryContact = async (contactId) => {
    try {
      setContactsLoading(true);

      // First, remove primary contact role from all other contacts in this account
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

    } catch (error) {
      console.error("Error setting primary contact:", error);
      alert("Failed to set primary contact");
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
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "PLANNED":
        return "bg-gray-100 text-gray-800";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
                onClick={() => router.push("/sales/accounts")}
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
          {contact.role?.replace("_", " ") || "TECHNICAL CONTACT"}
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
            title="More Options"
          >
            <MoreHorizontal className="w-4 h-4" />
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
    { key: "invoices", label: "Invoices" },
    { key: "meetings", label: "Meetings" },
    { key: "health", label: "Account Health" },
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="p-4 space-y-4">
        <PageHeader
          title={account.companyName}
          subtitle={`Client Account • ${
            account.industry || "Industry not specified"
          } • ${account.type || "Customer"}`}
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Sales", href: "/sales" },
            { label: "Client Accounts", href: "/sales/accounts" },
            { label: account.companyName, href: `/sales/accounts/${id}` },
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

                  {account.employees && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{account.employees} employees</span>
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
                ${totalDealValue.toLocaleString()}
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
                          ? `$${account.revenue.toLocaleString()}`
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
                        Account Manager
                      </label>
                      <span className="text-gray-900">
                        {account.accountManager
                          ? `${account.accountManager.firstName} ${account.accountManager.lastName}`
                          : "Not assigned"}
                      </span>
                    </div>

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
                {/* Account Health */}
                <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Account Health
                  </h3>

                  {account.healthScore && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          Overall Score
                        </span>
                        <span
                          className={`text-lg font-bold ${getHealthScoreColor(
                            account.healthScore
                          )}`}
                        >
                          {account.healthScore}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            account.healthScore >= 80
                              ? "bg-green-500"
                              : account.healthScore >= 60
                              ? "bg-yellow-500"
                              : account.healthScore >= 40
                              ? "bg-orange-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${account.healthScore}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Last Activity</span>
                      <span className="font-semibold text-gray-900">
                        {account.lastActivityDate
                          ? new Date(
                              account.lastActivityDate
                            ).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Revenue</span>
                      <span className="font-semibold text-gray-900">
                        $
                        {wonDeals
                          .reduce((sum, deal) => sum + deal.value, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Deal Value</span>
                      <span className="font-semibold text-gray-900">
                        ${activeDealValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Outstanding Invoices
                      </span>
                      <span className="font-semibold text-gray-900">
                        $
                        {invoices
                          .filter((inv) => inv.status !== "PAID")
                          .reduce((sum, inv) => sum + inv.amount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Customer Lifetime Value
                      </span>
                      <span className="font-semibold text-gray-900">
                        $
                        {(
                          wonDeals.reduce((sum, deal) => sum + deal.value, 0) +
                          invoices
                            .filter((inv) => inv.status === "PAID")
                            .reduce((sum, inv) => sum + inv.amount, 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

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

          {activeTab === "deals" && (
            <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Account Deals
                </h3>
                <button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" />
                  Create Deal
                </button>
              </div>

              <div className="space-y-4">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm border border-white/30 shadow-md hover:shadow-lg rounded-xl p-4 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {deal.name}
                        </h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />$
                            {deal.value.toLocaleString()}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getDealStageColor(
                              deal.stage
                            )}`}
                          >
                            {deal.stage.replace("_", " ")}
                          </span>
                          <span>{deal.probability}% probability</span>
                          <span>
                            Close:{" "}
                            {new Date(deal.closeDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Account Projects
                </h3>
                <button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" />
                  Create Project
                </button>
              </div>

              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm border border-white/30 shadow-md hover:shadow-lg rounded-xl p-4 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {project.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Manager: {project.manager}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getProjectStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          {new Date(project.startDate).toLocaleDateString()}
                        </span>
                        <span>
                          {new Date(project.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "invoices" && (
            <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Account Invoices
                </h3>
                <button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" />
                  Create Invoice
                </button>
              </div>

              {/* Invoice Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">
                        Total Paid
                      </p>
                      <p className="text-xl font-bold text-green-900">
                        $
                        {invoices
                          .filter((inv) => inv.status === "PAID")
                          .reduce((sum, inv) => sum + inv.amount, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">
                        Pending
                      </p>
                      <p className="text-xl font-bold text-yellow-900">
                        $
                        {invoices
                          .filter((inv) => inv.status === "PENDING")
                          .reduce((sum, inv) => sum + inv.amount, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">
                        Overdue
                      </p>
                      <p className="text-xl font-bold text-red-900">
                        $
                        {invoices
                          .filter((inv) => inv.status === "OVERDUE")
                          .reduce((sum, inv) => sum + inv.amount, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        Total Invoices
                      </p>
                      <p className="text-xl font-bold text-blue-900">
                        {invoices.length}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Invoices List */}
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm border border-white/30 shadow-md hover:shadow-lg rounded-xl p-4 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {invoice.id}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {invoice.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ${invoice.amount.toLocaleString()}
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getInvoiceStatusColor(
                            invoice.status
                          )}`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Issued:</span>
                        <br />
                        {new Date(invoice.issueDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Due:</span>
                        <br />
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                      {invoice.paidDate && (
                        <div>
                          <span className="font-medium">Paid:</span>
                          <br />
                          {new Date(invoice.paidDate).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button className="text-orange-600 hover:text-orange-900 p-1 rounded transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                  The Meetings feature is currently under development. You'll be able to schedule, manage, and track meetings with this account soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientAccountDetailPage;
