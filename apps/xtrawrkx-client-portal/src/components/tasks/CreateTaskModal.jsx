"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Modal, Button, Input, Textarea, Select } from "@webfudge/ui";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const TASK_STATUS_ASSIGNED = {
  value: "ASSIGNED",
  label: "Assigned",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  project: "",
  dueDate: "",
  timeAllotted: "",
  priority: "medium",
};

export default function CreateTaskModal({
  isOpen,
  onClose,
  onTaskCreate,
  projects = [],
  defaultProjectId = "",
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: String(project.id),
        label: project.name,
      })),
    [projects],
  );

  const hasProjects = projectOptions.length > 0;
  const projectLocked = Boolean(defaultProjectId);

  useEffect(() => {
    if (!isOpen) return;
    const defaultProject =
      defaultProjectId != null && String(defaultProjectId).trim() !== ""
        ? String(defaultProjectId)
        : projectOptions.length === 1
          ? projectOptions[0].value
          : "";
    setFormData({
      ...EMPTY_FORM,
      project: defaultProject,
    });
    setErrors({});
  }, [isOpen, defaultProjectId, projectOptions]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Task title is required";
    if (hasProjects && !formData.project) {
      newErrors.project = "Select a project for this task";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setErrors({});
    try {
      const newTask = {
        id: `t${Date.now()}`,
        title: formData.title.trim(),
        description: formData.description.trim(),
        projectId: formData.project,
        dueDate: formData.dueDate,
        timeAllotted: formData.timeAllotted
          ? parseFloat(formData.timeAllotted)
          : null,
        priority: formData.priority,
        status: TASK_STATUS_ASSIGNED.value,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onTaskCreate(newTask);
      resetForm();
      onClose();
    } catch (error) {
      setErrors({
        submit: error?.message || "Failed to create task. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Task"
      subtitle="Add a new task to your project"
      size="lg"
      closeOnBackdrop={!submitting}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.submit ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.submit}
          </p>
        ) : null}
        <Input
          label="Task Title"
          required
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="Enter task title..."
          error={errors.title}
        />

        <Textarea
          label="Description"
          rows={4}
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Describe the task in detail..."
          error={errors.description}
        />

        {hasProjects ? (
          <Select
            searchable
            menuPortal
            label="Project"
            required
            value={formData.project}
            onChange={(value) => handleInputChange("project", value)}
            options={projectOptions}
            placeholder="Select a project"
            error={errors.project}
            disabled={projectLocked}
            searchPlaceholder="Search projects…"
          />
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-900">No projects available</p>
            <p className="mt-1 text-sm text-amber-800">
              Create a project first, then you can assign tasks to it.
            </p>
            <Link
              href="/projects"
              className="mt-2 inline-block text-sm font-medium text-brand-primary hover:text-orange-700"
              onClick={handleClose}
            >
              Go to Projects
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleInputChange("dueDate", e.target.value)}
          />
          <Input
            label="Time Allotted (hrs)"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 8"
            value={formData.timeAllotted}
            onChange={(e) => handleInputChange("timeAllotted", e.target.value)}
          />
          <Select
            searchable
            menuPortal
            label="Priority"
            value={formData.priority}
            onChange={(value) => handleInputChange("priority", value)}
            options={PRIORITY_OPTIONS}
            allowEmpty={false}
          />
          <Select
            searchable
            menuPortal
            label="Status"
            value={TASK_STATUS_ASSIGNED.value}
            options={[TASK_STATUS_ASSIGNED]}
            allowEmpty={false}
            disabled
            onChange={() => {}}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || (!hasProjects && !projectLocked)}
          >
            {submitting ? "Creating…" : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
