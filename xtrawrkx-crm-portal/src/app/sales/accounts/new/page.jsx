"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Input,
  Select,
  Textarea,
  Badge,
} from "../../../../components/ui";
import PageHeader from "../../../../components/PageHeader";
import clientAccountService from "../../../../lib/api/clientAccountService";
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Briefcase,
} from "lucide-react";

export default function AddClientAccountPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Client account data
  const [accountData, setAccountData] = useState({
    companyName: "",
    industry: "",
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
    accountType: "STANDARD",
    revenue: "",
    healthScore: "75",
    notes: "",
    // Account management
    accountManager: "",
    onboardingDate: "",
    contractStartDate: "",
    contractEndDate: "",
    billingCycle: "MONTHLY",
    paymentTerms: "NET_30",
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
    { value: "STANDARD", label: "Standard" },
    { value: "PREMIUM", label: "Premium" },
    { value: "ENTERPRISE", label: "Enterprise" },
    { value: "TRIAL", label: "Trial" },
  ];

  const employeeSizeOptions = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "501-1000", label: "501-1000 employees" },
    { value: "1000+", label: "1000+ employees" },
  ];

  const billingCycleOptions = [
    { value: "MONTHLY", label: "Monthly" },
    { value: "QUARTERLY", label: "Quarterly" },
    { value: "ANNUALLY", label: "Annually" },
  ];

  const paymentTermsOptions = [
    { value: "NET_15", label: "Net 15 days" },
    { value: "NET_30", label: "Net 30 days" },
    { value: "NET_45", label: "Net 45 days" },
    { value: "NET_60", label: "Net 60 days" },
    { value: "IMMEDIATE", label: "Immediate" },
  ];

  const handleInputChange = (field, value) => {
    setAccountData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
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
    if (!accountData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(accountData.email)) {
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
    if (accountData.revenue && (isNaN(accountData.revenue) || parseFloat(accountData.revenue) < 0)) {
      newErrors.revenue = "Please enter a valid revenue amount";
    }

    // Health score validation
    if (accountData.healthScore && (isNaN(accountData.healthScore) || accountData.healthScore < 0 || accountData.healthScore > 100)) {
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
      // Prepare client account data
      const accountPayload = {
        companyName: accountData.companyName,
        industry: accountData.industry,
        website: accountData.website,
        phone: accountData.phone,
        email: accountData.email,
        address: accountData.address,
        city: accountData.city,
        state: accountData.state,
        country: accountData.country,
        zipCode: accountData.zipCode,
        employees: accountData.employees,
        founded: accountData.founded ? parseInt(accountData.founded) : null,
        description: accountData.description,
        linkedIn: accountData.linkedIn,
        twitter: accountData.twitter,
        status: accountData.status,
        accountType: accountData.accountType,
        revenue: accountData.revenue ? parseFloat(accountData.revenue) : 0,
        healthScore: accountData.healthScore ? parseInt(accountData.healthScore) : 75,
        notes: accountData.notes,
        onboardingDate: accountData.onboardingDate || null,
        contractStartDate: accountData.contractStartDate || null,
        contractEndDate: accountData.contractEndDate || null,
        billingCycle: accountData.billingCycle,
        paymentTerms: accountData.paymentTerms,
        conversionDate: new Date().toISOString(), // Set conversion date to now
      };


      // Create the client account
      const createdAccount = await clientAccountService.create(accountPayload);


      setShowSuccess(true);

      // Redirect after success
      setTimeout(() => {
        router.push(`/sales/accounts/${createdAccount.id}`);
      }, 2000);
    } catch (error) {
      console.error("Error creating client account:", error);
      setErrors({ submit: "Failed to create client account. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600 mb-4">Client account created successfully</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">
            Redirecting to account details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 space-y-6">
        <PageHeader
          title="Add New Client Account"
          subtitle="Create a new client account with detailed information"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Sales", href: "/sales" },
            { label: "Client Accounts", href: "/sales/accounts" },
            { label: "Add New", href: "/sales/accounts/new" },
          ]}
          showProfile={true}
          showSearch={false}
          showActions={false}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <Card className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Company Information
                </h3>
                <p className="text-sm text-gray-600">
                  Basic information about the client company
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Input
                  label="Company Name *"
                  value={accountData.companyName}
                  onChange={(e) =>
                    handleInputChange("companyName", e.target.value)
                  }
                  error={errors.companyName}
                  placeholder="Enter company name"
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
                />
              </div>

              <div>
                <Input
                  label="Website"
                  type="url"
                  value={accountData.website}
                  onChange={(e) =>
                    handleInputChange("website", e.target.value)
                  }
                  error={errors.website}
                  placeholder="https://company.com"
                  icon={Globe}
                />
              </div>
              <div>
                <Input
                  label="Phone"
                  type="tel"
                  value={accountData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  error={errors.phone}
                  placeholder="+1 (555) 123-4567"
                  icon={Phone}
                />
              </div>
              <div>
                <Input
                  label="Company Email *"
                  type="email"
                  value={accountData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  error={errors.email}
                  placeholder="contact@company.com"
                  icon={Mail}
                />
              </div>

              <div className="lg:col-span-3">
                <Textarea
                  label="Company Description"
                  value={accountData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Brief description of the company and their business..."
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Address Information */}
          <Card className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Address Information
                </h3>
                <p className="text-sm text-gray-600">
                  Location and contact address details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3">
                <Input
                  label="Street Address"
                  value={accountData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="123 Main Street"
                  icon={MapPin}
                />
              </div>

              <div>
                <Input
                  label="City"
                  value={accountData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="New York"
                />
              </div>
              <div>
                <Input
                  label="State/Province"
                  value={accountData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="NY"
                />
              </div>
              <div>
                <Input
                  label="ZIP/Postal Code"
                  value={accountData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  placeholder="10001"
                />
              </div>

              <div className="lg:col-span-3">
                <Input
                  label="Country"
                  value={accountData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  placeholder="United States"
                />
              </div>
            </div>
          </Card>

          {/* Account Details */}
          <Card className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Account Details
                </h3>
                <p className="text-sm text-gray-600">
                  Account type, status, and business metrics
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Select
                  label="Account Type"
                  value={accountData.accountType}
                  onChange={(value) => handleInputChange("accountType", value)}
                  options={accountTypeOptions}
                  placeholder="Select account type"
                />
              </div>
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
                  label="Company Size"
                  value={accountData.employees}
                  onChange={(value) => handleInputChange("employees", value)}
                  options={employeeSizeOptions}
                  placeholder="Select company size"
                />
              </div>

              <div>
                <Input
                  label="Annual Revenue"
                  type="number"
                  value={accountData.revenue}
                  onChange={(e) =>
                    handleInputChange("revenue", e.target.value)
                  }
                  error={errors.revenue}
                  placeholder="1000000"
                  min="0"
                  step="0.01"
                  icon={DollarSign}
                />
              </div>
              <div>
                <Input
                  label="Health Score (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={accountData.healthScore}
                  onChange={(e) =>
                    handleInputChange("healthScore", e.target.value)
                  }
                  error={errors.healthScore}
                  placeholder="75"
                  icon={TrendingUp}
                />
              </div>
              <div>
                <Input
                  label="Founded Year"
                  type="number"
                  value={accountData.founded}
                  onChange={(e) =>
                    handleInputChange("founded", e.target.value)
                  }
                  placeholder="2020"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
          </Card>

          {/* Contract & Billing Information */}
          <Card className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Contract & Billing
                </h3>
                <p className="text-sm text-gray-600">
                  Contract dates and billing preferences
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Input
                  label="Onboarding Date"
                  type="date"
                  value={accountData.onboardingDate}
                  onChange={(e) =>
                    handleInputChange("onboardingDate", e.target.value)
                  }
                  icon={Calendar}
                />
              </div>
              <div>
                <Input
                  label="Contract Start Date"
                  type="date"
                  value={accountData.contractStartDate}
                  onChange={(e) =>
                    handleInputChange("contractStartDate", e.target.value)
                  }
                  icon={Calendar}
                />
              </div>
              <div>
                <Input
                  label="Contract End Date"
                  type="date"
                  value={accountData.contractEndDate}
                  onChange={(e) =>
                    handleInputChange("contractEndDate", e.target.value)
                  }
                  icon={Calendar}
                />
              </div>

              <div>
                <Select
                  label="Billing Cycle"
                  value={accountData.billingCycle}
                  onChange={(value) => handleInputChange("billingCycle", value)}
                  options={billingCycleOptions}
                  placeholder="Select billing cycle"
                />
              </div>
              <div>
                <Select
                  label="Payment Terms"
                  value={accountData.paymentTerms}
                  onChange={(value) => handleInputChange("paymentTerms", value)}
                  options={paymentTermsOptions}
                  placeholder="Select payment terms"
                />
              </div>
            </div>
          </Card>

          {/* Social & Additional Information */}
          <Card className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Social & Additional Information
                </h3>
                <p className="text-sm text-gray-600">
                  Social media profiles and additional notes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Input
                  label="LinkedIn Profile"
                  type="url"
                  value={accountData.linkedIn}
                  onChange={(e) =>
                    handleInputChange("linkedIn", e.target.value)
                  }
                  placeholder="https://linkedin.com/company/companyname"
                />
              </div>
              <div>
                <Input
                  label="Twitter Handle"
                  value={accountData.twitter}
                  onChange={(e) => handleInputChange("twitter", e.target.value)}
                  placeholder="@companyname"
                />
              </div>
            </div>

            <div>
              <Textarea
                label="Notes"
                value={accountData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about this client account..."
                rows={4}
              />
            </div>
          </Card>

          {/* Error Display */}
          {errors.submit && (
            <Card className="rounded-2xl bg-red-50 border border-red-200 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700">{errors.submit}</p>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Button>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                * Required fields
              </Badge>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white flex items-center gap-2 min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Client Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
