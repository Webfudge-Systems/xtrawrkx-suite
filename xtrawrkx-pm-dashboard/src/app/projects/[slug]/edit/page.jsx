"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  Button,
  Input,
  Select,
  Textarea,
} from "../../../../components/ui";
import PageHeader from "../../../../components/shared/PageHeader";
import projectService from "../../../../lib/projectService";
import apiClient from "../../../../lib/apiClient";
import {
  FolderOpen,
  Calendar,
  DollarSign,
  Target,
  User,
  Building2,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Palette,
  Type,
} from "lucide-react";

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectSlug = params.slug;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [projectId, setProjectId] = useState(null);

  // Project data
  const [projectData, setProjectData] = useState({
    name: "",
    slug: "",
    description: "",
    status: "PLANNING",
    startDate: "",
    endDate: "",
    budget: "",
    spent: "",
    color: "from-blue-400 to-blue-600",
    icon: "",
    projectManager: "",
    account: "",
    clientAccount: "",
  });

  const statusOptions = [
    { value: "PLANNING", label: "Planning" },
    { value: "ACTIVE", label: "Active" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
    { value: "ON_HOLD", label: "On Hold" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const colorOptions = [
    { value: "from-blue-400 to-blue-600", label: "Blue" },
    { value: "from-green-400 to-green-600", label: "Green" },
    { value: "from-purple-400 to-purple-600", label: "Purple" },
    { value: "from-orange-400 to-orange-600", label: "Orange" },
    { value: "from-pink-400 to-pink-600", label: "Pink" },
    { value: "from-red-400 to-red-600", label: "Red" },
    { value: "from-yellow-400 to-yellow-600", label: "Yellow" },
    { value: "from-indigo-400 to-indigo-600", label: "Indigo" },
  ];

  // Fetch project data and users on component mount
  useEffect(() => {
    if (projectSlug) {
      fetchProjectData();
      fetchUsers();
      fetchAccounts();
    }
  }, [projectSlug]);

  // Match project account to client account after both are loaded
  useEffect(() => {
    if (!isLoading && accounts.length > 0 && projectData.name && projectData.account === "") {
      // Try to find the project's account from the loaded project data
      // This will be set when we fetch the project
      const projectAccountCompanyName = projectData.accountCompanyName;
      if (projectAccountCompanyName) {
        const matchingClientAccount = accounts.find(
          (ca) => (ca.companyName || ca.name || ca.attributes?.companyName) === projectAccountCompanyName
        );
        if (matchingClientAccount) {
          const clientAccountId = (matchingClientAccount.id || matchingClientAccount.documentId).toString();
          setProjectData((prev) => ({
            ...prev,
            account: clientAccountId,
          }));
        }
      }
    }
  }, [isLoading, accounts, projectData.name]);

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
        const response = await apiClient.get("/api/xtrawrkx-users", queryParams);
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

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      let allAccounts = [];
      let page = 1;
      let hasMore = true;
      const pageSize = 100;
      
      // Fetch client accounts (since that's where clients are stored)
      // Note: Projects link to api::account.account, but we're showing client-accounts
      // We'll mark them so we know not to try to link them directly
      while (hasMore) {
        const queryParams = {
          "pagination[page]": page,
          "pagination[pageSize]": pageSize,
        };
        
        const response = await apiClient.get("/api/client-accounts", queryParams);
        
        let accountsData = [];
        if (Array.isArray(response)) {
          accountsData = response;
        } else if (Array.isArray(response?.data)) {
          accountsData = response.data;
        }
        
        if (Array.isArray(accountsData) && accountsData.length > 0) {
          const extracted = accountsData.map((a) => {
            if (a.attributes) {
              return {
                id: a.id || a.documentId,
                documentId: a.id || a.documentId,
                name: a.attributes.companyName || a.attributes.name || "Unknown Account",
                companyName: a.attributes.companyName || a.attributes.name,
                isClientAccount: true, // Mark as client account
                ...a.attributes,
              };
            }
            return {
              id: a.id || a.documentId,
              documentId: a.id || a.documentId,
              name: a.companyName || a.name || "Unknown Account",
              companyName: a.companyName || a.name,
              isClientAccount: true, // Mark as client account
              ...a,
            };
          });
          allAccounts = [...allAccounts, ...extracted];
          
          const pageCount = response?.meta?.pagination?.pageCount || 
                           (response?.pagination?.pageCount) || 1;
          hasMore = page < pageCount && accountsData.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      setAccounts(allAccounts);
    } catch (e) {
      console.error("Error fetching accounts:", e);
      console.error("Error details:", e.response || e.message);
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      
      // Handle both Promise-based and direct params (Next.js App Router compatibility)
      let slugParam;
      if (projectSlug instanceof Promise) {
        const resolvedParams = await projectSlug;
        slugParam = resolvedParams;
      } else {
        slugParam = projectSlug;
      }

      if (!slugParam) {
        throw new Error("Project identifier is required");
      }

      let strapiProject = null;

      // Try to parse as ID first (if it's numeric)
      const parsedId = parseInt(slugParam, 10);
      if (!isNaN(parsedId)) {
        try {
          strapiProject = await projectService.getProjectById(parsedId, [
            "projectManager",
            "account",
            "deal",
            "clientAccount",
          ]);
          setProjectId(parsedId);
        } catch (idError) {
        }
      }

      // If not found by ID or not numeric, try by slug
      if (!strapiProject) {
        try {
          strapiProject = await projectService.getProjectBySlug(slugParam, [
            "projectManager",
            "account",
            "deal",
            "clientAccount",
          ]);
          setProjectId(strapiProject.id || strapiProject.documentId);
        } catch (slugError) {
          console.error("Failed to fetch by slug:", slugError);
          throw new Error("Project not found");
        }
      }

      if (!strapiProject) {
        throw new Error("Project not found");
      }

      // Handle both Strapi v4 attributes and direct data
      const project = strapiProject.attributes || strapiProject;

      // Format dates for input fields
      let formattedStartDate = "";
      if (project.startDate) {
        const date = new Date(project.startDate);
        formattedStartDate = date.toISOString().split("T")[0];
      }

      let formattedEndDate = "";
      if (project.endDate) {
        const date = new Date(project.endDate);
        formattedEndDate = date.toISOString().split("T")[0];
      }

      setProjectData({
        name: project.name || "",
        slug: project.slug || "",
        description: project.description || "",
        status: project.status || "PLANNING",
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        budget: project.budget?.toString() || "",
        spent: project.spent?.toString() || "",
        color: project.color || "from-blue-400 to-blue-600",
        icon: project.icon || "",
        projectManager:
          project.projectManager?.id ||
          project.projectManager?.documentId ||
          "",
        // Note: project.account is an api::account.account, but we need to find the corresponding client account
        // For now, we'll set it to empty and let the user select from client accounts
        // The backend will handle the conversion when updating
        account: "", // We'll find the corresponding client account if needed
        clientAccount:
          project.clientAccount?.id ||
          project.clientAccount?.documentId ||
          "",
      });
    } catch (error) {
      console.error("Error fetching project:", error);
      setErrors({
        general:
          error.response?.data?.error?.message ||
          error.message ||
          "Failed to load project data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProjectData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate slug from name if name is being changed
    if (field === "name" && value) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setProjectData((prev) => ({
        ...prev,
        name: value,
        slug: prev.slug || generatedSlug,
      }));
    }

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
    if (!projectData.name.trim()) {
      newErrors.name = "Project name is required";
    }
    if (!projectData.slug.trim()) {
      newErrors.slug = "Project slug is required";
    }

    // Slug validation
    if (projectData.slug && !/^[a-z0-9-]+$/.test(projectData.slug)) {
      newErrors.slug =
        "Slug can only contain lowercase letters, numbers, and hyphens";
    }

    // Date validation
    if (projectData.startDate && projectData.endDate) {
      const startDate = new Date(projectData.startDate);
      const endDate = new Date(projectData.endDate);
      if (endDate < startDate) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    // Budget validation
    if (
      projectData.budget &&
      (isNaN(projectData.budget) || parseFloat(projectData.budget) < 0)
    ) {
      newErrors.budget = "Please enter a valid budget amount";
    }

    // Spent validation
    if (
      projectData.spent &&
      (isNaN(projectData.spent) || parseFloat(projectData.spent) < 0)
    ) {
      newErrors.spent = "Please enter a valid spent amount";
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
      // Format dates for Strapi
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
        name: projectData.name,
        slug: projectData.slug,
        description: projectData.description || null,
        status: projectData.status,
        startDate: formatDateForStrapi(projectData.startDate),
        endDate: formatDateForStrapi(projectData.endDate),
        budget: projectData.budget ? parseFloat(projectData.budget) : null,
        spent: projectData.spent ? parseFloat(projectData.spent) : null,
        color: projectData.color || null,
        icon: projectData.icon || null,
        projectManager: projectData.projectManager || null,
      };

      // Handle account field
      // The backend will handle converting client account IDs to account IDs
      // So we can send the client account ID directly
      if (projectData.account && projectData.account !== "") {
        // Convert to number if it's a string (Strapi expects numeric IDs)
        const accountId = typeof projectData.account === 'string' 
          ? parseInt(projectData.account, 10) 
          : projectData.account;
        updateData.account = !isNaN(accountId) ? accountId : null;
      } else {
        // No account selected, set to null to clear the field
        updateData.account = null;
      }

      // Handle clientAccount field
      if (projectData.clientAccount && projectData.clientAccount !== "") {
        const clientAccountId = typeof projectData.clientAccount === 'string' 
          ? parseInt(projectData.clientAccount, 10) 
          : projectData.clientAccount;
        updateData.clientAccount = !isNaN(clientAccountId) ? clientAccountId : null;
      } else {
        updateData.clientAccount = null;
      }

      // Remove empty string values and replace with null
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === "") {
          updateData[key] = null;
        }
      });

      await projectService.updateProject(projectId, updateData);

      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/projects/${projectData.slug || projectId}`);
      }, 2000);
    } catch (error) {
      console.error("Error updating project:", error);

      // Extract specific error message from Strapi response
      let errorMessage = "Failed to update project. Please try again.";
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
            <span className="text-gray-600">Loading project...</span>
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
          Project updated successfully!
        </div>
      )}

      <div className="p-4 space-y-4 bg-white min-h-screen">
        {/* Page Header */}
        <PageHeader
          title="Edit Project"
          subtitle="Update project information and details"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Projects", href: "/projects" },
            {
              label: projectData.name || "Edit",
              href: `/projects/${projectSlug}/edit`,
            },
          ]}
          showActions={false}
        />

        {/* Custom Actions */}
        <div className="flex items-center justify-end gap-3 mb-4">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/projects/${projectData.slug || projectId}`)
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
            {isSubmitting ? "Updating..." : "Update Project"}
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
          {/* Project Information */}
          <Card className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-500/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Project Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Basic project details and identification
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <Input
                    value={projectData.name}
                    onChange={(e) =>
                      handleInputChange("name", e.target.value)
                    }
                    placeholder="Enter project name"
                    error={errors.name}
                    icon={Type}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug *
                  </label>
                  <Input
                    value={projectData.slug}
                    onChange={(e) =>
                      handleInputChange("slug", e.target.value)
                    }
                    placeholder="project-slug"
                    error={errors.slug}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL-friendly identifier (lowercase letters, numbers, and hyphens only)
                  </p>
                </div>

                <div>
                  <Select
                    label="Status"
                    value={projectData.status}
                    onChange={(value) => handleInputChange("status", value)}
                    options={statusOptions}
                    placeholder="Select status"
                  />
                </div>

                <div>
                  <Select
                    label="Color Theme"
                    value={projectData.color}
                    onChange={(value) => handleInputChange("color", value)}
                    options={colorOptions}
                    placeholder="Select color"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon
                  </label>
                  <Input
                    value={projectData.icon}
                    onChange={(e) =>
                      handleInputChange("icon", e.target.value)
                    }
                    placeholder="Single character or emoji"
                    maxLength={1}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Single character to display as project icon
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={projectData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Brief description of the project..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Timeline & Budget */}
          <Card className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Timeline & Budget
                  </h2>
                  <p className="text-sm text-gray-500">
                    Project dates and financial information
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={projectData.startDate}
                    onChange={(e) =>
                      handleInputChange("startDate", e.target.value)
                    }
                    icon={Calendar}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={projectData.endDate}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    }
                    icon={Calendar}
                    error={errors.endDate}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={projectData.budget}
                    onChange={(e) =>
                      handleInputChange("budget", e.target.value)
                    }
                    placeholder="0.00"
                    icon={DollarSign}
                    error={errors.budget}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spent
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={projectData.spent}
                    onChange={(e) =>
                      handleInputChange("spent", e.target.value)
                    }
                    placeholder="0.00"
                    icon={DollarSign}
                    error={errors.spent}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Project Management */}
          <Card className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Project Management
                  </h2>
                  <p className="text-sm text-gray-500">
                    Assign project manager and link to account
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Select
                    label="Project Manager"
                    value={projectData.projectManager}
                    onChange={(value) =>
                      handleInputChange("projectManager", value)
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
                    placeholder="Select project manager"
                    disabled={loadingUsers}
                  />
                </div>

                <div>
                  <Select
                    label="Client Account"
                    value={projectData.clientAccount}
                    onChange={(value) => handleInputChange("clientAccount", value)}
                    options={[
                      { value: "", label: "No Client Account" },
                      ...accounts.map((a) => ({
                        value: (a.id || a.documentId).toString(),
                        label: a.name || a.companyName || a.attributes?.name || a.attributes?.companyName || "Unknown Account",
                      })),
                    ]}
                    placeholder="Select client account"
                    disabled={loadingAccounts}
                    icon={Building2}
                  />
                  {loadingAccounts && (
                    <p className="text-xs text-gray-500 mt-1">Loading accounts...</p>
                  )}
                  {!loadingAccounts && accounts.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No accounts found</p>
                  )}
                  {!loadingAccounts && accounts.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {accounts.length} account{accounts.length !== 1 ? "s" : ""} available
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </>
  );
}

