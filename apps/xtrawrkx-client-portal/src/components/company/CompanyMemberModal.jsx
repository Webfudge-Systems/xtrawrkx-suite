"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  UserPlus,
  Pencil,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import {
  addCompanyMemberManaged,
  createCompanyRole,
  getContactById,
  listCompanyMembersManaged,
  updateCompanyMemberManaged,
  updateContactById,
} from "@/lib/api/companyMemberManagementService";

function generatePassword() {
  return (
    Math.random().toString(36).slice(2, 8) +
    Math.random().toString(36).slice(2, 6).toUpperCase()
  );
}

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

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "ADMIN",
  customRoleName: "",
  portalAccessLevel: "FULL_ACCESS",
  password: "",
  newPassword: "",
};

export default function CompanyMemberModal({
  isOpen,
  onClose,
  mode = "add",
  memberId = null,
  initialMember = null,
  onSuccess,
}) {
  const isEdit = mode === "edit";
  const [roles, setRoles] = useState(BASE_PORTAL_ROLES);
  const [loading, setLoading] = useState(false);
  const [loadingMember, setLoadingMember] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [memberStatus, setMemberStatus] = useState("ACTIVE");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError("");
    setFieldErrors({});
    setSuccessMessage("");

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
        // Keep defaults.
      }
    };

    loadRoles();

    if (!isEdit) {
      setFormData({ ...emptyForm, password: generatePassword() });
      setMemberStatus("ACTIVE");
      return;
    }

    const loadMember = async () => {
      setLoadingMember(true);
      try {
        let data = null;
        if (memberId) {
          const response = await getContactById(memberId);
          data = response?.data || response;
        } else if (initialMember) {
          data = {
            firstName: initialMember.firstName,
            lastName: initialMember.lastName,
            email: initialMember.email,
            phone: initialMember.phone,
            portalAccessLevel: initialMember.portalAccessLevel,
            role: initialMember.role,
            status: initialMember.status,
          };
        }

        if (!data) {
          setError("Member not found.");
          return;
        }

        setMemberStatus(data?.status || initialMember?.status || "ACTIVE");
        setFormData({
          firstName: data?.firstName || "",
          lastName: data?.lastName || "",
          email: data?.email || "",
          phone: data?.phone === "No phone" ? "" : data?.phone || "",
          role:
            data?.portalAccess?.roleName ||
            (data?.role === "PRIMARY_CONTACT" ? "ADMIN" : data?.role || "MEMBER"),
          customRoleName: "",
          portalAccessLevel: data?.portalAccessLevel || "READ_ONLY",
          password: "",
          newPassword: "",
        });
      } catch (loadError) {
        setError(loadError.message || "Failed to load member.");
      } finally {
        setLoadingMember(false);
      }
    };

    loadMember();
  }, [isOpen, isEdit, memberId, initialMember]);

  const resolvedRole = useMemo(
    () => toApiPortalRole(formData.role, formData.customRoleName),
    [formData.role, formData.customRoleName]
  );

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
    if (!isEdit && !formData.password.trim()) {
      next.password = "Password is required.";
    }
    if (isEdit && formData.newPassword.trim() && formData.newPassword.trim().length < 6) {
      next.newPassword = "Password must be at least 6 characters.";
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
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      if (!isEdit) {
        if (formData.role === "CUSTOM") {
          await createCompanyRole({
            name: resolvedRole,
            permissions: ["projects.read", "tasks.read", "tasks.comment"],
          });
        }

        const created = await addCompanyMemberManaged({
          name: fullName,
          email: formData.email.trim(),
          role: resolvedRole,
          password: formData.password,
        });

        const newMemberId = created?.member?.id;
        if (newMemberId) {
          await updateContactById(newMemberId, {
            phone: formData.phone || null,
            portalAccessLevel: formData.portalAccessLevel,
          }).catch(() => null);
        }

        setSuccessMessage(
          `Member added. Login: ${created?.member?.email || formData.email}`
        );
      } else {
        const id = memberId || initialMember?.id;
        const memberPayload = {
          name: fullName,
          role: resolvedRole,
          status: memberStatus,
        };
        if (formData.newPassword.trim()) {
          memberPayload.password = formData.newPassword.trim();
        }

        await Promise.all([
          updateCompanyMemberManaged(id, memberPayload),
          updateContactById(id, {
            email: formData.email.trim(),
            phone: formData.phone || null,
            portalAccessLevel: formData.portalAccessLevel,
          }),
        ]);

        setSuccessMessage("Member updated successfully.");
      }

      onSuccess?.();
      setTimeout(() => {
        setSuccessMessage("");
        onClose();
      }, 1200);
    } catch (submitError) {
      setError(submitError.message || "Failed to save member.");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    ...roles.map((role) => ({
      value: role,
      label: formatRoleLabel(role),
    })),
    ...(isEdit ? [] : [{ value: "CUSTOM", label: "+ Create New Role" }]),
  ];

  if (typeof document === "undefined") {
    return null;
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close modal"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white border border-white/40 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    isEdit ? "bg-green-100" : "bg-pink-100"
                  }`}
                >
                  {isEdit ? (
                    <Pencil className="h-6 w-6 text-green-600" />
                  ) : (
                    <UserPlus className="h-6 w-6 text-pink-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl font-semibold text-gray-900 truncate">
                    {isEdit ? "Edit Member" : "Add Member"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isEdit
                      ? "Update details, access, or reset password"
                      : "Set up a new member profile and access level"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 shrink-0"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-88px)] px-6 py-5">
              {successMessage && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {loadingMember ? (
                <p className="text-gray-600 py-8 text-center">Loading member...</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                      placeholder="Enter first name"
                      error={fieldErrors.firstName}
                    />
                    <Input
                      label="Last Name"
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
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+91 xxxxx xxxxx"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <option value="PROJECT_VIEW">Project View</option>
                        <option value="INVOICE_VIEW">Invoice View</option>
                        <option value="READ_ONLY">Read Only</option>
                        <option value="BILLING_ONLY">Billing Only</option>
                        <option value="NO_ACCESS">No Access</option>
                      </select>
                    </div>
                  </div>

                  {formData.role === "CUSTOM" && (
                    <Input
                      label="New Role Name"
                      value={formData.customRoleName}
                      onChange={(e) =>
                        handleChange("customRoleName", e.target.value)
                      }
                      placeholder="e.g. Operations Manager"
                      error={fieldErrors.customRoleName}
                    />
                  )}

                  <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <KeyRound className="h-4 w-4 text-amber-600" />
                      <p className="text-sm font-semibold text-gray-900">
                        {isEdit ? "Change Password" : "Temporary Password"}
                      </p>
                    </div>
                    {isEdit ? (
                      <>
                        <p className="text-xs text-gray-500 mb-2">
                          Leave blank to keep the current password.
                        </p>
                        <Input
                          label="New Password"
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) =>
                            handleChange("newPassword", e.target.value)
                          }
                          placeholder="Enter new password"
                          error={fieldErrors.newPassword}
                        />
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          label="Password"
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            handleChange("password", e.target.value)
                          }
                          placeholder="Temporary password"
                          error={fieldErrors.password}
                          containerClassName="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleChange("password", generatePassword())
                          }
                          className="self-end shrink-0 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Generate
                        </button>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 h-12 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || loadingMember}
                      className="flex-1 h-12 rounded-xl bg-xtrawrkx-500 text-white font-semibold hover:bg-xtrawrkx-600 disabled:opacity-60"
                    >
                      {loading
                        ? "Saving..."
                        : isEdit
                          ? "Update Member"
                          : "Save Member"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
