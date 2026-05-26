"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import AuthCard from "./AuthCard";
import AuthInput from "./AuthInput";
import AuthButton from "./AuthButton";
import AuthToggle from "./AuthToggle";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { checkEmailExists } from "@/lib/api/authService";

const COMMUNITIES = [
  {
    id: "xevfin",
    name: "xtrawrkx EV Finance Network",
    code: "XEV.FiN",
    description: "Group for strictly investments in EVs",
    icon: "mdi:chart-line",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "xen",
    name: "xtrawrkx Entrepreneurship Network",
    code: "XEN",
    description: "Group for founders to network / sell / buy etc",
    icon: "mdi:lightbulb-on",
    color: "from-orange-500 to-pink-500",
  },
  {
    id: "xevtg",
    name: "xtrawrkx EV Talent Group",
    code: "XEVTG",
    description: "Meant for HRs and TPOs of colleges for hiring/training etc",
    icon: "mdi:account-group",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "xdd",
    name: "xtrawrkx Drones & Defense Group",
    code: "xD&D",
    description: "For Drone and Defense companies for funding and finance",
    icon: "mdi:shield-airplane",
    color: "from-indigo-500 to-violet-500",
  },
];

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Retail",
  "Real Estate",
  "Consulting",
  "Marketing",
  "Media & Entertainment",
  "Other",
];

const EMPLOYEE_RANGES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

