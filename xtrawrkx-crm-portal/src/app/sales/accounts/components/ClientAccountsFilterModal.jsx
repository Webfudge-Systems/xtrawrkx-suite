import { useState } from "react";
import { Modal, Button, Input, Select } from "../../../../components/ui";
import { Filter, X } from "lucide-react";

export default function ClientAccountsFilterModal({
  isOpen,
  onClose,
  appliedFilters,
  onApplyFilters,
}) {
  const [filters, setFilters] = useState(appliedFilters);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
    onApplyFilters({});
    onClose();
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "CHURNED", label: "Churned" },
    { value: "ON_HOLD", label: "On Hold" },
    { value: "REGISTERED", label: "Registered" },
    { value: "COMMUNITY_MEMBER", label: "Community Member" },
    { value: "COMMUNITY_PAID", label: "Community Paid" },
    { value: "COMMUNITY_NON_PAID", label: "Community Non-Paid" },
    { value: "LOST", label: "Lost" },
    { value: "STOPPED", label: "Stopped" },
  ];

  const industryOptions = [
    { value: "", label: "All Industries" },
    { value: "technology", label: "Technology" },
    { value: "healthcare", label: "Healthcare" },
    { value: "finance", label: "Finance" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "retail", label: "Retail" },
    { value: "education", label: "Education" },
    { value: "consulting", label: "Consulting" },
    { value: "other", label: "Other" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filter Client Accounts">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Filter Options
            </h3>
            <p className="text-sm text-gray-600">
              Refine your client account search
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select
              label="Status"
              value={filters.status || ""}
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={statusOptions}
            />
          </div>

          <div>
            <Select
              label="Industry"
              value={filters.industry || ""}
              onChange={(value) => setFilters({ ...filters, industry: value })}
              options={industryOptions}
            />
          </div>

          <div>
            <Input
              label="Min Revenue"
              type="number"
              value={filters.minRevenue || ""}
              onChange={(e) =>
                setFilters({ ...filters, minRevenue: e.target.value })
              }
              placeholder="0"
            />
          </div>

          <div>
            <Input
              label="Max Revenue"
              type="number"
              value={filters.maxRevenue || ""}
              onChange={(e) =>
                setFilters({ ...filters, maxRevenue: e.target.value })
              }
              placeholder="1000000"
            />
          </div>

          <div>
            <Input
              label="Min Health Score"
              type="number"
              min="0"
              max="100"
              value={filters.minHealthScore || ""}
              onChange={(e) =>
                setFilters({ ...filters, minHealthScore: e.target.value })
              }
              placeholder="0"
            />
          </div>

          <div>
            <Input
              label="Max Health Score"
              type="number"
              min="0"
              max="100"
              value={filters.maxHealthScore || ""}
              onChange={(e) =>
                setFilters({ ...filters, maxHealthScore: e.target.value })
              }
              placeholder="100"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={handleReset}>
            Reset Filters
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
