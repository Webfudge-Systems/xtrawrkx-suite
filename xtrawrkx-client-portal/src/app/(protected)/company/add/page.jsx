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
import {
  addCompanyMemberManaged,
  createCompanyRole,
  getContactById,
  listCompanyMembersManaged,
  updateContactById,
} from "@/lib/api/companyMemberManagementService";

function generatePassword() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export default function AddCompanyMemberPage() {
  const router = useRouter();
  const [roles, setRoles] = useState(["ADMIN", "MEMBER", "DEVELOPER"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successPayload, setSuccessPayload] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "MEMBER",
    customRoleName: "",
    portalAccessLevel: "STANDARD_ACCESS",
    password: generatePassword(),
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await listCompanyMembersManaged();
        const roleNames = Array.isArray(response?.roles)
          ? response.roles.map((role) => role.name)
          : [];
        if (roleNames.length > 0) {
          setRoles(roleNames);
        }
      } catch {
        // Keep default roles.
      }
    };
    loadRoles();
  }, []);

  const resolvedRole = useMemo(() => {
    if (formData.role === "CUSTOM") {
      return formData.customRoleName.trim().toUpperCase().replaceAll(" ", "_");
    }
    return formData.role;
  }, [formData.role, formData.customRoleName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!formData.firstName || !formData.email) {
        throw new Error("First name and email are required.");
      }
      if (formData.role === "CUSTOM" && !formData.customRoleName.trim()) {
        throw new Error("Please add a custom role name.");
      }

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

  return (
    <div className="bg-white min-h-screen">
      {successPayload && (
        <div className="fixed top-4 right-4 z-[120] bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl border border-green-400 min-w-[320px] max-w-[460px]">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">Member added successfully</p>
              <p className="text-sm text-green-50 truncate">
                Login: {successPayload?.member?.email || "-"}
              </p>
              <p className="text-sm text-green-50 truncate">
                Temp password: {successPayload?.credentials?.tempPassword || "-"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-4">
        <PageHeader
          title="Add Company Member"
          subtitle="Set up a new member profile and access level"
          showSearch={false}
          showActions={false}
        />
      </div>

      <div className="px-3 mt-6">
        <div className="rounded-3xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push("/company")}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Company Members
            </button>
            <div className="w-11 h-11 rounded-xl bg-xtrawrkx-50 border border-xtrawrkx-200 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-xtrawrkx-600" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/50 border border-white/30 shadow-lg p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h3>
                  <p className="text-sm text-gray-600">
                    Personal details for the new member
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/20 focus:border-xtrawrkx-400"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/20 focus:border-xtrawrkx-400"
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/20 focus:border-xtrawrkx-400"
                    placeholder="name@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/20 focus:border-xtrawrkx-400"
                    placeholder="+91 xxxxx xxxxx"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/50 border border-white/30 shadow-lg p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Role & Access
                  </h3>
                  <p className="text-sm text-gray-600">
                    Permissions and member portal access
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/20 focus:border-xtrawrkx-400"
                  >
                    <option value="PRIMARY_CONTACT">Primary Contact</option>
                    <option value="ADMIN">Admin</option>
                    {roles
                      .filter((role) => !["PRIMARY_CONTACT", "ADMIN"].includes(role))
                      .map((role) => (
                        <option key={role} value={role}>
                          {role.replaceAll("_", " ")}
                        </option>
                      ))}
                    <option value="CUSTOM">+ Create New Role</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portal Access
                  </label>
                  <select
                    value={formData.portalAccessLevel}
                    onChange={(e) =>
                      handleChange("portalAccessLevel", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/20 focus:border-xtrawrkx-400"
                  >
                    <option value="FULL_ACCESS">Full Access</option>
                    <option value="STANDARD_ACCESS">Standard Access</option>
                    <option value="BILLING_ONLY">Billing Only</option>
                  </select>
                </div>
              </div>

              {formData.role === "CUSTOM" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Role Name (Admin/Member Custom)
                  </label>
                  <input
                    type="text"
                    value={formData.customRoleName}
                    onChange={(e) => handleChange("customRoleName", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/20 focus:border-xtrawrkx-400"
                    placeholder="Ex: OPERATIONS_MANAGER"
                  />
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/50 border border-white/30 shadow-lg p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Credentials
                  </h3>
                  <p className="text-sm text-gray-600">
                    Temporary password for first sign-in
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temporary Password
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Members sign in with their email and this password (or use the share link).
                </p>
                <div className="flex gap-2 max-w-xl">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/20 focus:border-xtrawrkx-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleChange("password", generatePassword())}
                    className="px-4 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-gray-500">* Required fields</span>
              <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/company")}
                  className="px-5 py-2.5 text-sm font-semibold border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-xtrawrkx-500 to-pink-500 text-white hover:from-xtrawrkx-600 hover:to-pink-600 inline-flex items-center gap-2 min-w-[144px] justify-center"
              >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
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

