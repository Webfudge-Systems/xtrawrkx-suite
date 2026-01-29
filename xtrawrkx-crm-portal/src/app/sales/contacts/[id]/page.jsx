"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Activity,
  MessageSquare,
  IndianRupee,
  FileText,
  Edit,
  Share,
  Download,
  MoreHorizontal,
  Plus,
  Eye,
  Trash2,
  Globe,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Users,
  TrendingUp,
  PhoneCall,
  UserPlus,
  ClipboardList,
} from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Avatar,
  Tabs,
  EmptyState,
  Modal,
} from "../../../../components/ui";
import PageHeader from "../../../../components/PageHeader";
import contactService from "../../../../lib/api/contactService";
import ActivitiesPanel from "../../../../components/activities/ActivitiesPanel";
import strapiClient from "../../../../lib/strapiClient";
import { useAuth } from "../../../../contexts/AuthContext";
import authService from "../../../../lib/authService";
import { Select } from "../../../../components/ui";

const ContactDetailPage = ({ params }) => {
  const router = useRouter();
  const { id } = params;
  const { user } = useAuth();

  const [contact, setContact] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

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
      fetchContactDetails();
    }
  }, [id]);

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [user]);

  const fetchContactDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await contactService.getById(id, {
        populate: ["leadCompany", "clientAccount", "assignedTo"],
      });


      // Handle the service response structure
      const contactData = response?.data || response;

      if (!contactData || !contactData.id) {
        setError("Contact not found");
        return;
      }

      // Handle both direct contact data and nested attributes
      const contact = contactData.attributes || contactData;

      setContact({
        id: contactData.id,
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email || "",
        phone: contact.phone || "",
        title: contact.title || "",
        department: contact.department || "",
        role: contact.role || "TECHNICAL_CONTACT",
        status: contact.status || "ACTIVE",
        address: contact.address || "",
        location: contact.location || "",
        city: contact.city || "",
        state: contact.state || "",
        country: contact.country || "",
        zipCode: contact.zipCode || "",
        birthday: contact.birthday || "",
        linkedIn: contact.linkedIn || "",
        twitter: contact.twitter || "",
        notes: contact.notes || "",
        description: contact.description || "",
        leadCompany: contact.leadCompany || contactData.leadCompany,
        clientAccount: contact.clientAccount || contactData.clientAccount,
        assignedTo: contact.assignedTo || contactData.assignedTo,
        createdAt: contact.createdAt || contactData.createdAt,
        updatedAt: contact.updatedAt || contactData.updatedAt,
      });

      // Try to fetch activity timeline if available
      try {
        const timelineData = await contactService.getActivityTimeline(id);
        setActivities(timelineData.activities || []);
      } catch (activityError) {
        setActivities([]);
      }
    } catch (err) {
      console.error("Error fetching contact details:", err);
      setError("Failed to load contact details");
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

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await contactService.delete(id);
      router.push("/sales/contacts");
    } catch (err) {
      console.error("Error deleting contact:", err);
      alert("Failed to delete contact");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await contactService.updateStatus(id, newStatus);
      setContact((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "success";
      case "NEW":
        return "info";
      case "QUALIFIED":
        return "warning";
      case "INACTIVE":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Tab items
  const tabItems = [
    { key: "overview", label: "Overview" },
    { key: "activity", label: "Activities" },
    { key: "details", label: "Details" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contact details...</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Contact not found
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "The contact you're looking for doesn't exist."}
          </p>
          <Button onClick={() => router.push("/sales/contacts")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contacts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 space-y-4">
        {/* Page Header */}
        <PageHeader
          title={
            contact ? `${contact.firstName} ${contact.lastName}` : "Loading..."
          }
          subtitle={
            contact
              ? `${contact.title || "Contact"} • ${
                  contact.status || "ACTIVE"
                } Contact`
              : "Loading contact details..."
          }
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Sales", href: "/sales" },
            { label: "Contacts", href: "/sales/contacts" },
            {
              label: contact
                ? `${contact.firstName} ${contact.lastName}`
                : "Contact",
              href: `/sales/contacts/${id}`,
            },
          ]}
          showProfile={true}
          actions={[
            {
              icon: Edit,
              onClick: () => router.push(`/sales/contacts/${id}/edit`),
              className: "",
              title: "Edit Contact",
            },
            {
              icon: Share,
              onClick: () => {},
              className: "",
              title: "Share Contact",
            },
            {
              icon: MoreHorizontal,
              onClick: () => {},
              className: "",
              title: "More Actions",
            },
          ]}
        />

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading contact details...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button
                onClick={() => fetchContactDetails()}
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Contact Content */}
        {!loading && !error && contact && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1 font-medium">
                      Status
                    </p>
                    <p className="text-3xl font-black text-gray-800">
                      {contact.status || "ACTIVE"}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-blue-50 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-blue-200">
                    <CheckCircle className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1 font-medium">
                      Activities
                    </p>
                    <p className="text-3xl font-black text-gray-800">
                      {activities.length}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-green-50 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-green-200">
                    <Activity className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1 font-medium">
                      Source
                    </p>
                    <p className="text-3xl font-black text-gray-800">
                      {contact.source || "MANUAL"}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-purple-50 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-purple-200">
                    <Users className="w-8 h-8 text-purple-600" />
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
                      {formatDate(contact.createdAt)}
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
                {/* Contact Information */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Email
                          </label>
                          <p className="text-gray-900">{contact.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Phone
                          </label>
                          <p className="text-gray-900">
                            {contact.phone || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Location
                          </label>
                          <p className="text-gray-900 flex items-center gap-1">
                            {contact.location ? (
                              <>
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {contact.location}
                              </>
                            ) : (
                              "Not specified"
                            )}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Department
                          </label>
                          <p className="text-gray-900">
                            {contact.department || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Preferred Contact Method
                          </label>
                          <p className="text-gray-900">
                            {contact.preferredContactMethod || "Email"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Source
                          </label>
                          <Badge variant="info">
                            {contact.source || "MANUAL"}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Status
                          </label>
                          <Badge variant={getStatusColor(contact.status)}>
                            {contact.status || "ACTIVE"}
                          </Badge>
                        </div>
                      </div>
                      {contact.description && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            About
                          </label>
                          <p className="text-gray-900 mt-1 whitespace-pre-wrap leading-relaxed">
                            {contact.description}
                          </p>
                        </div>
                      )}
                      {contact.notes && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Notes
                          </label>
                          <p className="text-gray-900 mt-1">{contact.notes}</p>
                        </div>
                      )}
                      {(contact.linkedIn || contact.twitter) && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 mb-2">
                            Social Media
                          </label>
                          <div className="flex items-center gap-2 flex-wrap">
                            {contact.linkedIn && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const linkedInUrl =
                                    contact.linkedIn.startsWith("http")
                                      ? contact.linkedIn
                                      : `https://${contact.linkedIn}`;
                                  window.open(
                                    linkedInUrl,
                                    "_blank",
                                    "noopener,noreferrer"
                                  );
                                }}
                                className="flex items-center gap-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Open LinkedIn
                              </Button>
                            )}
                            {contact.twitter && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const twitterUrl = contact.twitter.startsWith(
                                    "http"
                                  )
                                    ? contact.twitter
                                    : contact.twitter.startsWith("@")
                                    ? `https://twitter.com/${contact.twitter.slice(
                                        1
                                      )}`
                                    : `https://twitter.com/${contact.twitter}`;
                                  window.open(
                                    twitterUrl,
                                    "_blank",
                                    "noopener,noreferrer"
                                  );
                                }}
                                className="flex items-center gap-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Open Twitter
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Information */}
                  {(contact.company ||
                    contact.clientAccount ||
                    contact.leadCompany) && (
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
                                {contact.clientAccount?.companyName ||
                                  contact.leadCompany?.companyName ||
                                  contact.company ||
                                  "Unknown Company"}
                              </h4>
                              {contact.clientAccount && (
                                <Badge variant="success">Client</Badge>
                              )}
                              {contact.leadCompany && (
                                <Badge variant="info">Lead</Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {contact.clientAccount?.industry ||
                              contact.leadCompany?.industry ? (
                                <div>
                                  <span className="text-gray-500">
                                    Industry
                                  </span>
                                  <p className="font-medium text-gray-900">
                                    {contact.clientAccount?.industry ||
                                      contact.leadCompany?.industry}
                                  </p>
                                </div>
                              ) : null}

                              {contact.clientAccount?.website ||
                              contact.leadCompany?.website ? (
                                <div>
                                  <span className="text-gray-500">Website</span>
                                  <a
                                    href={
                                      contact.clientAccount?.website ||
                                      contact.leadCompany?.website
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  >
                                    <Globe className="w-3 h-3" />
                                    {(
                                      contact.clientAccount?.website ||
                                      contact.leadCompany?.website
                                    )?.replace(/^https?:\/\//, "")}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              ) : null}

                              {contact.clientAccount?.employees ||
                              contact.leadCompany?.employees ? (
                                <div>
                                  <span className="text-gray-500">
                                    Employees
                                  </span>
                                  <p className="font-medium text-gray-900">
                                    {contact.clientAccount?.employees ||
                                      contact.leadCompany?.employees}
                                  </p>
                                </div>
                              ) : null}

                              {contact.clientAccount?.location ||
                              contact.leadCompany?.headquarters ? (
                                <div>
                                  <span className="text-gray-500">
                                    Location
                                  </span>
                                  <p className="font-medium text-gray-900">
                                    {contact.clientAccount?.location ||
                                      contact.leadCompany?.headquarters}
                                  </p>
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                              {contact.clientAccount && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    router.push(
                                      `/clients/accounts/${contact.clientAccount.id}`
                                    )
                                  }
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Client Account
                                </Button>
                              )}
                              {contact.leadCompany && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    router.push(
                                      `/sales/lead-companies/${contact.leadCompany.id}`
                                    )
                                  }
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Lead Company
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address Information */}
                  {(contact.address ||
                    contact.location ||
                    contact.city ||
                    contact.state ||
                    contact.country) && (
                    <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Address Information
                      </h3>
                      <div className="space-y-2">
                        {contact.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900 font-medium">
                              {contact.location}
                            </p>
                          </div>
                        )}
                        {contact.address && (
                          <p className="text-gray-900">{contact.address}</p>
                        )}
                        <p className="text-gray-900">
                          {[
                            contact.city,
                            contact.state,
                            contact.zipCode,
                            contact.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                  {/* Contact Owner */}
                  <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Contact Owner
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar
                        alt={
                          contact?.assignedTo
                            ? `${contact.assignedTo.firstName || ""} ${
                                contact.assignedTo.lastName || ""
                              }`.trim() ||
                              contact.assignedTo.username ||
                              "Unknown"
                            : "Unassigned"
                        }
                        fallback={
                          contact?.assignedTo
                            ? (
                                `${contact.assignedTo.firstName || ""} ${
                                  contact.assignedTo.lastName || ""
                                }`.trim() ||
                                contact.assignedTo.username ||
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
                          {contact?.assignedTo
                            ? `${contact.assignedTo.firstName || ""} ${
                                contact.assignedTo.lastName || ""
                              }`.trim() ||
                              contact.assignedTo.username ||
                              "Unknown"
                            : "Unassigned"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {(() => {
                            const assignedTo = contact?.assignedTo;
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
                              contact?.assignedTo?.id?.toString() ||
                                contact?.assignedTo?.documentId?.toString() ||
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

                  {/* Contact Health */}
                  <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Contact Health
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">
                            Health Score
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            75%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                            style={{ width: "75%" }}
                          ></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Last Activity</span>
                          <p className="font-medium text-gray-900">
                            {activities.length > 0
                              ? "Recent"
                              : "No recent activity"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            Total Activities
                          </span>
                          <p className="font-medium text-gray-900">
                            {activities.length}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Created Date</span>
                          <p className="font-medium text-gray-900">
                            {formatDate(contact.createdAt)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Segment</span>
                          <Badge variant="warning">WARM</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Quick Links
                    </h3>
                    <div className="space-y-3">
                      {contact.linkedIn && (
                        <Button
                          variant="outline"
                          className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                          onClick={() => {
                            const linkedInUrl = contact.linkedIn.startsWith(
                              "http"
                            )
                              ? contact.linkedIn
                              : `https://${contact.linkedIn}`;
                            window.open(
                              linkedInUrl,
                              "_blank",
                              "noopener,noreferrer"
                            );
                          }}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open LinkedIn Profile
                        </Button>
                      )}
                      {contact.email && (
                        <Button
                          variant="outline"
                          className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                          onClick={() => {
                            const subject = encodeURIComponent(
                              `Follow up - ${contact.firstName} ${contact.lastName}`
                            );
                            window.open(
                              `mailto:${contact.email}?subject=${subject}`,
                              "_self"
                            );
                          }}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </Button>
                      )}
                      {contact.phone && (
                        <Button
                          variant="outline"
                          className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                          onClick={() => {
                            window.open(`tel:${contact.phone}`, "_self");
                          }}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call Contact
                        </Button>
                      )}
                      {contact.twitter && (
                        <Button
                          variant="outline"
                          className="w-full justify-start text-sky-600 hover:text-sky-700 hover:bg-sky-50 border-sky-200"
                          onClick={() => {
                            const twitterUrl = contact.twitter.startsWith(
                              "http"
                            )
                              ? contact.twitter
                              : contact.twitter.startsWith("@")
                              ? `https://twitter.com/${contact.twitter.slice(
                                  1
                                )}`
                              : `https://twitter.com/${contact.twitter}`;
                            window.open(
                              twitterUrl,
                              "_blank",
                              "noopener,noreferrer"
                            );
                          }}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Twitter
                        </Button>
                      )}
                      {!contact.linkedIn &&
                        !contact.email &&
                        !contact.phone &&
                        !contact.twitter && (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No quick links available
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && contact && (
              <ActivitiesPanel
                entityType="contact"
                entityId={contact.id}
                entityName={`${contact.firstName} ${contact.lastName}`}
                onActivityCreated={fetchContactDetails}
              />
            )}

            {activeTab === "details" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    System Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Contact ID</p>
                      <p className="text-gray-900 font-mono">{contact.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="text-gray-900">
                        {formatDate(contact.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="text-gray-900">
                        {formatDate(contact.updatedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Source</p>
                      <p className="text-gray-900">
                        {contact.source || "Manual Entry"}
                      </p>
                    </div>
                    {contact.timezone && (
                      <div>
                        <p className="text-sm text-gray-500">Timezone</p>
                        <p className="text-gray-900">{contact.timezone}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleStatusUpdate("ACTIVE")}
                      disabled={contact.status === "ACTIVE"}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Active
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleStatusUpdate("QUALIFIED")}
                      disabled={contact.status === "QUALIFIED"}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Mark as Qualified
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleStatusUpdate("INACTIVE")}
                      disabled={contact.status === "INACTIVE"}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Mark as Inactive
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setIsDeleteModalOpen(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Contact
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Contact"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete{" "}
              <strong>
                {contact
                  ? `${contact.firstName} ${contact.lastName}`
                  : "this contact"}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {isDeleting ? "Deleting..." : "Delete Contact"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Assign Owner Modal */}
        {showAssignModal && contact && (
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
                  <strong>
                    {contact.firstName} {contact.lastName}
                  </strong>{" "}
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
                      await contactService.update(contact.id, {
                        assignedTo: selectedUserId || null,
                      });
                      // Refresh contact data
                      await fetchContactDetails();
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
      </div>
    </div>
  );
};

export default ContactDetailPage;
