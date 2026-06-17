"use client";

import { useState } from "react";
import { Modal, Button, Input, Textarea, Select } from "@webfudge/ui";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  dueDate: "",
  priority: "medium",
};

export default function CreateSubtaskModal({
  isOpen,
  onClose,
  onSubmit,
  parentTask,
  saving = false,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
  };

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrors({ title: "Subtask title is required" });
      return;
    }
    setErrors({});
    try {
      await onSubmit({
        name: formData.title.trim(),
        description: formData.description.trim() || null,
        scheduledDate: formData.dueDate
          ? new Date(`${formData.dueDate}T00:00:00`).toISOString()
          : null,
        priority: formData.priority,
      });
      resetForm();
      onClose();
    } catch (error) {
      setErrors({ submit: error?.message || "Failed to create subtask." });
    }
  };

  const parentLabel = parentTask?.name || "this task";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add subtask"
      subtitle={`Break "${parentLabel}" into a smaller item`}
      size="lg"
      closeOnBackdrop={!saving}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.submit ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.submit}
          </p>
        ) : null}

        <Input
          label="Subtask title"
          required
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="Enter subtask title..."
          error={errors.title}
        />

        <Textarea
          label="Description"
          rows={3}
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Optional details..."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Due date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleInputChange("dueDate", e.target.value)}
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
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Adding…" : "Add subtask"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
