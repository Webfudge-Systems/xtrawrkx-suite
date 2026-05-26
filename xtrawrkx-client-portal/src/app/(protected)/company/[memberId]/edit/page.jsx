"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getContactById,
  listCompanyMembersManaged,
  updateCompanyMemberManaged,
  updateContactById,
} from "@/lib/api/companyMemberManagementService";

export default function EditCompanyMemberPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params?.memberId;
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [roleOptions, setRoleOptions] = useState(["ADMIN", "MEMBER", "DEVELOPER"]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "MEMBER",
    portalAccessLevel: "STANDARD_ACCESS",
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [memberResponse, rolesResponse] = await Promise.all([
          getContactById(memberId),
          listCompanyMembersManaged(),
        ]);
        const data = memberResponse?.data || memberResponse;
        setMember(data || null);
        setFormData({
          firstName: data?.firstName || "",
          lastName: data?.lastName || "",
          email: data?.email || "",
          phone: data?.phone || "",
          role:
            data?.portalAccess?.roleName ||
            (data?.role === "PRIMARY_CONTACT" ? "ADMIN" : "MEMBER"),
          portalAccessLevel: data?.portalAccessLevel || "READ_ONLY",
        });
        const roleNames = Array.isArray(rolesResponse?.roles)
          ? rolesResponse.roles.map((role) => role.name)
          : [];
        if (roleNames.length > 0) {
          setRoleOptions(roleNames);
        }
      } catch (loadError) {
        setError(loadError.message || "Failed to load member.");
      } finally {
        setLoading(false);
      }
    };
    if (memberId) {
      load();
    }
  }, [memberId]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      await Promise.all([
        updateCompanyMemberManaged(memberId, {
          name: fullName,
          role: formData.role,
          status: member?.status || "ACTIVE",
        }),
        updateContactById(memberId, {
          email: formData.email,
          phone: formData.phone,
          portalAccessLevel: formData.portalAccessLevel,
        }),
      ]);
      router.push(`/company/${memberId}`);
    } catch (submitError) {
      setError(submitError.message || "Failed to update member.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="px-4 pt-4">
        <PageHeader
          title="Edit Member"
          subtitle="Update member details and portal access"
          showSearch={false}
          showActions={false}
        />
      </div>

      <div className="px-3 mt-4">
        <div className="flex justify-end gap-3 mb-4">
          <button
            type="button"
            onClick={() => router.push(`/company/${memberId}`)}
            className="h-11 px-5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="submit"
            form="edit-member-form"
            disabled={saving}
            className="h-11 px-5 rounded-xl bg-xtrawrkx-500 text-white font-semibold hover:bg-xtrawrkx-600"
          >
            {saving ? "Updating..." : "Update Member"}
          </button>
        </div>

        <div className="max-w-6xl rounded-3xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
          {loading ? (
            <p className="text-gray-600">Loading member...</p>
          ) : !member ? (
            <p className="text-gray-600">{error || "Member not found."}</p>
          ) : (
            <form id="edit-member-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="rounded-2xl border border-gray-200/80 bg-white/70 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-gray-900">
                      Member Information
                    </p>
                    <p className="text-sm text-gray-500">
                      Update member details and access settings
                    </p>
                  </div>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/20"
                  />
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
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/20"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role.replaceAll("_", " ")}
                      </option>
                    ))}
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
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/20"
                  >
                    <option value="FULL_ACCESS">Full Access</option>
                    <option value="PROJECT_VIEW">Project View</option>
                    <option value="INVOICE_VIEW">Invoice View</option>
                    <option value="READ_ONLY">Read Only</option>
                    <option value="NO_ACCESS">No Access</option>
                  </select>
                </div>
              </div>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}

