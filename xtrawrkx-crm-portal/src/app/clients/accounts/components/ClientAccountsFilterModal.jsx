import { useState, useEffect } from "react";
import { Card, Button, Input, Select } from "../../../../components/ui";
import { Filter, X, Building2, TrendingUp, DollarSign, Heart } from "lucide-react";

export default function ClientAccountsFilterModal({
  isOpen,
  onClose,
  appliedFilters,
  onApplyFilters,
}) {
  const [filters, setFilters] = useState({
    status: "",
    industry: "",
    minRevenue: "",
    maxRevenue: "",
    minHealthScore: "",
    maxHealthScore: "",
  });

  // Initialize filters from appliedFilters
  useEffect(() => {
    if (appliedFilters) {
      setFilters({
        status: appliedFilters.status || "",
        industry: appliedFilters.industry || "",
        minRevenue: appliedFilters.minRevenue || "",
        maxRevenue: appliedFilters.maxRevenue || "",
        minHealthScore: appliedFilters.minHealthScore || "",
        maxHealthScore: appliedFilters.maxHealthScore || "",
      });
    }
  }, [appliedFilters, isOpen]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: "",
      industry: "",
      minRevenue: "",
      maxRevenue: "",
      minHealthScore: "",
      maxHealthScore: "",
    };
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
    onClose();
  };

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card
        glass={true}
        className="w-full max-w-2xl bg-white/95 backdrop-blur-xl border border-white/30 shadow-2xl"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                <Filter className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Filter Client Accounts
                </h2>
                <p className="text-sm text-gray-500">
                  Refine your client account search
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Filter Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Status
              </label>
              <Select
                value={filters.status}
                onChange={(value) => handleFilterChange("status", value)}
                options={statusOptions}
                placeholder="Select an option"
                className="w-full"
              />
            </div>

            {/* Industry Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Industry
              </label>
              <Select
                value={filters.industry}
                onChange={(value) => handleFilterChange("industry", value)}
                options={industryOptions}
                placeholder="Select an option"
                className="w-full"
              />
            </div>

            {/* Revenue Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Revenue Range (₹)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min (₹)"
                  value={filters.minRevenue}
                  onChange={(e) => handleFilterChange("minRevenue", e.target.value)}
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Max (₹)"
                  value={filters.maxRevenue}
                  onChange={(e) => handleFilterChange("maxRevenue", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Health Score Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Heart className="w-4 h-4 inline mr-2" />
                Health Score Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min (0-100)"
                  value={filters.minHealthScore}
                  onChange={(e) => handleFilterChange("minHealthScore", e.target.value)}
                  className="w-full"
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Max (0-100)"
                  value={filters.maxHealthScore}
                  onChange={(e) => handleFilterChange("maxHealthScore", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="text-gray-600 hover:text-gray-800"
            >
              Clear All
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
