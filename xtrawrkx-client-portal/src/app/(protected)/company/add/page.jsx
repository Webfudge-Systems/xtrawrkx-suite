"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  Save,
  AlertCircle,
  Shield,
  KeyRound,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import {
  addCompanyMemberManaged,
  createCompanyRole,
  getContactById,
  listCompanyMembersManaged,
  updateContactById,
} from "@/lib/api/companyMemberManagementService";

function generatePassword() {
  return (
    Math.random().toString(36).slice(2, 8) +
    Math.random().toString(36).slice(2, 6).toUpperCase()
  );
}

/** Portal roles accepted by POST /auth/company-members (not contact roles). */
const BASE_PORTAL_ROLES = [
  "ADMIN",
  "MANAGER",
  "DEVELOPER",
  "DEVOPS_ENGINEER",
  "UX_DESIGNER",
];

const PORTAL_ROLE_LABELS = {
  ADMIN: "Primary Contact",
  MANAGER: "Admin / Manager",
  DEVELOPER: "Developer",
  DEVOPS_ENGINEER: "DevOps Engineer",
  UX_DESIGNER: "UX Designer",
};

/** Map legacy UI values to API portal role names. */
function toApiPortalRole(role, customRoleName = "") {
  if (role === "CUSTOM") {
    return customRoleName.trim().toUpperCase().replaceAll(" ", "_");
  }
  if (role === "PRIMARY_CONTACT" || role === "MEMBER") {
    return role === "PRIMARY_CONTACT" ? "ADMIN" : "DEVELOPER";
  }
  return role;
}

function formatRoleLabel(roleName) {
  return (
    PORTAL_ROLE_LABELS[roleName] ||
    String(roleName || "").replaceAll("_", " ")
  );
}

const selectClass =
  "w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-xtrawrkx-400 focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/25";

