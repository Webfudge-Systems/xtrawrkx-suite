"use client";
import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import AdminLayout from "../../../../src/components/admin/AdminLayout";
import ProtectedRoute from "../../../../src/components/admin/ProtectedRoute";
import { ContactService } from "../../../../src/services/databaseService";
import Button from "../../../../src/components/common/Button";
import {
  formatDate,
  formatRelativeTime,
} from "../../../../src/utils/dateUtils";
import { toastUtils } from "../../../../src/utils/toast";

const ContactInquiriesPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    in_progress: 0,
    resolved: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  const contactService = new ContactService();

  useEffect(() => {
    loadInquiries();
  }, []);

  useEffect(() => {
    updateStats();
  }, [inquiries]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const data = await contactService.getInquiries();
      setInquiries(data);
    } catch (error) {
      toastUtils.error("Failed to load contact inquiries");
    } finally {
      setLoading(false);
    }
  };

  const updateStats = () => {
    const newStats = {
      total: inquiries.length,
      new: inquiries.filter((i) => i.status === "new").length,
      in_progress: inquiries.filter((i) => i.status === "in_progress").length,
      resolved: inquiries.filter((i) => i.status === "resolved").length,
      high: inquiries.filter((i) => i.priority === "high").length,
      medium: inquiries.filter((i) => i.priority === "medium").length,
      low: inquiries.filter((i) => i.priority === "low").length,
    };
    setStats(newStats);
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === "all" || inquiry.inquiryType === filterType;
    const matchesStatus =
      filterStatus === "all" || inquiry.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || inquiry.priority === filterPriority;

    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  const handleStatusUpdate = async (inquiryId, newStatus) => {
    try {
      const loadingToast = toastUtils.loading("Updating status...");
      await contactService.updateInquiryStatus(inquiryId, newStatus);

      // Update local state
      setInquiries((prev) =>
        prev.map((inquiry) =>
          inquiry.id === inquiryId
            ? { ...inquiry, status: newStatus, statusUpdatedAt: new Date() }
            : inquiry
        )
      );

      // Update selected inquiry if it's the one being updated
      if (selectedInquiry && selectedInquiry.id === inquiryId) {
        setSelectedInquiry((prev) => ({
          ...prev,
          status: newStatus,
          statusUpdatedAt: new Date(),
        }));
      }

      toastUtils.update(loadingToast, "success", "Status updated successfully");
    } catch (error) {
      toastUtils.error("Failed to update status");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "new":
        return "text-blue-600 bg-blue-100";
      case "in_progress":
        return "text-yellow-600 bg-yellow-100";
      case "resolved":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "services":
        return "solar:widget-bold";
      case "community":
        return "solar:users-group-rounded-bold";
      case "events":
        return "solar:calendar-bold";
      case "partnership":
        return "solar:handshake-bold";
      case "support":
        return "solar:question-circle-bold";
      case "feedback":
        return "solar:chat-dots-bold";
      case "media":
        return "solar:camera-bold";
      default:
        return "solar:letter-bold";
    }
  };

  const formatInquiryType = (type) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout title="Contact Inquiries">
          <div className="animate-pulse">
            <div className="mb-8">
              <div className="h-8 bg-gray-200 rounded mb-2 w-64"></div>
              <div className="h-4 bg-gray-200 rounded w-96"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AdminLayout title="Contact Inquiries">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Contact Inquiries
              </h1>
              <p className="text-gray-600">
                Manage and respond to contact form submissions
              </p>
            </div>
          </div>

          {/* Modern Statistics Dashboard */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Inquiries Overview
              </h3>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Inquiries */}
              <div className="bg-gradient-to-br from-brand-primary/5 to-brand-primary/10 border border-brand-primary/20 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-brand-primary/5 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-brand-primary/10 rounded-xl">
                      <Icon
                        icon="solar:letter-bold"
                        width={20}
                        className="text-brand-primary"
                      />
                    </div>
                    <div className="text-xs text-brand-primary font-medium bg-brand-primary/10 px-2 py-1 rounded-full">
                      Total
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {stats.total}
                    </p>
                    <p className="text-sm text-gray-600">Total Inquiries</p>
                  </div>
                </div>
              </div>

              {/* New Inquiries */}
              <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-red-100 rounded-xl">
                      <Icon
                        icon="solar:clock-circle-bold"
                        width={20}
                        className="text-red-600"
                      />
                    </div>
                    <div className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full">
                      New
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-700 mb-1">
                      {stats.new}
                    </p>
                    <p className="text-sm text-red-600">Needs Attention</p>
                  </div>
                </div>
              </div>

              {/* In Progress */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-yellow-100 rounded-xl">
                      <Icon
                        icon="solar:settings-bold"
                        width={20}
                        className="text-yellow-600"
                      />
                    </div>
                    <div className="text-xs text-yellow-600 font-medium bg-yellow-100 px-2 py-1 rounded-full">
                      Processing
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-700 mb-1">
                      {stats.in_progress}
                    </p>
                    <p className="text-sm text-yellow-600">In Progress</p>
                  </div>
                </div>
              </div>

              {/* Resolved */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-green-100 rounded-xl">
                      <Icon
                        icon="solar:check-circle-bold"
                        width={20}
                        className="text-green-600"
                      />
                    </div>
                    <div className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                      Complete
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700 mb-1">
                      {stats.resolved}
                    </p>
                    <p className="text-sm text-green-600">Resolved</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 border border-brand-primary/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Icon
                      icon="solar:chart-bold"
                      width={24}
                      className="text-brand-primary"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Quick Insights
                    </h4>
                    <p className="text-sm text-gray-600">
                      {stats.new > 0
                        ? `${stats.new} new inquiries requiring immediate attention`
                        : stats.total > 0
                        ? `${stats.total} total inquiries managed successfully`
                        : "No contact inquiries received yet"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {stats.total > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-brand-primary">
                        {Math.round((stats.resolved / stats.total) * 100)}%
                      </p>
                      <p className="text-xs text-gray-600">Resolution Rate</p>
                    </div>
                  )}

                  {stats.new > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-600">
                        {stats.new}
                      </p>
                      <p className="text-xs text-gray-600">Pending</p>
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-lg font-bold text-purple-600">
                      {stats.high || 0}
                    </p>
                    <p className="text-xs text-gray-600">High Priority</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Search & Filters
              </h3>
            </div>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Icon
                  icon="solar:magnifer-bold"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  width={20}
                />
                <input
                  type="text"
                  placeholder="Search inquiries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="all">All Types</option>
                <option value="services">Services</option>
                <option value="community">Community</option>
                <option value="events">Events</option>
                <option value="partnership">Partnership</option>
                <option value="support">Support</option>
                <option value="feedback">Feedback</option>
                <option value="media">Media</option>
                <option value="general">General</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Clear Filters */}
              <Button
                text="Clear Filters"
                type="secondary"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                  setFilterStatus("all");
                  setFilterPriority("all");
                }}
                className="whitespace-nowrap"
              />
            </div>
          </div>

          {/* Filtered Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {filteredInquiries.length}
                </span>{" "}
                {filteredInquiries.length === 1 ? "inquiry" : "inquiries"}
                {(() => {
                  const hasActiveFilters =
                    searchTerm ||
                    filterType !== "all" ||
                    filterStatus !== "all" ||
                    filterPriority !== "all";
                  
                  if (hasActiveFilters) {
                    return (
                      <>
                        {" "}
                        (filtered from{" "}
                        <span className="font-semibold text-gray-900">
                          {inquiries.length}
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
                  filterType !== "all" ||
                  filterStatus !== "all" ||
                  filterPriority !== "all";
                
                if (hasActiveFilters) {
                  return (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterType("all");
                        setFilterStatus("all");
                        setFilterPriority("all");
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

          {/* Inquiries List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Contact Inquiries
                </h3>
                <div className="text-sm text-gray-500">
                  Click on any inquiry to view details
                </div>
              </div>
              <div className="space-y-4">
                {filteredInquiries.length > 0 ? (
                  filteredInquiries.map((inquiry) => (
                    <div
                      key={inquiry.id}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-brand-primary/20 transition-all duration-200 cursor-pointer group"
                      onClick={() => setSelectedInquiry(inquiry)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-4 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <Icon
                                icon={getTypeIcon(inquiry.inquiryType)}
                                width={20}
                                className="text-gray-600"
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center space-x-2 mb-2 flex-wrap">
                              <h3 className="text-lg font-medium text-gray-900 break-words">
                                {inquiry.firstName} {inquiry.lastName}
                              </h3>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getPriorityColor(
                                  inquiry.priority
                                )}`}
                              >
                                {inquiry.priority?.toUpperCase()}
                              </span>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(
                                  inquiry.status
                                )}`}
                              >
                                {inquiry.status
                                  ?.replace("_", " ")
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2 space-y-1">
                              <p className="break-words">
                                <strong>Email:</strong> {inquiry.email}
                              </p>
                              {inquiry.company && (
                                <p className="break-words">
                                  <strong>Company:</strong> {inquiry.company}
                                </p>
                              )}
                              <p className="break-words">
                                <strong>Type:</strong>{" "}
                                {formatInquiryType(
                                  inquiry.inquiryType || "general"
                                )}
                              </p>
                            </div>
                            <p className="text-gray-700 line-clamp-2 break-words">
                              {inquiry.message}
                            </p>
                            <div className="mt-2 text-xs text-gray-500">
                              Submitted {formatRelativeTime(inquiry.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0">
                          <select
                            value={inquiry.status || "new"}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(inquiry.id, e.target.value);
                            }}
                            className="text-sm border-gray-300 rounded-md"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                          <a
                            href={`mailto:${inquiry.email}?subject=Re: Your Inquiry&body=Hello ${inquiry.firstName},%0A%0AThank you for contacting XtraWrkx...`}
                            className="text-brand-primary hover:text-brand-secondary flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon icon="solar:letter-bold" width={20} />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Icon
                      icon="solar:letter-bold"
                      width={48}
                      className="mx-auto text-gray-400 mb-4"
                    />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No inquiries found
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm ||
                      filterType !== "all" ||
                      filterStatus !== "all" ||
                      filterPriority !== "all"
                        ? "Try adjusting your filters"
                        : "No contact inquiries have been submitted yet"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Inquiry Detail Modal */}
        {selectedInquiry && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-brand-primary to-brand-secondary px-6 py-4 text-white relative">
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="absolute right-4 top-4 text-white/80 hover:text-white text-2xl"
                >
                  ×
                </button>
                <h2 className="text-2xl font-bold">Contact Inquiry Details</h2>
                <p className="text-blue-100 mt-1">
                  From {selectedInquiry.firstName} {selectedInquiry.lastName}
                </p>
              </div>

              {/* Content */}
              <div className="max-h-[calc(95vh-100px)] overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Name
                        </label>
                        <p className="text-gray-900">
                          {selectedInquiry.firstName} {selectedInquiry.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Email
                        </label>
                        <p className="text-gray-900">{selectedInquiry.email}</p>
                      </div>
                      {selectedInquiry.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Phone
                          </label>
                          <p className="text-gray-900">
                            {selectedInquiry.phone}
                          </p>
                        </div>
                      )}
                      {selectedInquiry.company && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Company
                          </label>
                          <p className="text-gray-900">
                            {selectedInquiry.company}
                          </p>
                        </div>
                      )}
                      {selectedInquiry.jobTitle && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Job Title
                          </label>
                          <p className="text-gray-900">
                            {selectedInquiry.jobTitle}
                          </p>
                        </div>
                      )}
                      {selectedInquiry.website && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Website
                          </label>
                          <p className="text-gray-900">
                            {selectedInquiry.website}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inquiry Details */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Inquiry Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Type
                        </label>
                        <p className="text-gray-900">
                          {formatInquiryType(
                            selectedInquiry.inquiryType || "general"
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Priority
                        </label>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                            selectedInquiry.priority
                          )}`}
                        >
                          {selectedInquiry.priority?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Status
                        </label>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            selectedInquiry.status
                          )}`}
                        >
                          {selectedInquiry.status
                            ?.replace("_", " ")
                            .toUpperCase()}
                        </span>
                      </div>
                      {selectedInquiry.purpose && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Purpose
                          </label>
                          <p className="text-gray-900">
                            {formatInquiryType(selectedInquiry.purpose)}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Preferred Contact
                        </label>
                        <p className="text-gray-900">
                          {selectedInquiry.preferredContact || "Email"}
                        </p>
                      </div>
                      {selectedInquiry.bestTimeToCall && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Best Time to Call
                          </label>
                          <p className="text-gray-900">
                            {selectedInquiry.bestTimeToCall}
                          </p>
                        </div>
                      )}
                      {selectedInquiry.hearAboutUs && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            How they heard about us
                          </label>
                          <p className="text-gray-900">
                            {selectedInquiry.hearAboutUs}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Message
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedInquiry.message}
                  </p>
                </div>

                {/* Metadata */}
                <div className="mt-6 bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Submission Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Submitted
                      </label>
                      <p className="text-gray-900">
                        {formatDate(selectedInquiry.createdAt)} (
                        {formatRelativeTime(selectedInquiry.createdAt)})
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Newsletter Signup
                      </label>
                      <p className="text-gray-900">
                        {selectedInquiry.newsletter ? "Yes" : "No"}
                      </p>
                    </div>
                    {selectedInquiry.statusUpdatedAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Status Updated
                        </label>
                        <p className="text-gray-900">
                          {formatRelativeTime(selectedInquiry.statusUpdatedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-4">
                  <a
                    href={`mailto:${
                      selectedInquiry.email
                    }?subject=Re: Your Inquiry - ${formatInquiryType(
                      selectedInquiry.inquiryType
                    )}&body=Hello ${
                      selectedInquiry.firstName
                    },%0A%0AThank you for contacting XtraWrkx regarding ${formatInquiryType(
                      selectedInquiry.inquiryType
                    ).toLowerCase()}.%0A%0A`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                  >
                    <Icon
                      icon="solar:letter-bold"
                      width={16}
                      className="mr-2"
                    />
                    Reply via Email
                  </a>
                  <select
                    value={selectedInquiry.status || "new"}
                    onChange={(e) =>
                      handleStatusUpdate(selectedInquiry.id, e.target.value)
                    }
                    className="border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default ContactInquiriesPage;
