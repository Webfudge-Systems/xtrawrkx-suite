"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button, Input, Select, SearchableSelect, Textarea } from "../../../components/ui";
import PageHeader from "../../../components/shared/PageHeader";
import projectService from "../../../lib/projectService";
import apiClient from "../../../lib/apiClient";
import { useAuth } from "../../../contexts/AuthContext";
import {
  FolderOpen,
  Calendar,
  Building2,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

export default function AddProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Users for project manager dropdown
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Client accounts for selection
  const [clientAccounts, setClientAccounts] = useState([]);
  const [loadingClientAccounts, setLoadingClientAccounts] = useState(false);

  // Project data
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    status: "PLANNING",
    startDate: "",
    endDate: "",
    budget: "",
    projectManager: "",
    clientAccount: "",
  });

  const statusOptions = [
    { value: "PLANNING", label: "Planning" },
    { value: "ACTIVE", label: "Active" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "ON_HOLD", label: "On Hold" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

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
          populate: "primaryRole,userRoles,department",
          "filters[isActive][$eq]": "true",
        };
        
        const response = await apiClient.get("/api/xtrawrkx-users", queryParams);
        
        let usersData = [];
        if (Array.isArray(response)) {
          usersData = response;
        } else if (Array.isArray(response?.data)) {
          usersData = response.data;
        }
        
        if (Array.isArray(usersData) && usersData.length > 0) {
          const extracted = usersData
            .filter((u) => u && u.id)
            .map((u) => {
              const userData = u.attributes || u;
              const firstName = userData.firstName || "";
              const lastName = userData.lastName || "";
              const email = userData.email || "";
              const name = `${firstName} ${lastName}`.trim() || email || "Unknown User";
              
              return {
                id: u.id || u.documentId,
                documentId: u.id || u.documentId,
                firstName,
                lastName,
                email,
                name,
                ...userData,
              };
            });
          allUsers = [...allUsers, ...extracted];
          
          const pageCount = response?.meta?.pagination?.pageCount || 
                           (response?.pagination?.pageCount) || 1;
          hasMore = page < pageCount && usersData.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      setUsers(allUsers);

      // Auto-select the current logged-in user if available
      if (user?.id) {
        setProjectData((prev) => ({
          ...prev,
          projectManager: user.id.toString(),
        }));
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch client accounts
  const fetchClientAccounts = async () => {
    try {
      setLoadingClientAccounts(true);
      let allAccounts = [];
      let page = 1;
      let hasMore = true;
      const pageSize = 100;
      
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
            const accountData = a.attributes || a;
            return {
              id: a.id || a.documentId,
              documentId: a.id || a.documentId,
              name: accountData.companyName || accountData.name || "Unknown Account",
              companyName: accountData.companyName || accountData.name,
              ...accountData,
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
      
      setClientAccounts(allAccounts);
    } catch (e) {
      console.error("Error fetching client accounts:", e);
      setClientAccounts([]);
    } finally {
      setLoadingClientAccounts(false);
    }
  };

  // Fetch users on mount
  useEffect(() => {
    if (!authLoading) {
      fetchUsers();
      fetchClientAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // Check for account parameter in URL
  useEffect(() => {
    const accountParam = searchParams?.get('account');
    if (accountParam && clientAccounts.length > 0) {
      const accountId = parseInt(accountParam, 10);
      if (!isNaN(accountId)) {
        setProjectData((prev) => ({
          ...prev,
          clientAccount: accountId.toString(),
        }));
      }
    }
  }, [searchParams, clientAccounts]);

  const handleProjectChange = (field, value) => {
    setProjectData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Only validate project name (required field)
    if (!projectData.name.trim()) {
      newErrors.name = "Project name is required";
    }
    
    // Validate date logic only if both dates are provided
    if (
      projectData.startDate &&
      projectData.endDate &&
      new Date(projectData.startDate) > new Date(projectData.endDate)
    ) {
      newErrors.endDate = "End date must be after start date";
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
      // Generate slug from name
      const slug = projectData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Generate icon from first letter of name
      const icon = projectData.name.charAt(0).toUpperCase();

      // Prepare project payload
      const projectPayload = {
        name: projectData.name.trim(),
        slug: slug,
        description: projectData.description?.trim() || "",
        status: projectData.status,
        icon: icon,
        color: "from-blue-400 to-blue-600", // Default color
      };

      // Add optional fields only if they have values
      if (projectData.startDate) {
        projectPayload.startDate = new Date(
          projectData.startDate
        ).toISOString();
      }
      if (projectData.endDate) {
        projectPayload.endDate = new Date(projectData.endDate).toISOString();
      }
      if (projectData.budget) {
        projectPayload.budget = parseFloat(projectData.budget);
      }
      if (projectData.projectManager) {
        projectPayload.projectManager = parseInt(projectData.projectManager);
      }
      if (projectData.clientAccount) {
        projectPayload.clientAccount = parseInt(projectData.clientAccount);
      }


      // Create the project
      const createdProject = await projectService.createProject(projectPayload);


      // Show success message
      setShowSuccess(true);

      // Redirect to the new project detail page after a short delay
      setTimeout(() => {
        if (createdProject.slug) {
          router.push(`/projects/${createdProject.slug}`);
        } else if (createdProject.id) {
          router.push(`/projects/${createdProject.id}`);
        } else {
          router.push("/projects");
        }
      }, 2000);
    } catch (error) {
      console.error("Error creating project:", error);
      setErrors({
        submit:
          error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to create project. Please try again.",
      });
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
          <p className="text-gray-600 mb-4">Project created successfully</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">
            Redirecting to project details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="flex-1 p-4 space-y-6">
        <PageHeader
          title="Add New Project"
          subtitle="Create a new project and assign team members"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Projects", href: "/projects" },
            { label: "Add New", href: "/projects/add" },
          ]}
          showProfile={true}
          showSearch={false}
          showActions={false}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Information */}
          <Card className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Project Information
                </h3>
                <p className="text-sm text-gray-600">
                  Basic information about the project
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Input
                  label="Project Name *"
                  value={projectData.name}
                  onChange={(e) => handleProjectChange("name", e.target.value)}
                  error={errors.name}
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div>
                <Select
                  label="Status"
                  value={projectData.status}
                  onChange={(value) => handleProjectChange("status", value)}
                  options={statusOptions}
                  error={errors.status}
                  placeholder="Select status"
                />
              </div>

              <div className="lg:col-span-3">
                <Textarea
                  label="Project Description"
                  value={projectData.description}
                  onChange={(e) =>
                    handleProjectChange("description", e.target.value)
                  }
                  error={errors.description}
                  placeholder="Describe the project goals and requirements..."
                  rows={4}
                />
              </div>
            </div>
          </Card>

          {/* Project Timeline */}
          <Card className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Project Timeline
                </h3>
                <p className="text-sm text-gray-600">
                  Set the start and end dates for the project
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Start Date"
                  type="date"
                  value={projectData.startDate}
                  onChange={(e) =>
                    handleProjectChange("startDate", e.target.value)
                  }
                  error={errors.startDate}
                />
              </div>
              <div>
                <Input
                  label="End Date"
                  type="date"
                  value={projectData.endDate}
                  onChange={(e) =>
                    handleProjectChange("endDate", e.target.value)
                  }
                  error={errors.endDate}
                />
              </div>
            </div>
          </Card>

          {/* Project Budget & Manager */}
          <Card className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Budget & Assignment
                </h3>
                <p className="text-sm text-gray-600">
                  Set project budget and assign project manager
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Budget"
                  type="number"
                  value={projectData.budget}
                  onChange={(e) =>
                    handleProjectChange("budget", e.target.value)
                  }
                  placeholder="25000"
                  min="0"
                  step="0.01"
                  prefix="Rs"
                />
              </div>
              <div>
                <SearchableSelect
                  label="Project Manager"
                  value={projectData.projectManager}
                  onChange={(value) =>
                    handleProjectChange("projectManager", value)
                  }
                  options={[
                    { value: "", label: "Unassigned" },
                    ...users.map((u) => ({
                      value: u.id.toString(),
                      label:
                        `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                        u.email ||
                        u.name,
                    })),
                  ]}
                  disabled={loadingUsers}
                  placeholder="Select project manager"
                />
              </div>
              <div className="md:col-span-2">
                <SearchableSelect
                  label="Client Account"
                  value={projectData.clientAccount}
                  onChange={(value) =>
                    handleProjectChange("clientAccount", value)
                  }
                  options={[
                    { value: "", label: "No Client Account" },
                    ...clientAccounts.map((ca) => ({
                      value: ca.id.toString(),
                      label: ca.companyName || ca.name || "Unknown Account",
                    })),
                  ]}
                  disabled={loadingClientAccounts}
                  placeholder="Select client account (optional)"
                  icon={Building2}
                />
              </div>
            </div>
          </Card>

          {/* Project Preview */}
          <Card className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
                <p className="text-sm text-gray-600">
                  Preview how your project will appear
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm border border-white/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {projectData.name.charAt(0).toUpperCase() || "P"}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {projectData.name || "Project Name"}
                  </h4>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full border ${
                      projectData.status === "ACTIVE" ||
                      projectData.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : projectData.status === "PLANNING"
                        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                        : projectData.status === "COMPLETED"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : projectData.status === "ON_HOLD"
                        ? "bg-red-100 text-red-700 border-red-200"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    {statusOptions.find((s) => s.value === projectData.status)
                      ?.label || projectData.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mt-3">
                {projectData.description ||
                  "Project description will appear here"}
              </p>
            </div>
          </Card>

          {/* Error Message */}
          {errors.submit && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Button>

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
                  Create Project
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
