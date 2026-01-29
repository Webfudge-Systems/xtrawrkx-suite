"use client";

import { useState, useEffect } from "react";
import { X, Filter, Calendar, User, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Card, Button, Input, Select } from "../ui";

export default function SubtasksFilterModal({ 
  isOpen, 
  onClose, 
  onApplyFilters,
  users = [],
  appliedFilters = {}
}) {
  const [filters, setFilters] = useState({
    sortBy: '',
    sortOrder: 'asc',
    assignee: '',
    createdDateFrom: '',
    createdDateTo: '',
    dueDateFrom: '',
    dueDateTo: '',
  });

  // Initialize filters with applied filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilters({
        sortBy: appliedFilters.sortBy || '',
        sortOrder: appliedFilters.sortOrder || 'asc',
        assignee: appliedFilters.assignee || '',
        createdDateFrom: appliedFilters.createdDateFrom || '',
        createdDateTo: appliedFilters.createdDateTo || '',
        dueDateFrom: appliedFilters.dueDateFrom || '',
        dueDateTo: appliedFilters.dueDateTo || '',
      });
    }
  }, [isOpen, appliedFilters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      sortBy: '',
      sortOrder: 'asc',
      assignee: '',
      createdDateFrom: '',
      createdDateTo: '',
      dueDateFrom: '',
      dueDateTo: '',
    };
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
    onClose();
  };

  if (!isOpen) return null;

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
              <div className="w-10 h-10 bg-orange-500/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                <Filter className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Filter & Sort Subtasks
                </h2>
                <p className="text-sm text-gray-500">
                  Sort and filter your subtasks
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
          <div className="space-y-6 mb-6">
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ArrowUpDown className="w-4 h-4 inline mr-2" />
                Sort By
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={filters.sortBy}
                  onChange={(value) => handleFilterChange('sortBy', value)}
                  options={[
                    { value: '', label: 'No Sorting' },
                    { value: 'assignee', label: 'Assignee' },
                    { value: 'createdAt', label: 'Created Date' },
                    { value: 'dueDate', label: 'Deadline (Due Date)' },
                    { value: 'name', label: 'Name' },
                    { value: 'status', label: 'Status' },
                    { value: 'priority', label: 'Priority' },
                  ]}
                  placeholder="Select sort field"
                  className="w-full"
                />
                {filters.sortBy && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFilterChange('sortOrder', 'asc')}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                        filters.sortOrder === 'asc'
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <ArrowUp className="w-4 h-4" />
                        <span className="text-sm font-medium">Ascending</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleFilterChange('sortOrder', 'desc')}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                        filters.sortOrder === 'desc'
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <ArrowDown className="w-4 h-4" />
                        <span className="text-sm font-medium">Descending</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Assignee Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Filter by Assignee
              </label>
              <Select
                value={filters.assignee}
                onChange={(value) => handleFilterChange('assignee', value)}
                options={[
                  { value: '', label: 'All Assignees' },
                  ...users.map((user) => ({
                    value: (user.id || user._id || user.documentId)?.toString(),
                    label:
                      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                      user.username ||
                      user.email ||
                      user.name ||
                      "Unknown User",
                  }))
                ]}
                placeholder="Select assignee"
                className="w-full"
              />
            </div>

            {/* Created Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Created Date Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  placeholder="From"
                  value={filters.createdDateFrom}
                  onChange={(e) => handleFilterChange('createdDateFrom', e.target.value)}
                  className="w-full"
                />
                <Input
                  type="date"
                  placeholder="To"
                  value={filters.createdDateTo}
                  onChange={(e) => handleFilterChange('createdDateTo', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Due Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Deadline (Due Date) Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  placeholder="From"
                  value={filters.dueDateFrom}
                  onChange={(e) => handleFilterChange('dueDateFrom', e.target.value)}
                  className="w-full"
                />
                <Input
                  type="date"
                  placeholder="To"
                  value={filters.dueDateTo}
                  onChange={(e) => handleFilterChange('dueDateTo', e.target.value)}
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
                onClick={handleApplyFilters}
                className="bg-orange-500 hover:bg-orange-600 text-white"
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
