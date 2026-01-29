"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  Button,
  Input,
  Select,
  Textarea,
  Badge,
} from "../../../../../components/ui";
import PageHeader from "../../../../../components/PageHeader";
import dealService from "../../../../../lib/api/dealService";
import leadCompanyService from "../../../../../lib/api/leadCompanyService";
import clientAccountService from "../../../../../lib/api/clientAccountService";
import contactService from "../../../../../lib/api/contactService";
import dealGroupService from "../../../../../lib/api/dealGroupService";
import strapiClient from "../../../../../lib/strapiClient";
import { useAuth } from "../../../../../contexts/AuthContext";
import DealGroupModal from "../../components/DealGroupModal";
import {
  Target,
  Building2,
  User,
  IndianRupee,
  Calendar,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  FolderPlus,
} from "lucide-react";

export default function EditDealPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const dealId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Deal data
  const [dealData, setDealData] = useState({
    name: "",
    stage: "DISCOVERY",
    value: "",
    probability: 50,
    priority: "MEDIUM",
    source: "FROM_ACCOUNT",
    closeDate: "",
    description: "",
    leadCompany: "",
    clientAccount: "",
    contact: "",
    assignedTo: "",
    visibility: "PUBLIC",
    dealGroup: "",
    visibleTo: [],
  });

  // Dropdown options
  const [leadCompanies, setLeadCompanies] = useState([]);
  const [clientAccounts, setClientAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [convertedClientAccount, setConvertedClientAccount] = useState(null);
  const [isCheckingConversion, setIsCheckingConversion] = useState(false);
  const [dealGroups, setDealGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [isDealGroupModalOpen, setIsDealGroupModalOpen] = useState(false);
  const [originalStage, setOriginalStage] = useState(null);

  const stageOptions = [
    { value: "DISCOVERY", label: "Discovery" },
    { value: "PROPOSAL", label: "Proposal" },
    { value: "NEGOTIATION", label: "Negotiation" },
    { value: "CLOSED_WON", label: "Closed Won" },
    { value: "CLOSED_LOST", label: "Closed Lost" },
  ];

  const priorityOptions = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
  ];

  const sourceOptions = [
    { value: "FROM_ACCOUNT", label: "From Account" },
    { value: "FROM_LEAD", label: "From Lead" },
    { value: "MANUAL", label: "Manual" },
  ];

  const visibilityOptions = [
    { value: "PUBLIC", label: "Public" },
    { value: "PRIVATE", label: "Private" },
  ];

  // Fetch deal data and dropdown options on component mount
  useEffect(() => {
    fetchDealData();
    fetchDropdownOptions();
    fetchDealGroups();
    fetchUsers();
  }, [dealId]);

  const fetchDealData = async () => {
    try {
      setIsLoading(true);
      const response = await dealService.getById(dealId, {
        populate: [
          "leadCompany",
          "clientAccount",
          "contact",
          "assignedTo",
          "dealGroup",
          "visibleTo",
        ],
      });


      const deal = response?.data || response;

      if (deal && (deal.id || deal.documentId)) {
        // Handle both direct deal data and nested attributes
        const dealInfo = deal.attributes || deal;

        // Format close date for input field
        let formattedCloseDate = "";
        if (dealInfo.closeDate) {
          const date = new Date(dealInfo.closeDate);
          formattedCloseDate = date.toISOString().split("T")[0];
        }

        const leadCompanyId =
          dealInfo.leadCompany?.id ||
          deal.leadCompany?.id ||
          dealInfo.leadCompany?.documentId ||
          deal.leadCompany?.documentId ||
          "";
        const clientAccountId =
          dealInfo.clientAccount?.id ||
          deal.clientAccount?.id ||
          dealInfo.clientAccount?.documentId ||
          deal.clientAccount?.documentId ||
          "";

        const originalStage = dealInfo.stage || "DISCOVERY";

        setDealData({
          name: dealInfo.name || "",
          stage: originalStage,
          value: dealInfo.value?.toString() || "",
          probability: dealInfo.probability || 50,
          priority: dealInfo.priority || "MEDIUM",
          source: dealInfo.source || "FROM_ACCOUNT",
          closeDate: formattedCloseDate,
          description: dealInfo.description || "",
          leadCompany: leadCompanyId,
          clientAccount: clientAccountId,
          contact:
            dealInfo.contact?.id ||
            deal.contact?.id ||
            dealInfo.contact?.documentId ||
            deal.contact?.documentId ||
            "",
          assignedTo:
            dealInfo.assignedTo?.id ||
            deal.assignedTo?.id ||
            dealInfo.assignedTo?.documentId ||
            deal.assignedTo?.documentId ||
            "",
          visibility: dealInfo.visibility || deal.visibility || "PUBLIC",
          dealGroup:
            dealInfo.dealGroup?.id ||
            deal.dealGroup?.id ||
            dealInfo.dealGroup?.documentId ||
            deal.dealGroup?.documentId ||
            "",
          visibleTo: (dealInfo.visibleTo || deal.visibleTo || [])
            .map((user) => (user.id || user.documentId)?.toString())
            .filter(Boolean),
        });

        // Store original stage for comparison
        setOriginalStage(originalStage);

        // Fetch contacts for the selected company if one exists
        if (leadCompanyId || clientAccountId) {
          fetchContactsForCompany(leadCompanyId, clientAccountId);
        }

        // Check if lead company has been converted
        if (leadCompanyId) {
          checkLeadCompanyConversion(leadCompanyId);
        }
      } else {
        console.error("No deal data found");
        setErrors({ general: "Deal not found" });
      }
    } catch (error) {
      console.error("Error fetching deal:", error);
      setErrors({ general: "Failed to load deal data" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDropdownOptions = async () => {
    try {
      // Fetch lead companies
      const leadCompaniesResponse = await leadCompanyService.getAll({
        pagination: { pageSize: 1000 },
        sort: ["companyName:asc"],
      });
      // Handle different response structures
      const leadCompaniesData = Array.isArray(leadCompaniesResponse)
        ? leadCompaniesResponse
        : leadCompaniesResponse?.data || [];
      setLeadCompanies(leadCompaniesData);

      // Fetch client accounts
      const clientAccountsResponse = await clientAccountService.getAll({
        pagination: { pageSize: 1000 },
        sort: ["companyName:asc"],
      });
      // Handle different response structures
      // The API returns data directly as an array, not wrapped in a data property
      const clientAccountsData = Array.isArray(clientAccountsResponse)
        ? clientAccountsResponse
        : clientAccountsResponse?.data || [];
      setClientAccounts(clientAccountsData);

      // Fetch contacts
      const contactsResponse = await contactService.getAll({
        pagination: { pageSize: 1000 },
        sort: ["firstName:asc", "lastName:asc"],
      });
      // Handle different response structures
      const contactsData = Array.isArray(contactsResponse)
        ? contactsResponse
        : contactsResponse?.data || [];
      setContacts(contactsData);
    } catch (error) {
      console.error("Error fetching dropdown options:", error);
    }
  };

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
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Function to fetch contacts for a company
  const fetchContactsForCompany = async (leadCompanyId, clientAccountId) => {
    if (!leadCompanyId && !clientAccountId) {
      setFilteredContacts([]);
      return;
    }

    try {
      setLoadingContacts(true);
      let contactsResponse;

      if (leadCompanyId) {
        contactsResponse = await contactService.getByLeadCompany(leadCompanyId);
      } else if (clientAccountId) {
        contactsResponse = await contactService.getByClientAccount(
          clientAccountId
        );
      }

      const contactsData = contactsResponse?.data || [];
      setFilteredContacts(contactsData);
    } catch (error) {
      console.error("Error fetching filtered contacts:", error);
      setFilteredContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleInputChange = async (field, value) => {
    let shouldClearConvertedAccount = false;

    setDealData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      // Clear contact when company changes
      if (field === "leadCompany" || field === "clientAccount") {
        updated.contact = "";
        // Clear the other company field when one is selected
        // Exception: if selecting the converted account, keep the lead company
        if (field === "leadCompany" && value) {
          // Only clear client account if it's not the converted account
          const isConvertedAccount =
            convertedClientAccount &&
            (convertedClientAccount.id === prev.clientAccount ||
              convertedClientAccount.documentId === prev.clientAccount);
          if (!isConvertedAccount) {
            updated.clientAccount = "";
          }
        } else if (field === "clientAccount" && value) {
          // Check if the selected client account is the converted account
          const isConvertedAccount =
            convertedClientAccount &&
            (convertedClientAccount.id === value ||
              convertedClientAccount.documentId === value);
          // Only clear lead company if it's NOT the converted account
          if (!isConvertedAccount) {
            updated.leadCompany = "";
            shouldClearConvertedAccount = true;
          }
        }
      }

      return updated;
    });

    // Clear converted account if needed
    if (shouldClearConvertedAccount) {
      setConvertedClientAccount(null);
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    // Check if lead company has been converted to client account
    if (field === "leadCompany" && value) {
      await checkLeadCompanyConversion(value);
    } else if (field === "leadCompany" && !value) {
      // Clear converted account info if lead company is cleared
      setConvertedClientAccount(null);
    }
  };

  const checkLeadCompanyConversion = async (leadCompanyId) => {
    try {
      setIsCheckingConversion(true);

      const leadCompany = await leadCompanyService.getById(leadCompanyId, {
        populate: ["convertedAccount"],
      });


      const leadCompanyData = leadCompany?.data || leadCompany;
      const convertedAccount =
        leadCompanyData?.convertedAccount ||
        leadCompanyData?.attributes?.convertedAccount ||
        leadCompany?.convertedAccount;

      if (convertedAccount) {
        const accountId =
          convertedAccount.id ||
          convertedAccount.documentId ||
          convertedAccount;
        const accountData = convertedAccount.attributes || convertedAccount;
        setConvertedClientAccount({
          id: accountId,
          documentId: accountId,
          ...accountData,
        });
      } else {
        setConvertedClientAccount(null);
      }
    } catch (error) {
      console.error("Error checking lead company conversion:", error);
      setConvertedClientAccount(null);
    } finally {
      setIsCheckingConversion(false);
    }
  };

  // Fetch contacts when lead company or client account changes
  useEffect(() => {
    fetchContactsForCompany(dealData.leadCompany, dealData.clientAccount);
  }, [dealData.leadCompany, dealData.clientAccount]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!dealData.name.trim()) {
      newErrors.name = "Deal name is required";
    }
    if (!dealData.value || parseFloat(dealData.value) <= 0) {
      newErrors.value = "Deal value must be greater than 0";
    }
    if (
      dealData.probability < 0 ||
      dealData.probability > 100 ||
      isNaN(dealData.probability)
    ) {
      newErrors.probability = "Probability must be between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Format date for Strapi
      const formatDateForStrapi = (dateValue) => {
        if (!dateValue) return null;
        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return null;
          return date.toISOString();
        } catch (error) {
          console.warn("Invalid date format:", dateValue);
          return null;
        }
      };

      // Prepare update data
      const updateData = {
        name: dealData.name,
        stage: dealData.stage,
        value: parseFloat(dealData.value),
        probability: parseInt(dealData.probability),
        priority: dealData.priority,
        source: dealData.source,
        visibility: dealData.visibility || "PUBLIC",
        dealGroup: dealData.dealGroup ? parseInt(dealData.dealGroup) : null,
        visibleTo:
          dealData.visibility === "PRIVATE" && dealData.visibleTo.length > 0
            ? dealData.visibleTo.map((id) => parseInt(id))
            : [],
        description: dealData.description || null,
        closeDate: formatDateForStrapi(dealData.closeDate),
        leadCompany: dealData.leadCompany || null,
        clientAccount: dealData.clientAccount || null,
        contact: dealData.contact || null,
        assignedTo: dealData.assignedTo || null,
      };

      // Remove empty string values and replace with null
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === "") {
          updateData[key] = null;
        }
      });

      await dealService.update(dealId, updateData);

      // If deal is being marked as CLOSED_WON and wasn't already won, convert lead company to client account
      const isWon = updateData.stage === "CLOSED_WON";
      const wasWon = originalStage === "CLOSED_WON";

      if (isWon && !wasWon && dealData.leadCompany && !dealData.clientAccount) {
        try {
          // Fetch the lead company to check if it's already converted
          const leadCompanyResponse = await leadCompanyService.getById(
            dealData.leadCompany,
            {
              populate: ["convertedAccount"],
            }
          );

          const leadCompanyData = leadCompanyResponse?.data;
          const leadCompanyAttributes =
            leadCompanyData?.attributes || leadCompanyData;

          // Check if lead company has already been converted
          const convertedAccount =
            leadCompanyAttributes?.convertedAccount?.data ||
            leadCompanyAttributes?.convertedAccount;

          if (!convertedAccount) {

            // Convert lead company to client account
            const conversionResponse = await leadCompanyService.convertToClient(
              dealData.leadCompany
            );
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

            }
          } else {
            // Lead company already converted, just link the existing client account to the deal
            const existingClientAccountId =
              convertedAccount.id || convertedAccount.documentId;

            await dealService.update(dealId, {
              clientAccount: existingClientAccountId,
            });

          }
        } catch (conversionError) {
          console.error(
            "Error converting lead company to client account:",
            conversionError
          );
          // Don't fail the deal update if conversion fails, just log the error
        }
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/sales/deals/${dealId}`);
      }, 2000);
    } catch (error) {
      console.error("Error updating deal:", error);

      // Extract specific error message from Strapi response
      let errorMessage = "Failed to update deal. Please try again.";
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 bg-white min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            <span className="text-gray-600">Loading deal...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Deal updated successfully!
        </div>
      )}

      <div className="p-4 space-y-4 bg-white min-h-screen">
        {/* Page Header */}
        <PageHeader
          title="Edit Deal"
          subtitle="Update deal information and details"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Sales", href: "/sales" },
            { label: "Deals", href: "/sales/deals" },
            {
              label: dealData.name || "Edit",
              href: `/sales/deals/${dealId}/edit`,
            },
          ]}
          showActions={false}
        />

        {/* Custom Actions */}
        <div className="flex items-center justify-end gap-3 mb-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/sales/deals/${dealId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSubmitting ? "Updating..." : "Update Deal"}
          </Button>
        </div>

        {/* Error Message */}
        {errors.general && (
          <Card className="border-red-200 bg-red-50">
            <div className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{errors.general}</span>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Deal Information */}
          <Card className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-500/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Deal Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Basic deal details and status
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deal Name *
                  </label>
                  <Input
                    value={dealData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter deal name"
                    error={errors.name}
                  />
                </div>

                <div>
                  <Select
                    label="Stage *"
                    value={dealData.stage}
                    onChange={(value) => handleInputChange("stage", value)}
                    options={stageOptions}
                    error={errors.stage}
                    placeholder="Select stage"
                  />
                </div>

                <div>
                  <Select
                    label="Priority *"
                    value={dealData.priority}
                    onChange={(value) => handleInputChange("priority", value)}
                    options={priorityOptions}
                    error={errors.priority}
                    placeholder="Select priority"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value (₹) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={dealData.value}
                    onChange={(e) => handleInputChange("value", e.target.value)}
                    placeholder="0.00"
                    icon={IndianRupee}
                    error={errors.value}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Probability (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={dealData.probability}
                    onChange={(e) =>
                      handleInputChange(
                        "probability",
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="50"
                  />
                </div>

                <div>
                  <Select
                    label="Visibility"
                    value={dealData.visibility}
                    onChange={(value) => handleInputChange("visibility", value)}
                    options={visibilityOptions}
                    placeholder="Select visibility"
                  />
                </div>

                <div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Select
                        label="Deal Group"
                        value={dealData.dealGroup}
                        onChange={(value) =>
                          handleInputChange("dealGroup", value)
                        }
                        options={[
                          { value: "", label: "No Group" },
                          ...dealGroups.map((group) => ({
                            value: group.id || group.documentId,
                            label:
                              group.name ||
                              group.attributes?.name ||
                              "Unknown Group",
                          })),
                        ]}
                        placeholder="Select group (optional)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDealGroupModalOpen(true)}
                      className="mb-0.5 px-3 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg border border-orange-200 hover:border-orange-300 transition-colors whitespace-nowrap"
                      title="Manage Groups"
                    >
                      <FolderPlus className="w-4 h-4 inline mr-1" />
                      Manage
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Close Date
                  </label>
                  <Input
                    type="date"
                    value={dealData.closeDate}
                    onChange={(e) =>
                      handleInputChange("closeDate", e.target.value)
                    }
                    icon={Calendar}
                    error={errors.closeDate}
                  />
                </div>

                <div>
                  <Select
                    label="Source"
                    value={dealData.source}
                    onChange={(value) => handleInputChange("source", value)}
                    options={sourceOptions}
                    error={errors.source}
                    placeholder="Select source"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={dealData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Enter deal description..."
                    rows={4}
                    error={errors.description}
                  />
                </div>
              </div>

              {/* Private Deal Visibility Section */}
              {dealData.visibility === "PRIVATE" && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visible To (Select users who can view this private deal)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {users.map((u) => {
                      const userId = (u.id || u.documentId).toString();
                      const userName =
                        `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                        u.username ||
                        "Unknown";
                      const isSelected = dealData.visibleTo.includes(userId);
                      return (
                        <label
                          key={userId}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newVisibleTo = e.target.checked
                                ? [...dealData.visibleTo, userId]
                                : dealData.visibleTo.filter(
                                    (id) => id !== userId
                                  );
                              handleInputChange("visibleTo", newVisibleTo);
                            }}
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="text-sm text-gray-700">
                            {userName}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {dealData.visibleTo.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      No users selected. Only you (as the assigned owner) will
                      be able to view this deal.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Company & Contact Association */}
          <Card className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Company & Contact Association
                  </h2>
                  <p className="text-sm text-gray-500">
                    Link deal to companies and contacts
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Select
                    label="Lead Company"
                    value={dealData.leadCompany}
                    onChange={(value) =>
                      handleInputChange("leadCompany", value)
                    }
                    options={[
                      { value: "", label: "Select Lead Company" },
                      ...leadCompanies.map((company) => {
                        const companyData = company.attributes || company;
                        return {
                          value:
                            company.id || company.documentId || companyData.id,
                          label:
                            companyData.companyName ||
                            company.companyName ||
                            "Unknown Company",
                        };
                      }),
                    ]}
                    error={errors.leadCompany}
                    placeholder="Select lead company"
                    disabled={!!dealData.clientAccount}
                  />
                  {dealData.clientAccount && (
                    <p className="text-xs text-gray-500 mt-1">
                      Clear Client Account to select Lead Company
                    </p>
                  )}
                </div>

                <div>
                  <Select
                    label="Client Account"
                    value={dealData.clientAccount}
                    onChange={(value) =>
                      handleInputChange("clientAccount", value)
                    }
                    options={[
                      { value: "", label: "Select Client Account" },
                      // Include converted account if it exists
                      ...(convertedClientAccount
                        ? [
                            {
                              value:
                                convertedClientAccount.id ||
                                convertedClientAccount.documentId,
                              label:
                                convertedClientAccount.companyName ||
                                "Converted Account",
                            },
                          ]
                        : []),
                      ...clientAccounts
                        .filter((account) => {
                          // Exclude converted account from regular list if it's already included
                          if (convertedClientAccount) {
                            const accountId =
                              account.id ||
                              account.documentId ||
                              (account.attributes || account).id;
                            const convertedId =
                              convertedClientAccount.id ||
                              convertedClientAccount.documentId;
                            return accountId !== convertedId;
                          }
                          return true;
                        })
                        .map((account) => {
                          const accountData = account.attributes || account;
                          return {
                            value:
                              account.id ||
                              account.documentId ||
                              accountData.id,
                            label:
                              accountData.companyName ||
                              account.companyName ||
                              "Unknown Account",
                          };
                        }),
                    ]}
                    error={errors.clientAccount}
                    placeholder="Select client account"
                    disabled={!!dealData.leadCompany && !convertedClientAccount}
                  />
                  {dealData.leadCompany && !convertedClientAccount && (
                    <p className="text-xs text-gray-500 mt-1">
                      Clear Lead Company to select Client Account
                    </p>
                  )}
                  {dealData.leadCompany && convertedClientAccount && (
                    <p className="text-xs text-green-600 mt-1">
                      This lead company has been converted to a client account
                    </p>
                  )}
                  {isCheckingConversion && (
                    <p className="text-xs text-gray-500 mt-1">
                      Checking conversion status...
                    </p>
                  )}
                </div>

                {(dealData.leadCompany || dealData.clientAccount) && (
                  <div className="md:col-span-2">
                    <Select
                      label="Primary Contact"
                      value={dealData.contact}
                      onChange={(value) => handleInputChange("contact", value)}
                      options={[
                        { value: "", label: "Select Contact" },
                        ...filteredContacts.map((contact) => {
                          const contactData = contact.attributes || contact;
                          return {
                            value:
                              contact.id ||
                              contact.documentId ||
                              contactData.id,
                            label:
                              `${contactData.firstName || ""} ${
                                contactData.lastName || ""
                              }`.trim() || "Unknown Contact",
                          };
                        }),
                      ]}
                      error={errors.contact}
                      placeholder={
                        loadingContacts
                          ? "Loading contacts..."
                          : filteredContacts.length === 0
                          ? "No contacts available"
                          : "Select contact"
                      }
                      disabled={loadingContacts}
                    />
                    {loadingContacts && (
                      <p className="text-xs text-gray-500 mt-1">
                        Loading contacts...
                      </p>
                    )}
                    {!loadingContacts &&
                      filteredContacts.length === 0 &&
                      (dealData.leadCompany || dealData.clientAccount) && (
                        <p className="text-xs text-gray-500 mt-1">
                          No contacts found for the selected company
                        </p>
                      )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </form>

        {/* Deal Group Management Modal */}
        <DealGroupModal
          isOpen={isDealGroupModalOpen}
          onClose={() => setIsDealGroupModalOpen(false)}
          onGroupCreated={() => {
            fetchDealGroups();
          }}
          onGroupUpdated={() => {
            fetchDealGroups();
          }}
          onGroupDeleted={() => {
            fetchDealGroups();
          }}
        />
      </div>
    </>
  );
}