const COMPANY_TYPES = [
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

const REVENUE_RANGES = [
  "Less than $100K",
  "$100K - $500K",
  "$500K - $1M",
  "$1M - $5M",
  "$5M - $10M",
  "$10M - $50M",
  "$50M+",
];

export default function SignUpForm({ onSignIn, onSubmit, className = "" }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    name: "",
    email: "",
    phone: "",
    password: "",
    // Step 2: Company Info
    companyName: "",
    industry: "",
    companyType: "",
    subType: "",
    website: "",
    employees: "",
    founded: "",
    revenue: "",
    description: "",
    // Address Info
    address: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    // Social Links
    linkedIn: "",
    twitter: "",
    // Step 3: Community Selection
    selectedCommunities: [],
  });
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const loadingMessages = [
    "Creating your account...",
    "Setting up your communities...",
    "Configuring your workspace...",
    "Almost there...",
  ];

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [loading, loadingMessages.length]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset subType when type changes
      if (name === "companyType") {
        updated.subType = "";
      }
      return updated;
    });
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset subType when type changes
      if (name === "companyType") {
        updated.subType = "";
      }
      return updated;
    });
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Get sub-type options based on selected type
  const getSubTypeOptions = () => {
    if (!formData.companyType) return [];
    return (
      subTypeOptions[formData.companyType]?.map((subType) => ({
        value: subType,
        label: subType,
      })) || []
    );
  };

  const toggleCommunity = (communityId) => {
    setFormData((prev) => ({
      ...prev,
      selectedCommunities: prev.selectedCommunities.includes(communityId)
        ? prev.selectedCommunities.filter((id) => id !== communityId)
        : [...prev.selectedCommunities, communityId],
    }));
  };

  const validateStep1 = async () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    } else {
      // Check if email already exists
      setCheckingEmail(true);
      try {
        const emailCheck = await checkEmailExists(formData.email);
        if (emailCheck.exists) {
          newErrors.email = "An account with this email already exists";
        }
      } catch (error) {
        console.error("Error checking email:", error);
        // Don't block on error, but log it
      } finally {
        setCheckingEmail(false);
      }
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Phone number is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.industry) {
      newErrors.industry = "Industry is required";
    }

    if (!formData.employees) {
      newErrors.employees = "Employee count is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};

    if (formData.selectedCommunities.length === 0) {
      newErrors.communities = "Please select at least one community";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    setErrors({});

    if (currentStep === 1) {
      const isValid = await validateStep1();
      if (isValid) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep < 3) {
      handleNext();
      return;
    }

    if (!validateStep3()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
    } catch (error) {
      setErrors({
        general: error.message || "Sign up failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-2">
        <AuthInput
          type="text"
          name="name"
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name}
          required
        />
      </div>

      <AuthInput
        type="email"
        name="email"
        label="Email Address"
        placeholder="Enter your email"
        value={formData.email}
        onChange={handleInputChange}
        error={errors.email}
        required
      />

      <AuthInput
        type="tel"
        name="phone"
        label="Phone Number"
        placeholder="+1 (555) 123-4567"
        value={formData.phone}
        onChange={handleInputChange}
        error={errors.phone}
        required
      />

      <div className="md:col-span-2">
        <AuthInput
          type="password"
          name="password"
          label="Password"
          placeholder="At least 8 characters"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          required
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Basic Company Info */}
      <div className="space-y-6">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Basic Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Input
              label="Company Name *"
              value={formData.companyName}
              onChange={(e) => handleInputChange(e)}
              name="companyName"
              error={errors.companyName}
              placeholder="Enter company name"
              required
            />
          </div>
          <div>
            <Select
              label="Industry *"
              value={formData.industry}
              onChange={(value) => handleSelectChange("industry", value)}
              options={INDUSTRIES.map((industry) => ({
                value: industry,
                label: industry,
              }))}
              error={errors.industry}
              placeholder="Select industry"
              required
            />
          </div>

          <div>
            <Select
              label="Company Type"
              value={formData.companyType}
              onChange={(value) => handleSelectChange("companyType", value)}
              options={COMPANY_TYPES.map((type) => ({
                value: type.id,
                label: type.name,
              }))}
              placeholder="Select company type"
            />
          </div>

          <div>
            <Select
              label="Sub-Type"
              value={formData.subType}
              onChange={(value) => handleSelectChange("subType", value)}
              options={getSubTypeOptions()}
              placeholder={
                formData.companyType
                  ? "Select sub-type"
                  : "Select company type first"
              }
              disabled={!formData.companyType}
            />
          </div>

          <div>
            <Input
              label="Website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange(e)}
              name="website"
              placeholder="https://company.com"
            />
          </div>
          <div>
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange(e)}
              name="phone"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <Input
              label="Founded Year"
              value={formData.founded}
              onChange={(e) => handleInputChange(e)}
              name="founded"
              placeholder="2020"
            />
          </div>

          <div>
            <Select
              label="Number of Employees *"
              value={formData.employees}
              onChange={(value) => handleSelectChange("employees", value)}
              options={EMPLOYEE_RANGES.map((range) => ({
                value: range,
                label: `${range} employees`,
              }))}
              error={errors.employees}
              placeholder="Select range"
              required
            />
          </div>

          <div>
            <Select
              label="Annual Revenue"
              value={formData.revenue}
              onChange={(value) => handleSelectChange("revenue", value)}
              options={REVENUE_RANGES.map((range) => ({
                value: range,
                label: range,
              }))}
              placeholder="Select range"
            />
          </div>

          <div className="lg:col-span-3">
            <Textarea
              label="Company Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Tell us about your company..."
              className="focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Address Info */}
      <div className="space-y-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Address Information
        </h4>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Street Address (Optional)
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Street address"
            rows="2"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm outline-none transition-all focus:border-[#FF4A74] focus:ring-2 focus:ring-orange-100 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AuthInput
            type="text"
            name="city"
            label="City (Optional)"
            placeholder="City"
            value={formData.city}
            onChange={handleInputChange}
          />

          <AuthInput
            type="text"
            name="state"
            label="State/Province (Optional)"
            placeholder="State"
            value={formData.state}
            onChange={handleInputChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AuthInput
            type="text"
            name="country"
            label="Country (Optional)"
            placeholder="Country"
            value={formData.country}
            onChange={handleInputChange}
          />

          <AuthInput
            type="text"
            name="zipCode"
            label="Zip/Postal Code (Optional)"
            placeholder="Zip code"
            value={formData.zipCode}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Social Media
        </h4>

        <AuthInput
          type="url"
          name="linkedIn"
          label="LinkedIn Profile (Optional)"
          placeholder="https://linkedin.com/company/..."
          value={formData.linkedIn}
          onChange={handleInputChange}
        />

        <AuthInput
          type="url"
          name="twitter"
          label="Twitter Profile (Optional)"
          placeholder="https://twitter.com/..."
          value={formData.twitter}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Select Communities
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Choose the communities you&apos;d like to join. You can always change
          this later.
        </p>

        {errors.communities && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {errors.communities}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {COMMUNITIES.map((community) => (
            <button
              key={community.id}
              type="button"
              onClick={() => toggleCommunity(community.id)}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                formData.selectedCommunities.includes(community.id)
                  ? "border-[#FF4A74] bg-orange-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${community.color} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon icon={community.icon} className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {community.name}
                    </h4>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {community.code}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {community.description}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      formData.selectedCommunities.includes(community.id)
                        ? "border-[#FF4A74] bg-[#FF4A74]"
                        : "border-gray-300"
                    }`}
                  >
                    {formData.selectedCommunities.includes(community.id) && (
                      <Icon icon="mdi:check" className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Personal Information";
      case 2:
        return "Company Information";
      case 3:
        return "Community Selection";
      default:
        return "";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1:
        return "Let's start with your basic details";
      case 2:
        return "Tell us about your company";
      case 3:
        return "Join communities that match your interests";
      default:
        return "";
    }
  };

  const renderLoadingBuffer = () => (
    <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-full border-4 border-orange-200 border-t-[#FF4A74] animate-spin" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Please wait</h3>
        <p className="text-gray-600 mb-6">{loadingMessages[loadingMessageIndex]}</p>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-gradient-to-r from-[#FF4A74] to-orange-400 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`w-full max-w-full overflow-hidden ${className}`}>
      {loading && currentStep === 3 && renderLoadingBuffer()}
      <AuthCard title={getStepTitle()} subtitle={getStepSubtitle()}>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 w-full">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          <div
            className={
              currentStep === 2 ? "max-h-[500px] overflow-y-auto pr-2 overflow-x-hidden" : ""
            }
          >
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>

          <div className="flex gap-4 pt-4">
            {currentStep > 1 && (
              <AuthButton
                type="button"
                onClick={handleBack}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Back
              </AuthButton>
            )}
            <AuthButton
              type="submit"
              loading={loading || checkingEmail}
              disabled={loading || checkingEmail}
              size="lg"
              className="flex-1"
            >
              {checkingEmail
                ? "Checking email..."
                : loading
                ? "Processing..."
                : currentStep === 3
                ? "Complete Registration"
                : "Continue"}
            </AuthButton>
          </div>

          {currentStep === 1 && (
            <AuthToggle
              text="Already have an account?"
              linkText="Sign In"
              onClick={onSignIn}
              className="mt-4"
            />
          )}
        </form>
      </AuthCard>
    </div>
  );
}
