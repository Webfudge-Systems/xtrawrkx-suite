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
import contactService from "../../../../lib/api/contactService";
import strapiClient from "../../../../lib/strapiClient";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Briefcase,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Globe,
  Calendar,
} from "lucide-react";

export default function AddContactPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Users for assignment dropdown
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Contact data
  const [contactData, setContactData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    department: "",
    company: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    linkedIn: "",
    twitter: "",
    status: "ACTIVE",
    notes: "",
    // Additional fields
    birthDate: "",
    preferredContactMethod: "EMAIL",
    timezone: "",
    source: "MANUAL",
    assignedTo: "", // Added assignedTo field
  });

  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "LEFT_COMPANY", label: "Left Company" },
  ];

  const contactMethodOptions = [
    { value: "EMAIL", label: "Email" },
    { value: "PHONE", label: "Phone" },
    { value: "SMS", label: "SMS" },
    { value: "LINKEDIN", label: "LinkedIn" },
  ];

  const sourceOptions = [
    { value: "MANUAL", label: "Manual Entry" },
    { value: "WEBSITE", label: "Website" },
    { value: "REFERRAL", label: "Referral" },
    { value: "SOCIAL_MEDIA", label: "Social Media" },
    { value: "EMAIL_CAMPAIGN", label: "Email Campaign" },
    { value: "COLD_CALL", label: "Cold Call" },
    { value: "TRADE_SHOW", label: "Trade Show" },
    { value: "PARTNER", label: "Partner" },
    { value: "OTHER", label: "Other" },
  ];

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

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

      // Auto-select the current logged-in user if found
      if (user?.email && allUsers.length > 0) {
        const currentUser = allUsers.find((u) => u.email === user.email);
        if (currentUser) {
          setContactData((prev) => ({
            ...prev,
            assignedTo: currentUser.id.toString(),
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInputChange = (field, value) => {
    setContactData((prev) => ({
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
    if (!contactData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!contactData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!contactData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(contactData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Optional phone validation
    if (
      contactData.phone &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(
        contactData.phone.replace(/[\s\-\(\)]/g, "")
      )
    ) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Optional website validation
    if (contactData.website && !/^https?:\/\/.+/.test(contactData.website)) {
      newErrors.website =
        "Please enter a valid website URL (include http:// or https://)";
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
      // Prepare contact data
      const contactPayload = {
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone,
        title: contactData.title,
        department: contactData.department,
        company: contactData.company,
        website: contactData.website,
        address: contactData.address,
        city: contactData.city,
        state: contactData.state,
        country: contactData.country,
        zipCode: contactData.zipCode,
        linkedIn: contactData.linkedIn,
        twitter: contactData.twitter,
        status: contactData.status,
        notes: contactData.notes,
        birthDate: contactData.birthDate || null,
        preferredContactMethod: contactData.preferredContactMethod,
        timezone: contactData.timezone,
        source: contactData.source,
      };

      // Add assigned user if selected
      if (contactData.assignedTo) {
        contactPayload.assignedTo = parseInt(contactData.assignedTo);
      }


      // Create the contact
      const createdContact = await contactService.create(contactPayload);


      setShowSuccess(true);

      // Redirect after success
      setTimeout(() => {
        router.push(`/sales/contacts/${createdContact.id}`);
      }, 2000);
    } catch (error) {
      console.error("Error creating contact:", error);
      setErrors({ submit: "Failed to create contact. Please try again." });
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
          <p className="text-gray-600 mb-4">Contact created successfully</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">
            Redirecting to contact details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 space-y-6">
        <PageHeader
          title="Add New Contact"
          subtitle="Create a new contact with detailed information"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Sales", href: "/sales" },
            { label: "Contacts", href: "/sales/contacts" },
            { label: "Add New", href: "/sales/contacts/new" },
          ]}
          showProfile={true}
          showSearch={false}
          showActions={false}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Basic Information
                </h3>
                <p className="text-sm text-gray-600">
                  Essential contact details and personal information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Input
                  label="First Name *"
                  value={contactData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  error={errors.firstName}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Input
                  label="Last Name *"
                  value={contactData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  error={errors.lastName}
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <Select
                  label="Status"
                  value={contactData.status}
                  onChange={(value) => handleInputChange("status", value)}
                  options={statusOptions}
                  placeholder="Select status"
                />
              </div>

              <div>
                <Select
                  label="Assigned To"
                  value={contactData.assignedTo}
                  onChange={(value) => handleInputChange("assignedTo", value)}
                  options={[
                    { value: "", label: "Unassigned" },
                    ...users.map((u) => ({
                      value: u.id.toString(),
                      label:
                        `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                        u.email,
                    })),
                  ]}
                  disabled={loadingUsers}
                  placeholder="Select owner"
                />
              </div>

              <div>
                <Input
                  label="Email Address *"
                  type="email"
                  value={contactData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  error={errors.email}
                  placeholder="contact@company.com"
                  icon={Mail}
                />
              </div>
              <div>
                <Input
                  label="Phone Number"
                  type="tel"
                  value={contactData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  error={errors.phone}
                  placeholder="+1 (555) 123-4567"
                  icon={Phone}
                />
              </div>
              <div>
                <Select
                  label="Preferred Contact Method"
                  value={contactData.preferredContactMethod}
                  onChange={(value) =>
                    handleInputChange("preferredContactMethod", value)
                  }
                  options={contactMethodOptions}
                  placeholder="Select method"
                />
              </div>

              <div>
                <Input
                  label="Birth Date"
                  type="date"
                  value={contactData.birthDate}
                  onChange={(e) =>
                    handleInputChange("birthDate", e.target.value)
                  }
                  icon={Calendar}
                />
              </div>
              <div>
                <Input
                  label="Timezone"
                  value={contactData.timezone}
                  onChange={(e) =>
                    handleInputChange("timezone", e.target.value)
                  }
                  placeholder="e.g., America/New_York"
                />
              </div>
              <div>
                <Select
                  label="Source"
                  value={contactData.source}
                  onChange={(value) => handleInputChange("source", value)}
                  options={sourceOptions}
                  placeholder="How did you find this contact?"
                />
              </div>
            </div>
          </Card>

          {/* Professional Information */}
          <Card className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Professional Information
                </h3>
                <p className="text-sm text-gray-600">
                  Work-related details and company information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Input
                  label="Job Title"
                  value={contactData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., Marketing Manager"
                  icon={Briefcase}
                />
              </div>
              <div>
                <Input
                  label="Department"
                  value={contactData.department}
                  onChange={(e) =>
                    handleInputChange("department", e.target.value)
                  }
                  placeholder="e.g., Marketing, Sales, IT"
                />
              </div>
              <div>
                <Input
                  label="Company"
                  value={contactData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  placeholder="Company name"
                  icon={Building2}
                />
              </div>

              <div className="lg:col-span-3">
                <Input
                  label="Company Website"
                  type="url"
                  value={contactData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  error={errors.website}
                  placeholder="https://company.com"
                  icon={Globe}
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
                  value={contactData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="123 Main Street"
                  icon={MapPin}
                />
              </div>

              <div>
                <Input
                  label="City"
                  value={contactData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="New York"
                />
              </div>
              <div>
                <Input
                  label="State/Province"
                  value={contactData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="NY"
                />
              </div>
              <div>
                <Input
                  label="ZIP/Postal Code"
                  value={contactData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  placeholder="10001"
                />
              </div>

              <div className="lg:col-span-3">
                <Input
                  label="Country"
                  value={contactData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  placeholder="United States"
                />
              </div>
            </div>
          </Card>

          {/* Social & Additional Information */}
          <Card className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
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
                  value={contactData.linkedIn}
                  onChange={(e) =>
                    handleInputChange("linkedIn", e.target.value)
                  }
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <Input
                  label="Twitter Handle"
                  value={contactData.twitter}
                  onChange={(e) => handleInputChange("twitter", e.target.value)}
                  placeholder="@username"
                />
              </div>
            </div>

            <div>
              <Textarea
                label="Notes"
                value={contactData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about this contact..."
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
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white flex items-center gap-2 min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Contact
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
