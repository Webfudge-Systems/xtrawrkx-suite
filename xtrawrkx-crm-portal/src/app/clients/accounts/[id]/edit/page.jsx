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
import clientAccountService from "../../../../../lib/api/clientAccountService";
import strapiClient from "../../../../../lib/strapiClient";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Briefcase,
} from "lucide-react";

export default function EditClientAccountPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Client account data
  const [accountData, setAccountData] = useState({
    companyName: "",
    industry: "",
    companyType: "",
    subType: "",
    website: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    employees: "",
    founded: "",
    description: "",
    linkedIn: "",
    twitter: "",
    status: "ACTIVE",
    type: "CUSTOMER",
    revenue: "",
    healthScore: "",
    notes: "",
    accountManager: "",
    conversionDate: "",
  });

  const industryOptions = [
    { value: "technology", label: "Technology" },
    { value: "healthcare", label: "Healthcare" },
    { value: "finance", label: "Finance" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "retail", label: "Retail" },
    { value: "education", label: "Education" },
    { value: "real-estate", label: "Real Estate" },
    { value: "consulting", label: "Consulting" },
    { value: "other", label: "Other" },
  ];

  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "ON_HOLD", label: "On Hold" },
    { value: "CHURNED", label: "Churned" },
    { value: "REGISTERED", label: "Registered" },
    { value: "COMMUNITY_MEMBER", label: "Community Member" },
    { value: "COMMUNITY_PAID", label: "Community Paid" },
    { value: "COMMUNITY_NON_PAID", label: "Community Non-Paid" },
    { value: "LOST", label: "Lost" },
    { value: "STOPPED", label: "Stopped" },
  ];

  const accountTypeOptions = [
    { value: "CUSTOMER", label: "Customer" },
    { value: "PARTNER", label: "Partner" },
    { value: "VENDOR", label: "Vendor" },
  ];

  const companyTypes = [
    { id: "startup-corporate", name: "Startup and Corporates" },
    { id: "investor", name: "Investors" },
    { id: "enablers-academia", name: "Enablers & Academia" },
  ];

  const subTypeOptions = {
    "startup-corporate": [
      "EV 2W",
      "EV 3W",
      "EV OEM",
      "EV 4W",
      "Motor OEM",
      "Motor Controller OEM",
      "Batteries",
      "Charging Infra",
      "Drones",
      "AGVs",
      "Consumer electronics",
      "Incubator / accelerator",
      "Power electronics",
      "Other OE",
      "Group",
      "EV Fleet",
      "E-commerce companies",
      "3rd party logistics",
      "Vehicle Smarts",
      "Swapping",
      "EV Leasing",
      "EV Rentals",
      "EV NBFC",
      "Power electronics+Vechicle smart",
      "Electronics Components",
      "1DL/MDL",
      "Franchisee",
      "Smart Battery",
      "Dealer",
      "Motor Parts",
      "Spare Part",
      "Traditional Auto",
      "Smart Electronic",
      "Mech Parts",
      "Energy Storing",
      "Automotive Parts_ EV manufacturers",
      "IOT",
      "Inverter",
      "Aggregator",
    ],
    investor: [
      "Future Founder",
      "Private Lender P2P",
      "Angel",
      "Angel Network",
      "Micro VC",
      "VC",
      "Family Office",
      "Private Equity PE",
      "Debt",
      "WC Working Capital",
      "NBFC",
      "Bill discounting",
      "Investment Bank",
      "Banks",
      "Asset Investor",
      "Asset Financier",
      "Asset Leasing",
      "Op Franchisee",
      "Franchise Network",
      "Incubation Center",
      "Accelerator",
      "Industry body",
      "Gov Body",
      "Gov Policy",
      "Alternative Investment Platform",
      "Strategic investor",
      "CVC",
      "HNI",
    ],
    "enablers-academia": [
      "Incubator",
      "Accelerator",
      "Venture Studio",
      "Academia",
      "Government Office",
      "Mentor",
      "Investment Banker",
    ],
  };

  // Get sub-type options based on selected type
  const getSubTypeOptions = () => {
    if (!accountData.companyType) return [];
    return subTypeOptions[accountData.companyType]?.map((subType) => ({
      value: subType,
      label: subType,
    })) || [];
  };

  const employeeSizeOptions = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "501-1000", label: "501-1000 employees" },
    { value: "1000+", label: "1000+ employees" },
  ];

  // Fetch account data and users on component mount
  useEffect(() => {
    fetchAccountData();
    fetchUsers();
  }, [accountId]);

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

  const fetchAccountData = async () => {
    try {
      setIsLoading(true);
      const response = await clientAccountService.getById(accountId, {
        populate: ["accountManager"],
      });


      const account = response?.data || response;

      if (!account) {
        console.error("No client account data found in response");
        setErrors({ general: "Client account not found" });
        return;
      }

      if (account.id || account.documentId) {

        // Format dates for input fields
        let formattedConversionDate = "";
        if (account.conversionDate) {
          const date = new Date(account.conversionDate);
          formattedConversionDate = date.toISOString().split("T")[0];
        }

        setAccountData({
          companyName: account.companyName || "",
          industry: account.industry || "",
          companyType: account.companyType || "",
          subType: account.subType || "",
          website: account.website || "",
          phone: account.phone || "",
          email: account.email || "",
          address: account.address || "",
          city: account.city || "",
          state: account.state || "",
          country: account.country || "",
          zipCode: account.zipCode || "",
          employees: account.employees || "",
          founded: account.founded || "",
          description: account.description || "",
          linkedIn: account.linkedIn || "",
          twitter: account.twitter || "",
          status: account.status || "ACTIVE",
          type: account.type || "CUSTOMER",
          revenue: account.revenue?.toString() || "",
          healthScore: account.healthScore?.toString() || "",
          notes: account.notes || "",
          accountManager:
            account.accountManager?.id ||
            account.accountManager?.documentId ||
            "",
          conversionDate: formattedConversionDate,
        });
      } else {
        console.error(
          "No client account data found - missing id or documentId"
        );
        setErrors({ general: "Client account not found" });
      }
    } catch (error) {
      console.error("Error fetching client account:", error);
      setErrors({
        general:
          error.response?.data?.error?.message ||
          error.message ||
          "Failed to load client account data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setAccountData((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset subType when companyType changes
      if (field === "companyType") {
        updated.subType = "";
      }
      return updated;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!accountData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }
    if (!accountData.industry) {
      newErrors.industry = "Industry is required";
    }

    // Optional email validation
    if (accountData.email && !/\S+@\S+\.\S+/.test(accountData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Optional phone validation
    if (
      accountData.phone &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(
        accountData.phone.replace(/[\s\-\(\)]/g, "")
      )
    ) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Optional website validation
    if (accountData.website && !/^https?:\/\/.+/.test(accountData.website)) {
      newErrors.website =
        "Please enter a valid website URL (include http:// or https://)";
    }

    // Revenue validation
    if (
      accountData.revenue &&
      (isNaN(accountData.revenue) || parseFloat(accountData.revenue) < 0)
    ) {
      newErrors.revenue = "Please enter a valid revenue amount";
    }

    // Health score validation
    if (
      accountData.healthScore &&
      (isNaN(accountData.healthScore) ||
        accountData.healthScore < 0 ||
        accountData.healthScore > 100)
    ) {
      newErrors.healthScore = "Health score must be between 0 and 100";
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
        companyName: accountData.companyName,
        industry: accountData.industry,
        companyType: accountData.companyType || null,
        subType: accountData.subType || null,
        website: accountData.website || null,
        phone: accountData.phone || null,
        email: accountData.email || null,
        address: accountData.address || null,
        city: accountData.city || null,
        state: accountData.state || null,
        country: accountData.country || null,
        zipCode: accountData.zipCode || null,
        employees: accountData.employees || null,
        founded: accountData.founded || null,
        description: accountData.description || null,
        linkedIn: accountData.linkedIn || null,
        twitter: accountData.twitter || null,
        status: accountData.status,
        type: accountData.type,
        revenue: accountData.revenue ? parseFloat(accountData.revenue) : null,
        healthScore: accountData.healthScore
          ? parseInt(accountData.healthScore)
          : null,
        notes: accountData.notes || null,
        accountManager: accountData.accountManager || null,
        conversionDate: formatDateForStrapi(accountData.conversionDate),
      };

      // Remove empty string values and replace with null
      Object.keys(updateData).forEach((key) => {
        if (key !== "industry" && updateData[key] === "") {
          updateData[key] = null;
        }
      });

      await clientAccountService.update(accountId, updateData);

      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/clients/accounts/${accountId}`);
      }, 2000);
    } catch (error) {
      console.error("Error updating client account:", error);

      // Extract specific error message from Strapi response
      let errorMessage = "Failed to update client account. Please try again.";
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
            <span className="text-gray-600">Loading client account...</span>
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
          Client account updated successfully!
        </div>
      )}

      <div className="p-4 space-y-4 bg-white min-h-screen">
        {/* Page Header */}
        <PageHeader
          title="Edit Client Account"
          subtitle="Update client account information and details"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Clients", href: "/clients" },
            { label: "Client Accounts", href: "/clients/accounts" },
            {
              label: accountData.companyName || "Edit",
              href: `/clients/accounts/${accountId}/edit`,
            },
          ]}
          showActions={false}
        />

        {/* Custom Actions */}
        <div className="flex items-center justify-end gap-3 mb-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/clients/accounts/${accountId}`)}
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
            {isSubmitting ? "Updating..." : "Update Client Account"}
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
          {/* Company Information */}
          <Card className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-500/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Company Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Basic company details and contact information
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <Input
                    value={accountData.companyName}
                    onChange={(e) =>
                      handleInputChange("companyName", e.target.value)
                    }
                    placeholder="Enter company name"
                    error={errors.companyName}
                  />
                </div>

                <div>
                  <Select
                    label="Industry *"
                    value={accountData.industry}
                    onChange={(value) => handleInputChange("industry", value)}
                    options={industryOptions}
                    error={errors.industry}
                    placeholder="Select industry"
                    required
                  />
                </div>

                <div>
                  <Select
                    label="Company Type"
                    value={accountData.companyType}
                    onChange={(value) => handleInputChange("companyType", value)}
                    options={companyTypes.map((type) => ({
                      value: type.id,
                      label: type.name,
                    }))}
                    placeholder="Select company type"
                  />
                </div>

                <div>
                  <Select
                    label="Sub-Type"
                    value={accountData.subType}
                    onChange={(value) => handleInputChange("subType", value)}
                    options={getSubTypeOptions()}
                    placeholder={
                      accountData.companyType
                        ? "Select sub-type"
                        : "Select company type first"
                    }
                    disabled={!accountData.companyType}
                  />
                </div>

                <div>
                  <Select
                    label="Account Type"
                    value={accountData.type}
                    onChange={(value) => handleInputChange("type", value)}
                    options={accountTypeOptions}
                    placeholder="Select account type"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <Input
                    value={accountData.website}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                    placeholder="https://example.com"
                    icon={Globe}
                    error={errors.website}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <Input
                    value={accountData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    icon={Phone}
                    error={errors.phone}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    value={accountData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="contact@company.com"
                    icon={Mail}
                    error={errors.email}
                  />
                </div>

                <div>
                  <Select
                    label="Company Size"
                    value={accountData.employees}
                    onChange={(value) => handleInputChange("employees", value)}
                    options={employeeSizeOptions}
                    placeholder="Select company size"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Founded Year
                  </label>
                  <Input
                    type="number"
                    value={accountData.founded}
                    onChange={(e) =>
                      handleInputChange("founded", e.target.value)
                    }
                    placeholder="2020"
                    icon={Calendar}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Description
                  </label>
                  <Textarea
                    value={accountData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Brief description of the company..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Address Information */}
          <Card className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Address Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Company location and address details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <Input
                    value={accountData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder="123 Business Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <Input
                    value={accountData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province
                  </label>
                  <Input
                    value={accountData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <Input
                    value={accountData.country}
                    onChange={(e) =>
                      handleInputChange("country", e.target.value)
                    }
                    placeholder="United States"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code
                  </label>
                  <Input
                    value={accountData.zipCode}
                    onChange={(e) =>
                      handleInputChange("zipCode", e.target.value)
                    }
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Account Details */}
          <Card className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Account Details
                  </h2>
                  <p className="text-sm text-gray-500">
                    Account status, metrics, and management
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Select
                    label="Status"
                    value={accountData.status}
                    onChange={(value) => handleInputChange("status", value)}
                    options={statusOptions}
                    placeholder="Select status"
                  />
                </div>

                <div>
                  <Select
                    label="Account Manager"
                    value={accountData.accountManager}
                    onChange={(value) =>
                      handleInputChange("accountManager", value)
                    }
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
                    placeholder="Select account manager"
                    disabled={loadingUsers}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Revenue
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={accountData.revenue}
                    onChange={(e) =>
                      handleInputChange("revenue", e.target.value)
                    }
                    placeholder="1000000"
                    icon={DollarSign}
                    error={errors.revenue}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Health Score (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={accountData.healthScore}
                    onChange={(e) =>
                      handleInputChange("healthScore", e.target.value)
                    }
                    placeholder="75"
                    icon={TrendingUp}
                    error={errors.healthScore}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conversion Date
                  </label>
                  <Input
                    type="date"
                    value={accountData.conversionDate}
                    onChange={(e) =>
                      handleInputChange("conversionDate", e.target.value)
                    }
                    icon={Calendar}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Social & Additional Information */}
          <Card className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-500/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Social & Additional Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Social media links and additional notes
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn URL
                    </label>
                    <Input
                      value={accountData.linkedIn}
                      onChange={(e) =>
                        handleInputChange("linkedIn", e.target.value)
                      }
                      placeholder="https://linkedin.com/company/example"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter URL
                    </label>
                    <Input
                      value={accountData.twitter}
                      onChange={(e) =>
                        handleInputChange("twitter", e.target.value)
                      }
                      placeholder="https://twitter.com/example"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <Textarea
                    value={accountData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes about this client account..."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </>
  );
}
