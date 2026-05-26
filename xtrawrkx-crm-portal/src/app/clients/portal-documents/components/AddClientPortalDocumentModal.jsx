"use client";

import { X } from "lucide-react";
import { Button } from "../../../../components/ui";
import { createPortal } from "react-dom";

export default function AddClientPortalDocumentModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  clientAccounts = [],
  lockClientAccount = false,
  lockedAccountLabel = "",
  isSubmitting = false,
}) {
  if (typeof window === "undefined" || !isOpen) return null;

  const handleFilesChange = (e) => {
    const picked = Array.from(e.target.files || []);
    setFormData({ ...formData, files: picked });
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Add Document</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Document title..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Client Account <span className="text-red-500">*</span>
              </label>
              {lockClientAccount ? (
                <input
                  type="text"
                  readOnly
                  value={lockedAccountLabel}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                />
              ) : (
                <select
                  value={formData.clientAccount}
                  onChange={(e) =>
                    setFormData({ ...formData, clientAccount: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  required
                >
                  <option value="">Select client account...</option>
                  {clientAccounts.map((account) => (
                    <option
                      key={account.id || account.documentId}
                      value={account.id || account.documentId}
                    >
                      {account.companyName || account.name || "Unknown"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Issue Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, issueDate: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                placeholder="Optional notes..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Documents
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
                onChange={handleFilesChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                PDF, Office, images, or other files
              </p>
              {formData.files?.length > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  {formData.files.length} file(s) selected
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !formData.name?.trim() ||
                  (!lockClientAccount && !formData.clientAccount) ||
                  !formData.issueDate ||
                  isSubmitting
                }
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
              >
                {isSubmitting ? "Saving..." : "Add Document"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
