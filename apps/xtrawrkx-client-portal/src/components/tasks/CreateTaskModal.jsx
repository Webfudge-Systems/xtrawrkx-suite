"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Input, Select, Textarea } from "@webfudge/ui";
import {
  CP_STATUS_SELECT_OPTIONS,
  getEditableStatusOptions,
} from "@/lib/taskStatusConstants";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  project: "",
  dueDate: "",
  timeAllotted: "",
  priority: "medium",
  status: "ACCEPTED",
  autoAccept: true,
  assignmentScope: "internal",
  assigneeMemberId: "",
};

export default function CreateTaskModal({
  isOpen,
  onClose,
  onTaskCreate,
  projects = [],
  clientMembers = [],
  defaultProjectId = "",
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormData((prev) => ({
      ...EMPTY_FORM,
      project: defaultProjectId ? String(defaultProjectId) : prev.project || "",
    }));
    setErrors({});
  }, [isOpen, defaultProjectId]);

  const statuses = getEditableStatusOptions(
    formData.autoAccept ? "Accepted" : formData.status,
    CP_STATUS_SELECT_OPTIONS,
  );

  const projectOptions = projects.map((project) => ({
    value: String(project.id),
    label: project.name,
  }));

  const memberOptions = clientMembers.map((member) => ({
    value: String(member.id),
    label: `${member.name} (${member.role})`,
  }));

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Task title is required";
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
        status: formData.autoAccept ? "ACCEPTED" : formData.status,
        autoAccept: !!formData.autoAccept,
        assignmentScope: formData.assignmentScope,
        assigneeMemberId: formData.assigneeMemberId || null,
        sharePreferenceSetAtCreation: true,
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

        <Select
          label="Project"
          value={formData.project}
          onChange={(e) => handleInputChange("project", e.target.value)}
          options={projectOptions}
          placeholder="Select a project"
          error={errors.project}
        />

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
            label="Priority"
            value={formData.priority}
            onChange={(e) => handleInputChange("priority", e.target.value)}
            options={PRIORITY_OPTIONS}
            allowEmpty={false}
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => handleInputChange("status", e.target.value)}
            options={statuses}
            allowEmpty={false}
            disabled={formData.autoAccept}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="mb-2 text-sm font-medium text-gray-800">
            Auto-accept for assignee
          </p>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="autoAccept"
                checked={formData.autoAccept === true}
                onChange={() => {
                  handleInputChange("autoAccept", true);
                  handleInputChange("status", "ACCEPTED");
                }}
                className="text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-gray-700">
                Auto-accept (default)
              </span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="autoAccept"
                checked={formData.autoAccept === false}
                onChange={() => {
                  handleInputChange("autoAccept", false);
                  handleInputChange("status", "ASSIGNED");
                }}
                className="text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-gray-700">
                Require manual accept
              </span>
            </label>
          </div>
        </div>

        <Select
          label="Assign To"
          value={formData.assignmentScope}
          onChange={(e) => handleInputChange("assignmentScope", e.target.value)}
          options={[
            { value: "internal", label: "Internal Team" },
            { value: "client", label: "Client Members" },
          ]}
          allowEmpty={false}
        />

        {formData.assignmentScope === "client" && (
          <Select
            label="Client Member"
            value={formData.assigneeMemberId}
            onChange={(e) =>
              handleInputChange("assigneeMemberId", e.target.value)
            }
            options={memberOptions}
            placeholder="Unassigned"
          />
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Creating…" : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
