"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "../../../../components/shared/PageHeader";
import {
  Card,
  Button,
  Input,
  Select,
  Textarea,
} from "../../../../components/ui";
import taskService from "../../../../lib/taskService";
import projectService from "../../../../lib/projectService";
import apiClient from "../../../../lib/apiClient";
import {
  transformTask,
  transformStatusToStrapi,
  transformPriorityToStrapi,
} from "../../../../lib/dataTransformers";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar,
} from "lucide-react";

import {
  PM_STATUS_SELECT_OPTIONS,
  assertStatusChangeAllowed,
  getEditableStatusOptions,
  STATUS_REVERT_TO_ASSIGNED_MESSAGE,
} from "../../../../lib/taskStatusConstants";

const priorityOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

export default function TaskEditPage({ params: paramsProp }) {
  const router = useRouter();
  const paramsFromHook = useParams();
  const [params, setParams] = useState(null);
  const [task, setTask] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Assigned",
    priority: "Medium",
    scheduledDate: "",
    timeAllotted: "",
    assignee: "",
    project: "",
    progress: 0,
  });
  const [formErrors, setFormErrors] = useState({});

  const statusOptions = useMemo(
    () =>
      getEditableStatusOptions(
        formData.status,
        PM_STATUS_SELECT_OPTIONS.map((opt) => ({
          value: opt.label,
          label: opt.label,
        })),
      ),
    [formData.status],
  );

  useEffect(() => {
    const resolveParams = async () => {
      if (paramsProp instanceof Promise) {
        const resolved = await paramsProp;
        setParams(resolved);
      } else if (paramsProp) {
        setParams(paramsProp);
      } else if (paramsFromHook) {
        setParams(paramsFromHook);
      }
    };
    resolveParams();
  }, [paramsProp, paramsFromHook]);

  const taskId = params?.slug ?? params?.id;
  const parsedTaskId = taskId ? parseInt(String(taskId), 10) : NaN;

  useEffect(() => {
    if (!taskId || isNaN(parsedTaskId)) return;

    const loadTask = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await taskService.getTaskById(parsedTaskId, [
          "projects",
          "assignee",
          "createdBy",
          "collaborators",
        ]);
        const transformed = transformTask(data);
        setTask(transformed);

        const scheduledDate = transformed.scheduledDate
          ? new Date(transformed.scheduledDate).toISOString().slice(0, 10)
          : "";

        setFormData({
          title: transformed.name || transformed.title || "",
          description: transformed.description || "",
          status: transformed.status || "Assigned",
          priority: transformed.priority || "Medium",
          scheduledDate,
          timeAllotted:
            transformed.timeAllotted != null
              ? String(transformed.timeAllotted)
              : "",
          assignee: transformed.assignee?.id
            ? String(transformed.assignee.id)
            : "",
          project: transformed.project?.id
            ? String(transformed.project.id)
            : "",
          progress: transformed.progress ?? 0,
        });
      } catch (err) {
        console.error("Error loading task:", err);
        setError(err?.message || "Failed to load task.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [taskId, parsedTaskId]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [projectsRes, usersRes] = await Promise.all([
          projectService
            .getAllProjects({ pageSize: 100 })
            .catch(() => ({ data: [] })),
          apiClient
            .get("/api/xtrawrkx-users", {
              "pagination[pageSize]": 100,
              "filters[isActive][$eq]": "true",
            })
            .catch(() => ({ data: [] })),
        ]);

        setProjects(projectsRes?.data ?? []);

        let usersData = usersRes?.data ?? [];
        if (!Array.isArray(usersData)) usersData = [];
        const list = usersData
          .filter((u) => u && u.id)
          .map((u) => {
            const attrs = u.attributes || u;
            const name =
              [attrs.firstName, attrs.lastName]
                .filter(Boolean)
                .join(" ")
                .trim() ||
              attrs.email ||
              "Unknown";
            return { id: u.id, name, email: attrs.email };
          });
        setUsers(list);
      } catch (err) {
        console.error("Error loading options:", err);
      }
    };

    loadOptions();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const err = {};
    if (!formData.title?.trim()) err.title = "Title is required";
    if (formData.progress < 0 || formData.progress > 100)
      err.progress = "Progress must be 0–100";
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isNaN(parsedTaskId)) return;

    const guard = assertStatusChangeAllowed(task?.status, formData.status);
    if (!guard.ok) {
      alert(guard.message || STATUS_REVERT_TO_ASSIGNED_MESSAGE);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormErrors({});

      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        status: transformStatusToStrapi(formData.status),
        priority: transformPriorityToStrapi(formData.priority),
        scheduledDate: formData.scheduledDate
          ? new Date(formData.scheduledDate + "T00:00:00").toISOString()
          : null,
        timeAllotted: formData.timeAllotted
          ? parseFloat(formData.timeAllotted)
          : null,
        progress: Math.min(100, Math.max(0, Number(formData.progress) || 0)),
      };

      if (formData.assignee) {
        payload.assignee = parseInt(formData.assignee, 10);
      }
      if (formData.project) {
        payload.projects = [parseInt(formData.project, 10)];
      }

      await taskService.updateTask(parsedTaskId, payload);
      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/my-task/${parsedTaskId}`);
      }, 1500);
    } catch (err) {
      console.error("Error updating task:", err);
      setFormErrors({ submit: err?.message || "Failed to update task." });
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
              Loading task details...
            </span>
            <span className="text-gray-400 text-sm">
              Please wait while we fetch the data
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-4 space-y-4 bg-white min-h-screen">
        <PageHeader
          title="Edit Task"
          subtitle="Update task information"
          breadcrumb={[
            { label: "My Tasks", href: "/my-task" },
            { label: "Edit" },
          ]}
          showActions={false}
        />
        <Card className="border-red-200 bg-red-50">
          <div className="p-6 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-8 h-8 flex-shrink-0" />
            <div>
              <p className="font-medium">{error || "Task not found."}</p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => router.push("/my-task")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to My Tasks
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const projectOptions = projects.map((p) => ({
    value: String(p.id),
    label: p.name || `Project ${p.id}`,
  }));
  const assigneeOptions = users.map((u) => ({
    value: String(u.id),
    label: u.name || u.email || "Unknown",
  }));

  return (
    <>
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Task updated successfully!
        </div>
      )}

      <div className="p-4 pb-12 space-y-4 bg-white min-h-screen">
        {/* Page Header - matching lead-companies */}
        <PageHeader
          title="Edit Task"
          subtitle="Update task details and assignment"
          breadcrumb={[
            { label: "My Tasks", href: "/my-task" },
            { label: task.name || "Task", href: `/my-task/${parsedTaskId}` },
            { label: "Edit" },
          ]}
          showActions={false}
        />

        {/* Custom Actions - top right like lead-companies */}
        <div className="flex items-center justify-end gap-3 mb-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/my-task/${parsedTaskId}`)}
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
            {isSubmitting ? "Updating..." : "Update Task"}
          </Button>
        </div>

        {/* Error Message - matching lead-companies card style */}
        {formErrors.submit && (
          <Card className="border-red-200 bg-red-50">
            <div className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700">{formErrors.submit}</span>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Information - matching lead-companies card style */}
          <Card className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-500/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Task Information
                  </h2>
                  <p className="text-sm text-gray-500">Title and description</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Task title"
                    error={formErrors.title}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    placeholder="Task description"
                    rows={4}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Status & Assignment - matching lead-companies card style */}
          <Card className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Status & Assignment
                  </h2>
                  <p className="text-sm text-gray-500">
                    Status, priority, due date, and assignee
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Select
                    label="Status"
                    value={formData.status}
                    onChange={(value) => handleChange("status", value)}
                    options={statusOptions}
                    placeholder="Select status"
                  />
                </div>

                <div>
                  <Select
                    label="Priority"
                    value={formData.priority}
                    onChange={(value) => handleChange("priority", value)}
                    options={priorityOptions}
                    placeholder="Select priority"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      handleChange("scheduledDate", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Allotted (hrs)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.5"
                    placeholder="e.g. 8"
                    value={formData.timeAllotted}
                    onChange={(e) =>
                      handleChange("timeAllotted", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progress (%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.progress}
                    onChange={(e) => handleChange("progress", e.target.value)}
                    error={formErrors.progress}
                  />
                </div>

                <div>
                  <Select
                    label="Project"
                    value={formData.project}
                    onChange={(value) => handleChange("project", value)}
                    options={projectOptions}
                    placeholder="No project"
                  />
                </div>

                <div>
                  <Select
                    label="Assignee"
                    value={formData.assignee}
                    onChange={(value) => handleChange("assignee", value)}
                    options={assigneeOptions}
                    placeholder="Unassigned"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Bottom actions with padding so content isn't flush to bottom */}
          <div className="flex items-center justify-end gap-3 pt-6 pb-2 border-t border-gray-200 mt-2 mb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/my-task")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Tasks
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
              {isSubmitting ? "Updating..." : "Update Task"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
