"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Modal, Button, Input, Textarea } from "@webfudge/ui";
import { Select } from "@/components/ui/Select";

const STATUS_OPTIONS = [
  { value: "PLANNING", label: "Planning" },
  { value: "ACTIVE", label: "Active" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ON_HOLD", label: "On Hold" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  status: "PLANNING",
  startDate: "",
  endDate: "",
};

export default function CreateProjectModal({ isOpen, onClose, onProjectCreate }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
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
    try {
      await onProjectCreate({
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      });
      resetForm();
      onClose();
    } catch (error) {
      setErrors({
        submit: error?.message || "Failed to create project. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      subtitle="Add a project for your organization"
      size="lg"
      closeOnBackdrop={!submitting}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.submit && (
          <p className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errors.submit}
          </p>
        )}

        <Input
          label="Project Name"
          required
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="e.g. Website Redesign"
          error={errors.name}
        />

        <Textarea
          label="Description"
          rows={4}
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="What is this project about?"
        />

        <Select
          label="Status"
          value={formData.status}
          onChange={(value) => handleInputChange("status", value)}
          options={STATUS_OPTIONS}
          allowEmpty={false}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange("startDate", e.target.value)}
          />
          <Input
            label="Target End Date"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleInputChange("endDate", e.target.value)}
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
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Creating…" : "Create Project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
