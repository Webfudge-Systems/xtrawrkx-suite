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
import leadCompanyService from "../../../../../lib/api/leadCompanyService";
import contactService from "../../../../../lib/api/contactService";
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  IndianRupee,
  Calendar,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Edit,
} from "lucide-react";

export default function EditLeadCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const leadCompanyId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Company data
  const [companyData, setCompanyData] = useState({
    companyName: "",
    industry: "",
    type: "",
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
    leadSource: "WEBSITE",
    status: "NEW",
    dealValue: "",
    notes: "",
  });

  // Contacts data - array of contacts
  const [contacts, setContacts] = useState([]);

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

  const leadSourceOptions = [
    { value: "WEBSITE", label: "Website" },
    { value: "REFERRAL", label: "Referral" },
    { value: "COLD_OUTREACH", label: "Cold Outreach" },
    { value: "SOCIAL_MEDIA", label: "Social Media" },
    { value: "EVENT", label: "Event" },
    { value: "PARTNER", label: "Partner" },
    { value: "ADVERTISING", label: "Advertising" },
    { value: "MANUAL", label: "Manual" },
  ];

  const statusOptions = [
    { value: "NEW", label: "New" },
    { value: "CONTACTED", label: "Contacted" },
    { value: "QUALIFIED", label: "Qualified" },
    { value: "PROPOSAL", label: "Proposal" },
    { value: "NEGOTIATION", label: "Negotiation" },
    { value: "CLOSED_WON", label: "Closed Won" },
    { value: "CLOSED_LOST", label: "Closed Lost" },
  ];

  const employeeSizeOptions = [
    { value: "SIZE_1_10", label: "1-10 employees" },
    { value: "SIZE_11_50", label: "11-50 employees" },
    { value: "SIZE_51_200", label: "51-200 employees" },
    { value: "SIZE_201_500", label: "201-500 employees" },
    { value: "SIZE_501_1000", label: "501-1000 employees" },
    { value: "SIZE_1000_PLUS", label: "1000+ employees" },
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
    if (!companyData.type) return [];
    return subTypeOptions[companyData.type]?.map((subType) => ({
      value: subType,
      label: subType,
    })) || [];
  };

  const roleOptions = [
    { value: "PRIMARY_CONTACT", label: "Primary Contact" },
    { value: "DECISION_MAKER", label: "Decision Maker" },
    { value: "INFLUENCER", label: "Influencer" },
    { value: "TECHNICAL_CONTACT", label: "Technical Contact" },
    { value: "GATEKEEPER", label: "Gatekeeper" },
  ];

  // Fetch lead company data on component mount
  useEffect(() => {
    fetchLeadCompany();
  }, [leadCompanyId]);

  // Fetch contacts separately after company is loaded
  useEffect(() => {
    if (leadCompanyId) {
      fetchContacts();
    }
  }, [leadCompanyId]);

  const fetchContacts = async () => {
    try {
      const response = await contactService.getByLeadCompany(leadCompanyId);

      const contactsData = response.data || response || [];

      if (
        contactsData &&
        Array.isArray(contactsData) &&
        contactsData.length > 0
      ) {
        const formattedContacts = contactsData.map((contact, index) => {
          // Handle both direct contact data and nested attributes
          const contactData = contact.attributes || contact;


          return {
            id: contact.id || contactData.id || index + 1,
            firstName: contactData.firstName || contactData.first_name || "",
            lastName: contactData.lastName || contactData.last_name || "",
            email: contactData.email || "",
            phone: contactData.phone || "",
            jobTitle:
              contactData.title ||
              contactData.jobTitle ||
              contactData.job_title ||
              "",
            department: contactData.department || "",
            role: contactData.role || "TECHNICAL_CONTACT",
            isPrimary: contactData.role === "PRIMARY_CONTACT",
            existingContactId: contact.id || contactData.id, // Track existing contacts
          };
        });

        setContacts(formattedContacts);
      } else {
        setContacts([]);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setContacts([]);
    }
  };

  const fetchLeadCompany = async () => {
    try {
      setIsLoading(true);
      // Use default populate from service (includes contacts, assignedTo, deals, etc.)
      const response = await leadCompanyService.getById(leadCompanyId);


      // Handle different response structures
      const leadCompany = response?.data || response;

      if (!leadCompany) {
        console.error("No lead company data found in response");
        setErrors({ general: "Lead company not found" });
        return;
      }

      // Check for both id and documentId (Strapi v4 uses documentId)
      if (leadCompany.id || leadCompany.documentId) {

        // Set company data with proper type conversion
        setCompanyData({
          companyName:
            leadCompany.companyName ||
            leadCompany.attributes?.companyName ||
            "",
          industry:
            leadCompany.industry || leadCompany.attributes?.industry || "",
          type: leadCompany.type || leadCompany.attributes?.type || "",
          subType: leadCompany.subType || leadCompany.attributes?.subType || "",
          website: leadCompany.website || leadCompany.attributes?.website || "",
          phone: leadCompany.phone || leadCompany.attributes?.phone || "",
          email: leadCompany.email || leadCompany.attributes?.email || "",
          address: leadCompany.address || leadCompany.attributes?.address || "",
          city: leadCompany.city || leadCompany.attributes?.city || "",
          state: leadCompany.state || leadCompany.attributes?.state || "",
          country: leadCompany.country || leadCompany.attributes?.country || "",
          zipCode: leadCompany.zipCode || leadCompany.attributes?.zipCode || "",
          employees:
            leadCompany.employees || leadCompany.attributes?.employees || "",
          founded:
            leadCompany.founded || leadCompany.attributes?.founded
              ? (
                  leadCompany.founded || leadCompany.attributes?.founded
                ).toString()
              : "",
          description:
            leadCompany.description ||
            leadCompany.attributes?.description ||
            "",
          linkedIn:
            leadCompany.linkedIn || leadCompany.attributes?.linkedIn || "",
          twitter: leadCompany.twitter || leadCompany.attributes?.twitter || "",
          leadSource:
            leadCompany.source ||
            leadCompany.attributes?.source ||
            leadCompany.leadSource ||
            leadCompany.attributes?.leadSource ||
            "WEBSITE",
          status: leadCompany.status || leadCompany.attributes?.status || "NEW",
          dealValue:
            leadCompany.dealValue || leadCompany.attributes?.dealValue
              ? (
                  leadCompany.dealValue || leadCompany.attributes?.dealValue
                ).toString()
              : "",
          notes: leadCompany.notes || leadCompany.attributes?.notes || "",
        });

        // Contacts are now fetched separately in fetchContacts function
      } else {
        console.error("No lead company data found - missing id or documentId");
        console.error("Lead company object:", leadCompany);
        setErrors({ general: "Lead company not found" });
      }
    } catch (error) {
      console.error("Error fetching lead company:", error);
      console.error("Error details:", error.response?.data || error.message);
      setErrors({
        general:
          error.response?.data?.error?.message ||
          error.message ||
          "Failed to load lead company data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanyChange = (field, value) => {
    setCompanyData((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset subType when type changes
      if (field === "type") {
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

  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value,
    };

    // Handle primary contact logic
    if (field === "isPrimary" && value) {
      updatedContacts.forEach((contact, i) => {
        if (i !== index) {
          updatedContacts[i].isPrimary = false;
          updatedContacts[i].role = "TECHNICAL_CONTACT";
        } else {
          updatedContacts[i].role = "PRIMARY_CONTACT";
        }
      });
    }

    setContacts(updatedContacts);
  };

  const addContact = () => {
    const newContact = {
      id: contacts.length + 1,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      department: "",
      role: "TECHNICAL_CONTACT",
      isPrimary: false,
    };
    setContacts([...contacts, newContact]);
  };

  const removeContact = (index) => {
    if (contacts.length > 1) {
      const updatedContacts = contacts.filter((_, i) => i !== index);

      // If we removed the primary contact, make the first contact primary
      const hasPrimary = updatedContacts.some((contact) => contact.isPrimary);
      if (!hasPrimary && updatedContacts.length > 0) {
        updatedContacts[0].isPrimary = true;
        updatedContacts[0].role = "PRIMARY_CONTACT";
      }

      setContacts(updatedContacts);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Company validation
    if (!companyData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }
    if (!companyData.industry) {
      newErrors.industry = "Industry is required";
    }
    if (!companyData.leadSource) {
      newErrors.leadSource = "Lead source is required";
    }

    // Contact validation
    contacts.forEach((contact, index) => {
      if (
        contact.firstName.trim() ||
        contact.lastName.trim() ||
        contact.email.trim()
      ) {
        if (!contact.firstName.trim()) {
          newErrors[`contact_${index}_firstName`] = "First name is required";
        }
        if (!contact.lastName.trim()) {
          newErrors[`contact_${index}_lastName`] = "Last name is required";
        }
        if (contact.email.trim() && !/\S+@\S+\.\S+/.test(contact.email)) {
          newErrors[`contact_${index}_email`] = "Invalid email format";
        }
      }
    });

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
      // Update company data
      // Map leadSource to source for backend compatibility
      const { leadSource, ...restData } = companyData;
      const companyUpdateData = {
        ...restData,
        source: leadSource, // Map leadSource to source
        // Employees is now an enum value like "SIZE_1_10", "SIZE_11_50", etc.
        employees: companyData.employees || null,
        dealValue: companyData.dealValue
          ? parseFloat(companyData.dealValue)
          : null,
        // Include type and subType
        type: companyData.type || null,
        subType: companyData.subType || null,
      };

      // Remove empty string values and replace with null (except required fields)
      // Industry is required, so we keep it even if empty (validation will catch it)
      Object.keys(companyUpdateData).forEach((key) => {
        if (key !== "industry" && companyUpdateData[key] === "") {
          companyUpdateData[key] = null;
        }
      });

      await leadCompanyService.update(leadCompanyId, companyUpdateData);

      // Update contacts
      const validContacts = contacts.filter(
        (contact) =>
          contact.firstName.trim() ||
          contact.lastName.trim() ||
          contact.email.trim()
      );

      for (const contact of validContacts) {
        const contactData = {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          title: contact.jobTitle,
          department: contact.department,
          role: contact.role,
          leadCompany: leadCompanyId,
        };

        if (contact.existingContactId) {
          // Update existing contact
          await contactService.update(contact.existingContactId, contactData);
        } else {
          // Create new contact
          await contactService.create(contactData);
        }
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/sales/lead-companies/${leadCompanyId}`);
      }, 2000);
    } catch (error) {
      console.error("Error updating lead company:", error);
      setErrors({
        general: "Failed to update lead company. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 bg-white min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="text-gray-600 text-lg">
              Loading lead company details...
            </span>
            <span className="text-gray-400 text-sm">
              Please wait while we fetch the data
            </span>
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
          Lead company updated successfully!
        </div>
      )}

      <div className="p-4 space-y-4 bg-white min-h-screen">
        {/* Page Header */}
        <PageHeader
          title="Edit Lead Company"
          subtitle="Update lead company information and contacts"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Sales", href: "/sales" },
            { label: "Lead Companies", href: "/sales/lead-companies" },
            {
              label: companyData.companyName || "Edit",
              href: `/sales/lead-companies/${leadCompanyId}/edit`,
            },
          ]}
          showActions={false}
        />

        {/* Custom Actions */}
        <div className="flex items-center justify-end gap-3 mb-4">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/sales/lead-companies/${leadCompanyId}`)
            }
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
            {isSubmitting ? "Updating..." : "Update Lead Company"}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <Input
                    value={companyData.companyName}
                    onChange={(e) =>
                      handleCompanyChange("companyName", e.target.value)
                    }
                    placeholder="Enter company name"
                    error={errors.companyName}
                  />
                </div>

                <div>
                  <Select
                    label="Industry *"
                    value={companyData.industry}
                    onChange={(value) => handleCompanyChange("industry", value)}
                    options={industryOptions}
                    error={errors.industry}
                    placeholder="Select industry"
                    required
                  />
                </div>

                <div>
                  <Select
                    label="Company Type"
                    value={companyData.type}
                    onChange={(value) => handleCompanyChange("type", value)}
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
                    value={companyData.subType}
                    onChange={(value) => handleCompanyChange("subType", value)}
                    options={getSubTypeOptions()}
                    placeholder={
                      companyData.type
                        ? "Select sub-type"
                        : "Select company type first"
                    }
                    disabled={!companyData.type}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <Input
                    value={companyData.website}
                    onChange={(e) =>
                      handleCompanyChange("website", e.target.value)
                    }
                    placeholder="https://example.com"
                    icon={Globe}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <Input
                    value={companyData.phone}
                    onChange={(e) =>
                      handleCompanyChange("phone", e.target.value)
                    }
                    placeholder="+1 (555) 123-4567"
                    icon={Phone}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    value={companyData.email}
                    onChange={(e) =>
                      handleCompanyChange("email", e.target.value)
                    }
                    placeholder="contact@company.com"
                    icon={Mail}
                  />
                </div>

                <div>
                  <Select
                    label="Company Size"
                    value={companyData.employees}
                    onChange={(value) =>
                      handleCompanyChange("employees", value)
                    }
                    options={employeeSizeOptions}
                    placeholder="Select company size"
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
                    value={companyData.address}
                    onChange={(e) =>
                      handleCompanyChange("address", e.target.value)
                    }
                    placeholder="123 Business Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <Input
                    value={companyData.city}
                    onChange={(e) =>
                      handleCompanyChange("city", e.target.value)
                    }
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province
                  </label>
                  <Input
                    value={companyData.state}
                    onChange={(e) =>
                      handleCompanyChange("state", e.target.value)
                    }
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <Input
                    value={companyData.country}
                    onChange={(e) =>
                      handleCompanyChange("country", e.target.value)
                    }
                    placeholder="United States"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code
                  </label>
                  <Input
                    value={companyData.zipCode}
                    onChange={(e) =>
                      handleCompanyChange("zipCode", e.target.value)
                    }
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Lead Information */}
          <Card className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Lead Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Lead source, status, and deal information
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Select
                    label="Lead Source *"
                    value={companyData.leadSource}
                    onChange={(value) =>
                      handleCompanyChange("leadSource", value)
                    }
                    options={leadSourceOptions}
                    error={errors.leadSource}
                    placeholder="Select lead source"
                  />
                </div>

                <div>
                  <Select
                    label="Status"
                    value={companyData.status}
                    onChange={(value) => handleCompanyChange("status", value)}
                    options={statusOptions}
                    placeholder="Select status"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deal Value (₹)
                  </label>
                  <Input
                    type="number"
                    value={companyData.dealValue}
                    onChange={(e) =>
                      handleCompanyChange("dealValue", e.target.value)
                    }
                    placeholder="50000"
                    icon={IndianRupee}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Founded Year
                  </label>
                  <Input
                    type="number"
                    value={companyData.founded}
                    onChange={(e) =>
                      handleCompanyChange("founded", e.target.value)
                    }
                    placeholder="2020"
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
                      value={companyData.linkedIn}
                      onChange={(e) =>
                        handleCompanyChange("linkedIn", e.target.value)
                      }
                      placeholder="https://linkedin.com/company/example"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter URL
                    </label>
                    <Input
                      value={companyData.twitter}
                      onChange={(e) =>
                        handleCompanyChange("twitter", e.target.value)
                      }
                      placeholder="https://twitter.com/example"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Description
                  </label>
                  <Textarea
                    value={companyData.description}
                    onChange={(e) =>
                      handleCompanyChange("description", e.target.value)
                    }
                    placeholder="Brief description of the company..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <Textarea
                    value={companyData.notes}
                    onChange={(e) =>
                      handleCompanyChange("notes", e.target.value)
                    }
                    placeholder="Additional notes about this lead..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Contacts */}
          <Card className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Contacts
                    </h2>
                    <p className="text-sm text-gray-500">
                      Add contacts for this lead company
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addContact}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Contact
                </Button>
              </div>

              {contacts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contacts.map((contact, index) => (
                        <tr key={contact.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <User className="h-5 w-5 text-indigo-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {contact.firstName} {contact.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {contact.department || "No department"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {contact.email || "Not provided"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {contact.phone || "Not provided"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {contact.jobTitle || "Not specified"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
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
                              className="text-xs"
                            >
                              {roleOptions.find(
                                (opt) => opt.value === contact.role
                              )?.label || "Technical Contact"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {contact.isPrimary && (
                                <Badge variant="success" className="text-xs">
                                  Primary
                                </Badge>
                              )}
                              {contact.existingContactId && (
                                <Badge variant="outline" className="text-xs">
                                  Existing
                                </Badge>
                              )}
                              {!contact.existingContactId && (
                                <Badge variant="info" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {contact.existingContactId ? (
                                <>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        `/sales/contacts/${contact.existingContactId}`
                                      )
                                    }
                                    className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                    title="View Contact"
                                  >
                                    <User className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        `/sales/contacts/${contact.existingContactId}/edit`
                                      )
                                    }
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    title="Edit Contact"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Toggle edit mode for new contacts
                                    // You can implement inline editing here if needed
                                  }}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="Edit Contact"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              {contacts.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeContact(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Remove Contact"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No contacts
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding a contact to this lead company.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(`/sales/lead-companies/${leadCompanyId}`)
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSubmitting ? "Updating..." : "Update Lead Company"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
