"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/admin/AdminLayout";
import ProtectedRoute from "@/src/components/admin/ProtectedRoute";
import { Icon } from "@iconify/react";
import TeamMemberCard from "@/src/components/admin/TeamMemberCard";
import { teamService } from "@/src/services/databaseService";
import { CloudinaryService } from "@/src/services/cloudinaryService";
import { team } from "@/src/data/teamData"; // Fallback data
import Button from "@/src/components/common/Button";

export default function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [bulkSelection, setBulkSelection] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("grid");
  const [activeTab, setActiveTab] = useState("members");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);

  const categories = ["All", "core", "employee"];

  const statusOptions = ["All", "active", "inactive"];

  // Load team members
  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const membersData = await teamService.getAllTeamMembers();
      setTeamMembers(membersData);
    } catch (error) {
      // Fallback to static data if Firebase fails
      setTeamMembers(team);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort team members
  const filteredTeamMembers = teamMembers
    .filter((member) => {
      const matchesSearch =
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || member.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "active" && member.isActive) ||
        (selectedStatus === "inactive" && !member.isActive);
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "title":
          aValue = a.title?.toLowerCase() || "";
          bValue = b.title?.toLowerCase() || "";
          break;
        case "category":
          aValue = a.category?.toLowerCase() || "";
          bValue = b.category?.toLowerCase() || "";
          break;
        case "joinDate":
          aValue = new Date(a.joinDate || 0);
          bValue = new Date(b.joinDate || 0);
          break;
        default:
          aValue = a.createdAt || new Date(0);
          bValue = b.createdAt || new Date(0);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleDelete = async (memberId) => {
    if (!confirm("Are you sure you want to delete this team member?")) {
      return;
    }

    try {
      await teamService.deleteTeamMember(memberId);
      loadTeamMembers();
    } catch (error) {
    }
  };

  const handleEdit = (member) => {
    setCurrentMember(member);
    setIsEditModalOpen(true);
  };

  const handleDuplicate = async (member) => {
    try {
      const duplicatedMember = {
        ...member,
        name: `${member.name} (Copy)`,
        id: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await teamService.createTeamMember(duplicatedMember);
      loadTeamMembers();
    } catch (error) {
    }
  };

  const handleBulkSelect = (memberId) => {
    setBulkSelection((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    if (bulkSelection.length === filteredTeamMembers.length) {
      setBulkSelection([]);
    } else {
      setBulkSelection(filteredTeamMembers.map((m) => m.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (bulkSelection.length === 0) return;

    switch (action) {
      case "delete":
        if (confirm(`Delete ${bulkSelection.length} selected members?`)) {
          try {
            await Promise.all(
              bulkSelection.map((id) => teamService.deleteTeamMember(id))
            );
            setBulkSelection([]);
            loadTeamMembers();
          } catch (error) {
          }
        }
        break;
      case "activate":
        try {
          await Promise.all(
            bulkSelection.map((id) => {
              const member = teamMembers.find((m) => m.id === id);
              if (!member?.isActive) {
                return teamService.updateTeamMember(id, { isActive: true });
              }
            })
          );
          setBulkSelection([]);
          loadTeamMembers();
        } catch (error) {
        }
        break;
      case "deactivate":
        try {
          await Promise.all(
            bulkSelection.map((id) => {
              const member = teamMembers.find((m) => m.id === id);
              if (member?.isActive) {
                return teamService.updateTeamMember(id, { isActive: false });
              }
            })
          );
          setBulkSelection([]);
          loadTeamMembers();
        } catch (error) {
        }
        break;
    }
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Team Management
              </h1>
              <p className="text-gray-600">
                Manage your team members and organizational structure
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Button
                text="Add Team Member"
                type="primary"
                link="/admin/team/new"
                icon="mdi:plus"
                className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg"
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("members")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "members"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Team Members
                </button>
              </nav>
            </div>
          </div>

          {activeTab === "members" && (
            <>
              {/* Modern Statistics Dashboard */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Team Overview
                  </h3>
                  <div className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                  {/* Total Members */}
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-4 translate-x-4"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                          <Icon
                            icon="mdi:account-group"
                            width={20}
                            className="text-primary"
                          />
                        </div>
                        <div className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">
                          Total
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 mb-1">
                          {teamMembers.length}
                        </p>
                        <p className="text-sm text-gray-600">Members</p>
                      </div>
                    </div>
                  </div>

                  {/* Core Team */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <Icon
                            icon="mdi:crown"
                            width={20}
                            className="text-blue-600"
                          />
                        </div>
                        <div className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">
                          Core
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-700 mb-1">
                          {
                            teamMembers.filter((m) => m.category === "core")
                              .length
                          }
                        </p>
                        <p className="text-sm text-blue-600">Leadership</p>
                      </div>
                    </div>
                  </div>

                  {/* Employees */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-green-100 rounded-xl">
                          <Icon
                            icon="mdi:account-multiple"
                            width={20}
                            className="text-green-600"
                          />
                        </div>
                        <div className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                          Staff
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-700 mb-1">
                          {
                            teamMembers.filter((m) => m.category === "employee")
                              .length
                          }
                        </p>
                        <p className="text-sm text-green-600">Employees</p>
                      </div>
                    </div>
                  </div>

                  {/* Active Members */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-emerald-100 rounded-xl">
                          <Icon
                            icon="mdi:check-circle"
                            width={20}
                            className="text-emerald-600"
                          />
                        </div>
                        <div className="text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-1 rounded-full">
                          Active
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-emerald-700 mb-1">
                          {teamMembers.filter((m) => m.isActive).length}
                        </p>
                        <p className="text-sm text-emerald-600">Working</p>
                      </div>
                    </div>
                  </div>

                  {/* Inactive Members */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gray-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-gray-100 rounded-xl">
                          <Icon
                            icon="mdi:account-off"
                            width={20}
                            className="text-gray-600"
                          />
                        </div>
                        <div className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded-full">
                          Inactive
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-700 mb-1">
                          {teamMembers.filter((m) => !m.isActive).length}
                        </p>
                        <p className="text-sm text-gray-600">Paused</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Joiners */}
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-purple-100 rounded-xl">
                          <Icon
                            icon="mdi:account-plus"
                            width={20}
                            className="text-purple-600"
                          />
                        </div>
                        <div className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded-full">
                          New
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-700 mb-1">
                          {
                            teamMembers.filter((m) => {
                              const joinDate = new Date(m.joinDate);
                              const thirtyDaysAgo = new Date();
                              thirtyDaysAgo.setDate(
                                thirtyDaysAgo.getDate() - 30
                              );
                              return joinDate > thirtyDaysAgo;
                            }).length
                          }
                        </p>
                        <p className="text-sm text-purple-600">Recent</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                      <Icon
                        icon="mdi:magnify"
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                      />
                      <input
                        type="text"
                        placeholder="Search team members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>

                    {/* Category Filter */}
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>

                    {/* Status Filter */}
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`px-3 py-2 rounded-md transition-all ${
                          viewMode === "grid"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Icon icon="mdi:view-grid" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("table")}
                        className={`px-3 py-2 rounded-md transition-all ${
                          viewMode === "table"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Icon icon="mdi:view-list" className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Sort Options */}
                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split("-");
                        setSortBy(field);
                        setSortOrder(order);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="name-asc">Name A-Z</option>
                      <option value="name-desc">Name Z-A</option>
                      <option value="title-asc">Title A-Z</option>
                      <option value="joinDate-desc">Newest First</option>
                      <option value="joinDate-asc">Oldest First</option>
                    </select>
                  </div>
                </div>

                {/* Filtered Results Count */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600">
                      Showing{" "}
                      <span className="font-semibold text-gray-900">
                        {filteredTeamMembers.length}
                      </span>{" "}
                      {filteredTeamMembers.length === 1 ? "member" : "members"}
                      {(() => {
                        const hasActiveFilters =
                          searchTerm ||
                          selectedCategory !== "All" ||
                          selectedStatus !== "All";
                        
                        if (hasActiveFilters) {
                          return (
                            <>
                              {" "}
                              (filtered from{" "}
                              <span className="font-semibold text-gray-900">
                                {teamMembers.length}
                              </span>{" "}
                              total)
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    {(() => {
                      const hasActiveFilters =
                        searchTerm ||
                        selectedCategory !== "All" ||
                        selectedStatus !== "All";
                      
                      if (hasActiveFilters) {
                        return (
                          <button
                            onClick={() => {
                              setSearchTerm("");
                              setSelectedCategory("All");
                              setSelectedStatus("All");
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                            title="Clear all filters"
                          >
                            <Icon icon="mdi:close-circle" width={16} />
                            Clear filters
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                {/* Bulk Actions */}
                {bulkSelection.length > 0 && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Icon
                          icon="mdi:checkbox-marked-circle"
                          className="w-5 h-5 text-blue-600"
                        />
                        <span className="text-sm font-semibold text-blue-900">
                          {bulkSelection.length} member
                          {bulkSelection.length !== 1 ? "s" : ""} selected
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleBulkAction("activate")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <Icon icon="mdi:check-circle" className="w-4 h-4" />
                          Activate
                        </button>
                        <button
                          onClick={() => handleBulkAction("deactivate")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          <Icon icon="mdi:pause-circle" className="w-4 h-4" />
                          Deactivate
                        </button>
                        <button
                          onClick={() => handleBulkAction("delete")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Icon icon="mdi:delete" className="w-4 h-4" />
                          Delete
                        </button>
                        <button
                          onClick={() => setBulkSelection([])}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 border border-gray-300 transition-colors"
                        >
                          <Icon icon="mdi:close" className="w-4 h-4" />
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {/* Grid View */}
                  {viewMode === "grid" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredTeamMembers.map((member) => (
                        <TeamMemberCard
                          key={member.id}
                          member={member}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onDuplicate={handleDuplicate}
                          onSelect={handleBulkSelect}
                          selected={bulkSelection.includes(member.id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Table View */}
                  {viewMode === "table" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input
                                  type="checkbox"
                                  checked={
                                    filteredTeamMembers.length > 0 &&
                                    bulkSelection.length ===
                                      filteredTeamMembers.length
                                  }
                                  onChange={handleSelectAll}
                                  className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Member
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Join Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTeamMembers.map((member) => (
                              <TeamMemberRow
                                key={member.id}
                                member={member}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onDuplicate={handleDuplicate}
                                onSelect={handleBulkSelect}
                                selected={bulkSelection.includes(member.id)}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {!loading && filteredTeamMembers.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
                  <div className="text-center">
                    <div className="mx-auto h-24 w-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                      <Icon
                        icon="mdi:account-group-outline"
                        className="h-12 w-12 text-gray-400"
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {searchTerm ||
                      selectedCategory !== "All" ||
                      selectedStatus !== "All"
                        ? "No team members match your criteria"
                        : "No team members yet"}
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      {searchTerm ||
                      selectedCategory !== "All" ||
                      selectedStatus !== "All"
                        ? "Try adjusting your search terms or filters to find the team members you're looking for."
                        : "Start building your team by adding your first team member. You can add core team members and employees."}
                    </p>
                    {!searchTerm &&
                      selectedCategory === "All" &&
                      selectedStatus === "All" && (
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button
                            text="Add Team Member"
                            type="primary"
                            link="/admin/team/new"
                            icon="mdi:plus"
                            className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg"
                          />
                        </div>
                      )}
                    {(searchTerm ||
                      selectedCategory !== "All" ||
                      selectedStatus !== "All") && (
                      <Button
                        text="Clear Filters"
                        type="secondary"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedCategory("All");
                          setSelectedStatus("All");
                        }}
                        icon="mdi:filter-remove"
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Edit Modal */}
          {isEditModalOpen && (
            <TeamMemberModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setCurrentMember(null);
              }}
              member={currentMember}
              onSave={loadTeamMembers}
            />
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

// Team Member Row Component for Table View
function TeamMemberRow({
  member,
  onEdit,
  onDelete,
  onDuplicate,
  onSelect,
  selected,
}) {
  return (
    <tr className={selected ? "bg-blue-50" : "hover:bg-gray-50"}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(member.id)}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <img
              className="h-10 w-10 rounded-full object-cover"
              src={member.img || "/images/hero.png"}
              alt={member.name}
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {member.name}
            </div>
            <div className="text-sm text-gray-500">{member.title}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            member.category === "core"
              ? "bg-blue-100 text-blue-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {member.category === "core" ? "Core Team" : "Employee"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            member.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {member.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {member.joinDate || "N/A"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(member)}
            className="text-indigo-600 hover:text-indigo-900"
          >
            <Icon icon="mdi:pencil" className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDuplicate(member)}
            className="text-blue-600 hover:text-blue-900"
          >
            <Icon icon="mdi:content-copy" className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(member.id)}
            className="text-red-600 hover:text-red-900"
          >
            <Icon icon="mdi:delete" className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Team Member Modal Component
function TeamMemberModal({ isOpen, onClose, member, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    location: "",
    email: "",
    linkedin: "",
    bio: "",
    category: "employee",
    img: "/images/hero.png",
    isActive: true,
    joinDate: new Date().toISOString().split("T")[0],
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  const categories = ["core", "employee"];

  const tabs = [
    { id: "details", name: "Team Details" },
    { id: "profile", name: "Profile & Media" },
  ];

  // Load member data for editing
  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || "",
        title: member.title || "",
        location: member.location || "",
        email: member.email || "",
        linkedin: member.linkedin || "",
        bio: member.bio || "",
        category: member.category || "employee",
        img: member.img || "/images/hero.png",
        isActive: member.isActive ?? true,
        joinDate: member.joinDate || new Date().toISOString().split("T")[0],
      });
      setImagePreview(member.img);
      setErrors({});
      setActiveTab("details");
    }
  }, [member]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear errors
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Clear any previous errors
    setErrors((prev) => ({ ...prev, img: "" }));

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, img: "Please select an image file" }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        img: "File size must be less than 5MB",
      }));
      return;
    }

    try {
      setUploading(true);

      // Create immediate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      const uploadOptions = {
        folder: "team_members",
        public_id: `team_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 15)}`,
      };

      const uploadResult = await CloudinaryService.uploadImage(
        file,
        uploadOptions
      );


      // Update form data with Cloudinary URL
      setFormData((prev) => ({
        ...prev,
        img: uploadResult.url,
      }));

      // Update preview with final URL
      setImagePreview(uploadResult.url);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        img: `Failed to upload image: ${error.message}`,
      }));

      // Reset preview on error
      setImagePreview(formData.img || "/images/hero.png");
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      await teamService.updateTeamMember(member.id, formData);

      onSave(); // Refresh the team list
      onClose(); // Close the modal
    } catch (error) {
      setErrors({ submit: `Failed to update team member: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary px-6 py-4 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white text-2xl"
          >
            ×
          </button>
          <h2 className="text-2xl font-bold">Edit Team Member</h2>
          <p className="text-blue-100 mt-1">Update team member information</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon
                  icon={
                    tab.id === "details" ? "mdi:account" : "mdi:account-circle"
                  }
                  className="w-4 h-4"
                />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(95vh-180px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6">
            {/* Error Display */}
            {errors.submit && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:alert-circle" width={20} />
                  {errors.submit}
                </div>
              </div>
            )}

            {/* Team Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                        errors.name
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter full name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-2">{errors.name}</p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                        errors.title
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter job title"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                      placeholder="Enter location"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                        errors.email
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                      placeholder="Enter LinkedIn URL"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                        errors.category
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category === "core" ? "Core Team" : "Employee"}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  {/* Join Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Join Date
                    </label>
                    <input
                      type="date"
                      name="joinDate"
                      value={formData.joinDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                    />
                  </div>

                  {/* Active Status */}
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="isActive"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                      />
                      <label
                        htmlFor="isActive"
                        className="text-sm font-medium text-gray-700"
                      >
                        Active team member
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile & Media Tab */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                {/* Bio */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Biography
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
                    placeholder="Enter a brief biography about the team member..."
                  />
                </div>

                {/* Profile Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Profile Photo
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Current Image Preview */}
                    <div>
                      <div className="w-full max-w-xs mx-auto">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                          <img
                            src={
                              imagePreview || formData.img || "/images/hero.png"
                            }
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Upload Controls */}
                    <div className="space-y-4">
                      <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-primary hover:bg-gray-50 transition-all duration-200 cursor-pointer">
                        <div className="text-center pointer-events-none">
                          <Icon
                            icon="mdi:cloud-upload"
                            className="mx-auto h-12 w-12 text-gray-400 mb-4"
                          />
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              {uploading
                                ? "Uploading..."
                                : "Click to upload or drag and drop"}
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 5MB
                            </p>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>

                      {errors.img && (
                        <p className="text-red-500 text-sm">{errors.img}</p>
                      )}

                      {uploading && (
                        <div className="flex items-center gap-2 text-primary">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="text-sm">Uploading image...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-xl font-semibold hover:from-primary/90 hover:to-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {saving && (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                )}
                {saving ? "Updating..." : "Update Team Member"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