function FormSection({ icon: Icon, iconWrapClass, title, description, children }) {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconWrapClass}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function AddCompanyMemberPage() {
  const router = useRouter();
  const [roles, setRoles] = useState(BASE_PORTAL_ROLES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [successPayload, setSuccessPayload] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "ADMIN",
    customRoleName: "",
    portalAccessLevel: "STANDARD_ACCESS",
    password: generatePassword(),
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await listCompanyMembersManaged();
        const roleNames = Array.isArray(response?.roles)
          ? response.roles.map((role) => role.name).filter(Boolean)
          : [];
        const merged = [
          ...new Set([
            ...BASE_PORTAL_ROLES,
            ...roleNames.filter(
              (name) => name !== "PRIMARY_CONTACT" && name !== "MEMBER"
            ),
          ]),
        ];
        if (merged.length > 0) {
          setRoles(merged);
        }
      } catch {
        // Keep default roles.
      }
    };
    loadRoles();
  }, []);

  const resolvedRole = useMemo(
    () => toApiPortalRole(formData.role, formData.customRoleName),
    [formData.role, formData.customRoleName]
  );

  const validateForm = () => {
    const next = {};
    if (!formData.firstName.trim()) {
      next.firstName = "First name is required.";
    }
    if (!formData.email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (formData.role === "CUSTOM" && !formData.customRoleName.trim()) {
      next.customRoleName = "Please enter a name for the new role.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (formData.role === "CUSTOM") {
        await createCompanyRole({
          name: resolvedRole,
          permissions: ["projects.read", "tasks.read", "tasks.comment"],
        });
      }

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const created = await addCompanyMemberManaged({
        name: fullName,
        email: formData.email.trim(),
        role: resolvedRole,
        password: formData.password,
      });

      const memberId = created?.member?.id;
      if (memberId) {
        await updateContactById(memberId, {
          phone: formData.phone || null,
          portalAccessLevel: formData.portalAccessLevel,
        }).catch(() => null);
        await getContactById(memberId).catch(() => null);
      }

      setSuccessPayload(created);
      setTimeout(() => {
        setSuccessPayload(null);
        router.push("/company");
      }, 4500);
    } catch (submitError) {
      setError(submitError.message || "Failed to add member.");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    ...roles.map((role) => ({
      value: role,
      label: formatRoleLabel(role),
    })),
    { value: "CUSTOM", label: "+ Create New Role" },
  ];

  return (
    <div className="min-h-screen w-full bg-white">
      {successPayload && (
        <div className="fixed top-4 right-4 z-[120] min-w-[320px] max-w-[460px] rounded-xl border border-green-400 bg-green-500 px-6 py-4 text-white shadow-2xl">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">Member added successfully</p>
              <p className="truncate text-sm text-green-50">
                Login: {successPayload?.member?.email || "-"}
              </p>
              <p className="truncate text-sm text-green-50">
                Temp password:{" "}
                {successPayload?.credentials?.tempPassword || "-"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full pt-4">
        <PageHeader
          title="Add Company Member"
          subtitle="Set up a new member profile and access level"
          breadcrumb={[
            { label: "Company", href: "/company" },
            { label: "Add", href: "/company/add" },
          ]}
          showSearch={false}
          showActions={false}
        />
      </div>

      <div className="w-full border-t border-gray-200">
        <div className="w-full px-6 py-5 md:px-8">
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/company")}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Company Members
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-pink-100 bg-pink-50">
              <UserPlus className="h-5 w-5 text-pink-600" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <FormSection
              icon={UserPlus}
              iconWrapClass="bg-blue-500"
              title="Basic Information"
              description="Personal details for the new member"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="First Name"
                  required
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="Enter first name"
                  error={fieldErrors.firstName}
                />
                <Input
                  label="Last Name"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Enter last name"
                />
                <Input
                  label="Email"
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="name@company.com"
                  error={fieldErrors.email}
                />
                <Input
                  label="Phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+91 xxxxx xxxxx"
                />
              </div>
            </FormSection>

            <div className="border-t border-gray-100" />

            <FormSection
              icon={Shield}
              iconWrapClass="bg-emerald-500"
              title="Role & Access"
              description="Permissions and member portal access"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                    className={selectClass}
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Portal Access
                  </label>
                  <select
                    value={formData.portalAccessLevel}
                    onChange={(e) =>
                      handleChange("portalAccessLevel", e.target.value)
                    }
                    className={selectClass}
                  >
                    <option value="FULL_ACCESS">Full Access</option>
                    <option value="STANDARD_ACCESS">Standard Access</option>
                    <option value="BILLING_ONLY">Billing Only</option>
                  </select>
                </div>
              </div>

              {formData.role === "CUSTOM" && (
                <Input
                  label="New Role Name"
                  type="text"
                  value={formData.customRoleName}
                  onChange={(e) =>
                    handleChange("customRoleName", e.target.value)
                  }
                  placeholder="e.g. Operations Manager"
                  error={fieldErrors.customRoleName}
                />
              )}
            </FormSection>

            <div className="border-t border-gray-100" />

            <FormSection
              icon={KeyRound}
              iconWrapClass="bg-amber-500"
              title="Credentials"
              description="Temporary password for first sign-in"
            >
              <div className="w-full max-w-2xl">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Temporary Password
                </label>
                <p className="mb-2 text-xs text-gray-500">
                  Members sign in with their email and this password (or use
                  the share link).
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className={selectClass}
                  />
                  <button
                    type="button"
                    onClick={() => handleChange("password", generatePassword())}
                    className="shrink-0 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </FormSection>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col-reverse items-stretch justify-between gap-4 border-t border-gray-100 pt-6 sm:flex-row sm:items-center">
              <span className="text-xs text-gray-500">* Required fields</span>
              <div className="flex gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => router.push("/company")}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-w-[144px] items-center justify-center gap-2 rounded-lg bg-xtrawrkx-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-xtrawrkx-600 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Member
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
