"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, UserPlus } from "lucide-react";
import { Modal, Button, Input } from "@webfudge/ui";
import { Select } from "@/components/ui/Select";
import { Input as PasswordInput } from "@/components/ui/Input";
import {
  addCompanyMemberManaged,
  createCompanyRole,
  getContactById,
  listCompanyMembersManaged,
  updateCompanyMemberManaged,
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

const PORTAL_ACCESS_OPTIONS = [
  { value: "FULL_ACCESS", label: "Admin" },
  { value: "STANDARD_ACCESS", label: "Manager" },
  { value: "READ_ONLY", label: "Member" },
];

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
  const [changePassword, setChangePassword] = useState(false);

  const resetState = () => {
    setError("");
    setFieldErrors({});
    setSuccessMessage("");
    setChangePassword(false);
    setFormData(emptyForm);
    setMemberStatus("ACTIVE");
  };

  const handleClose = () => {
    if (loading) return;
    resetState();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError("");
    setFieldErrors({});
    setSuccessMessage("");
    setChangePassword(false);

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
      setFormData({ ...emptyForm });
      setMemberStatus("ACTIVE");
      return;
    }

    const loadMember = async () => {
      setLoadingMember(true);
      try {
        let data = null;
        if (memberId) {
          const response = await getContactById(memberId);
          data = response?.data || response?.member || response;
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
          portalAccessLevel: ["FULL_ACCESS", "STANDARD_ACCESS", "READ_ONLY"].includes(
            data?.portalAccessLevel
          )
            ? data?.portalAccessLevel
            : "READ_ONLY",
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

  const roleOptions = useMemo(
    () => [
      ...roles.map((role) => ({
        value: role,
        label: formatRoleLabel(role),
      })),
      ...(isEdit ? [] : [{ value: "CUSTOM", label: "+ Create New Role" }]),
    ],
    [roles, isEdit]
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
    if (isEdit && changePassword) {
      if (!formData.newPassword.trim()) {
        next.newPassword = "Enter a new password.";
      } else if (formData.newPassword.trim().length < 6) {
        next.newPassword = "Password must be at least 6 characters.";
      }
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
      const password = formData.password.trim() || generatePassword();

      if (!isEdit) {
        if (formData.role === "CUSTOM") {
          await createCompanyRole({
            name: resolvedRole,
            permissions: ["projects.read", "tasks.read", "tasks.comment"],
          });
        }

        const created = await addCompanyMemberManaged({
          name: fullName,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone || null,
          role: resolvedRole,
          portalAccessLevel: formData.portalAccessLevel,
          password,
          isCustomRole: formData.role === "CUSTOM",
        });

        setSuccessMessage(
          `Member added. Login: ${created?.member?.email || formData.email}`
        );
      } else {
        const id = memberId || initialMember?.id;
        const memberPayload = {
          name: fullName,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone || null,
          role: resolvedRole,
          portalAccessLevel: formData.portalAccessLevel,
          status: memberStatus,
        };
        if (changePassword && formData.newPassword.trim()) {
          memberPayload.password = formData.newPassword.trim();
        }

        await updateCompanyMemberManaged(id, memberPayload);

        setSuccessMessage("Member updated successfully.");
      }

      onSuccess?.();
      setTimeout(() => {
        resetState();
        onClose();
      }, 1200);
    } catch (submitError) {
      setError(submitError.message || "Failed to save member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Member" : "Add Member"}
      subtitle={
        isEdit
          ? "Update details, access, or reset password"
          : "Set up a new member profile and access level"
      }
      size="lg"
      closeOnBackdrop={!loading && !loadingMember}
    >
      {successMessage ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {loadingMember ? (
        <p className="py-8 text-center text-gray-600">Loading member...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Select
              label="Role"
              value={formData.role}
              onChange={(value) => handleChange("role", value)}
              options={roleOptions}
              allowEmpty={false}
              searchPlaceholder="Search roles…"
            />
            <Select
              label="Portal Access"
              value={formData.portalAccessLevel}
              onChange={(value) => handleChange("portalAccessLevel", value)}
              options={PORTAL_ACCESS_OPTIONS}
              allowEmpty={false}
              searchPlaceholder="Search access levels…"
            />
          </div>

          {formData.role === "CUSTOM" ? (
            <Input
              label="New Role Name"
              value={formData.customRoleName}
              onChange={(e) => handleChange("customRoleName", e.target.value)}
              placeholder="e.g. Operations Manager"
              error={fieldErrors.customRoleName}
            />
          ) : null}

          {isEdit ? (
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={changePassword}
                  onChange={(e) => {
                    setChangePassword(e.target.checked);
                    if (!e.target.checked) {
                      handleChange("newPassword", "");
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                Change password
              </label>
              {changePassword ? (
                <div className="space-y-1.5">
                  <PasswordInput
                    label="New Password"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => handleChange("newPassword", e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    error={fieldErrors.newPassword}
                  />
                  <p className="text-xs text-gray-500">
                    Minimum 6 characters. The member will sign in with this
                    password.
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Temporary Password (optional)
              </label>
              <Input
                type="text"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Auto-generated if left empty"
              />
              <p className="text-xs text-gray-500">
                If left empty, a secure password will be generated
                automatically.
              </p>
            </div>
          )}

          {error ? (
            <p className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="muted"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : isEdit ? "Update Member" : "Save Member"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
