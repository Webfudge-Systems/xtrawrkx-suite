"use client";
import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import AdminLayout from "../../../../src/components/admin/AdminLayout";
import ProtectedRoute from "../../../../src/components/admin/ProtectedRoute";
import { BookingService } from "../../../../src/services/databaseService";
import Button from "../../../../src/components/common/Button";
import {
  formatDate,
  formatRelativeTime,
} from "../../../../src/utils/dateUtils";
import { toastUtils } from "../../../../src/utils/toast";

const ConsultationBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMode, setFilterMode] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    pending_confirmation: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    free_consultation: 0,
    business_consultation: 0,
    technical_consultation: 0,
  });

  const bookingService = new BookingService();

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    updateStats();
  }, [bookings]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getBookings();
      setBookings(data);
    } catch (error) {
      toastUtils.error("Failed to load consultation bookings");
    } finally {
      setLoading(false);
    }
  };

  const updateStats = () => {
    const newStats = {
      total: bookings.length,
      pending_confirmation: bookings.filter(
        (b) => b.status === "pending_confirmation"
      ).length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      free_consultation: bookings.filter(
        (b) => b.consultationType === "free-consultation"
      ).length,
      business_consultation: bookings.filter(
        (b) => b.consultationType === "business-consultation"
      ).length,
      technical_consultation: bookings.filter(
        (b) => b.consultationType === "technical-consultation"
      ).length,
    };
    setStats(newStats);
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.purpose?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === "all" || booking.consultationType === filterType;
    const matchesStatus =
      filterStatus === "all" || booking.status === filterStatus;
    const matchesMode =
      filterMode === "all" || booking.meetingMode === filterMode;

    return matchesSearch && matchesType && matchesStatus && matchesMode;
  });

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const loadingToast = toastUtils.loading("Updating status...");
      await bookingService.updateBookingStatus(bookingId, newStatus);

      // Update local state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: newStatus, statusUpdatedAt: new Date() }
            : booking
        )
      );

      // Update selected booking if it's the one being updated
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking((prev) => ({
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

  const handleConfirmBooking = async (bookingId) => {
    try {
      const loadingToast = toastUtils.loading(
        "Confirming booking and sending email..."
      );

      const response = await fetch("/api/confirm-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: bookingId,
          confirmedBy: "admin", // You can replace with actual admin user info
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update local state to confirmed
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: "confirmed", statusUpdatedAt: new Date() }
              : booking
          )
        );

        // Update selected booking if it's the one being updated
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking((prev) => ({
            ...prev,
            status: "confirmed",
            statusUpdatedAt: new Date(),
          }));
        }

        toastUtils.update(
          loadingToast,
          "success",
          "Booking confirmed and confirmation email sent to customer!"
        );
      } else {
        throw new Error(result.error || "Failed to confirm booking");
      }
    } catch (error) {
      toastUtils.error("Failed to confirm booking and send email");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending_confirmation":
        return "text-yellow-600 bg-yellow-100";
      case "confirmed":
        return "text-green-600 bg-green-100";
      case "completed":
        return "text-blue-600 bg-blue-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "free-consultation":
        return "text-green-600 bg-green-100";
      case "business-consultation":
        return "text-blue-600 bg-blue-100";
      case "technical-consultation":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getMeetingModeIcon = (mode) => {
    switch (mode) {
      case "video":
        return "solar:videocamera-bold";
      case "phone":
        return "solar:phone-bold";
      case "in-person":
        return "solar:buildings-bold";
      default:
        return "solar:chat-dots-bold";
    }
  };

  const formatConsultationType = (type) => {
    const types = {
      "free-consultation": "Free Consultation (30 min)",
      "business-consultation": "Business Consultation (45 min)",
      "technical-consultation": "Technical Consultation (60 min)",
    };
    return types[type] || type;
  };

  const formatStatus = (status) => {
    return status?.replace("_", " ").toUpperCase() || "UNKNOWN";
  };

  const isUpcoming = (date) => {
    return new Date(date) > new Date();
  };

  const isPast = (date) => {
    return new Date(date) < new Date();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout title="Consultation Bookings">
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
      <AdminLayout title="Consultation Bookings">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Consultation Bookings
              </h1>
              <p className="text-gray-600">
                Manage consultation call bookings and appointments
              </p>
            </div>
          </div>

          {/* Modern Statistics Dashboard */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Bookings Overview
              </h3>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Bookings */}
              <div className="bg-gradient-to-br from-brand-primary/5 to-brand-primary/10 border border-brand-primary/20 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-brand-primary/5 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-brand-primary/10 rounded-xl">
                      <Icon
                        icon="solar:calendar-mark-bold"
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
                    <p className="text-sm text-gray-600">Total Bookings</p>
                  </div>
                </div>
              </div>

              {/* Pending Bookings */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-yellow-100 rounded-xl">
                      <Icon
                        icon="solar:clock-circle-bold"
                        width={20}
                        className="text-yellow-600"
                      />
                    </div>
                    <div className="text-xs text-yellow-600 font-medium bg-yellow-100 px-2 py-1 rounded-full">
                      Pending
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-700 mb-1">
                      {stats.pending_confirmation}
                    </p>
                    <p className="text-sm text-yellow-600">
                      Awaiting Confirmation
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirmed Bookings */}
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
                      Confirmed
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700 mb-1">
                      {stats.confirmed}
                    </p>
                    <p className="text-sm text-green-600">Ready to Meet</p>
                  </div>
                </div>
              </div>

              {/* Completed Bookings */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Icon
                        icon="solar:star-bold"
                        width={20}
                        className="text-purple-600"
                      />
                    </div>
                    <div className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded-full">
                      Complete
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-700 mb-1">
                      {stats.completed}
                    </p>
                    <p className="text-sm text-purple-600">
                      Completed Sessions
                    </p>
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
                      {stats.pending_confirmation > 0
                        ? `${stats.pending_confirmation} bookings awaiting confirmation`
                        : stats.total > 0
                        ? `${stats.total} consultation bookings managed successfully`
                        : "No consultation bookings yet"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {stats.total > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-brand-primary">
                        {Math.round((stats.confirmed / stats.total) * 100)}%
                      </p>
                      <p className="text-xs text-gray-600">Confirmation Rate</p>
                    </div>
                  )}

                  {stats.pending_confirmation > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-yellow-600">
                        {stats.pending_confirmation}
                      </p>
                      <p className="text-xs text-gray-600">Pending</p>
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">
                      {stats.free_consultation || 0}
                    </p>
                    <p className="text-xs text-gray-600">Free Consultations</p>
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
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {/* Consultation Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="all">All Types</option>
                <option value="free-consultation">Free Consultation</option>
                <option value="business-consultation">
                  Business Consultation
                </option>
                <option value="technical-consultation">
                  Technical Consultation
                </option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="all">All Status</option>
                <option value="pending_confirmation">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Meeting Mode Filter */}
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="all">All Modes</option>
                <option value="video">Video Call</option>
                <option value="phone">Phone Call</option>
                <option value="in-person">In-Person</option>
              </select>

              {/* Clear Filters */}
              <Button
                text="Clear Filters"
                type="secondary"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                  setFilterStatus("all");
                  setFilterMode("all");
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
                  {filteredBookings.length}
                </span>{" "}
                {filteredBookings.length === 1 ? "booking" : "bookings"}
                {(() => {
                  const hasActiveFilters =
                    searchTerm ||
                    filterType !== "all" ||
                    filterStatus !== "all" ||
                    filterMode !== "all";
                  
                  if (hasActiveFilters) {
                    return (
                      <>
                        {" "}
                        (filtered from{" "}
                        <span className="font-semibold text-gray-900">
                          {bookings.length}
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
                  filterMode !== "all";
                
                if (hasActiveFilters) {
                  return (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterType("all");
                        setFilterStatus("all");
                        setFilterMode("all");
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

          {/* Bookings List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Consultation Bookings
                </h3>
                <div className="text-sm text-gray-500">
                  Click on any booking to view details
                </div>
              </div>
              <div className="space-y-4">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className={`border rounded-xl p-6 hover:shadow-lg hover:border-brand-primary/20 transition-all duration-200 cursor-pointer group ${
                        isUpcoming(booking.preferredDate) &&
                        booking.status === "confirmed"
                          ? "border-green-200 bg-green-50"
                          : isPast(booking.preferredDate) &&
                            booking.status === "confirmed"
                          ? "border-gray-200 bg-gray-50"
                          : "border-gray-200"
                      }`}
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <Icon
                                icon={getMeetingModeIcon(booking.meetingMode)}
                                width={24}
                                className="text-gray-600"
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {booking.firstName} {booking.lastName}
                              </h3>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                                  booking.consultationType
                                )}`}
                              >
                                {booking.consultationType
                                  ?.replace("-", " ")
                                  .toUpperCase()}
                              </span>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  booking.status
                                )}`}
                              >
                                {formatStatus(booking.status)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <p>
                                <strong>Email:</strong> {booking.email}
                              </p>
                              {booking.company && (
                                <p>
                                  <strong>Company:</strong> {booking.company}
                                </p>
                              )}
                              <p>
                                <strong>Type:</strong>{" "}
                                {formatConsultationType(
                                  booking.consultationType
                                )}
                              </p>
                              <p>
                                <strong>Date:</strong>{" "}
                                {formatDate(booking.preferredDate)} at{" "}
                                {booking.preferredTime} {booking.timezone}
                              </p>
                              <p>
                                <strong>Mode:</strong>{" "}
                                {booking.meetingMode === "video"
                                  ? "📹 Video Call"
                                  : booking.meetingMode === "phone"
                                  ? "📞 Phone Call"
                                  : "🏢 In-Person"}
                              </p>
                            </div>
                            {booking.purpose && (
                              <p className="text-gray-700 truncate">
                                <strong>Purpose:</strong> {booking.purpose}
                              </p>
                            )}
                            <div className="mt-2 text-xs text-gray-500">
                              Booked {formatRelativeTime(booking.createdAt)}
                              {isUpcoming(booking.preferredDate) &&
                                booking.status === "confirmed" && (
                                  <span className="ml-2 text-green-600 font-medium">
                                    • Upcoming
                                  </span>
                                )}
                              {isPast(booking.preferredDate) &&
                                booking.status === "confirmed" && (
                                  <span className="ml-2 text-gray-600">
                                    • Past
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {booking.status === "pending_confirmation" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmBooking(booking.id);
                              }}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                              title="Confirm booking and send email to customer"
                            >
                              ✓ Confirm & Email
                            </button>
                          )}
                          <select
                            value={booking.status || "pending_confirmation"}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(booking.id, e.target.value);
                            }}
                            className="text-sm border-gray-300 rounded-md"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="pending_confirmation">
                              Pending
                            </option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <a
                            href={`mailto:${booking.email}?subject=Consultation Booking Confirmation&body=Hello ${booking.firstName},%0A%0AThank you for booking a consultation with XtraWrkx...`}
                            className="text-brand-primary hover:text-brand-secondary"
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
                      icon="solar:calendar-mark-bold"
                      width={48}
                      className="mx-auto text-gray-400 mb-4"
                    />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No bookings found
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm ||
                      filterType !== "all" ||
                      filterStatus !== "all" ||
                      filterMode !== "all"
                        ? "Try adjusting your filters"
                        : "No consultation bookings have been made yet"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Detail Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4 text-white relative">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="absolute right-4 top-4 text-white/80 hover:text-white text-2xl"
                >
                  ×
                </button>
                <h2 className="text-2xl font-bold">
                  Consultation Booking Details
                </h2>
                <p className="text-green-100 mt-1">
                  {formatConsultationType(selectedBooking.consultationType)} -{" "}
                  {selectedBooking.firstName} {selectedBooking.lastName}
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
                          {selectedBooking.firstName} {selectedBooking.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Email
                        </label>
                        <p className="text-gray-900">{selectedBooking.email}</p>
                      </div>
                      {selectedBooking.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Phone
                          </label>
                          <p className="text-gray-900">
                            {selectedBooking.phone}
                          </p>
                        </div>
                      )}
                      {selectedBooking.company && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Company
                          </label>
                          <p className="text-gray-900">
                            {selectedBooking.company}
                          </p>
                        </div>
                      )}
                      {selectedBooking.jobTitle && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Job Title
                          </label>
                          <p className="text-gray-900">
                            {selectedBooking.jobTitle}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meeting Details */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      📅 Meeting Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Consultation Type
                        </label>
                        <p className="text-gray-900">
                          {formatConsultationType(
                            selectedBooking.consultationType
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Status
                        </label>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            selectedBooking.status
                          )}`}
                        >
                          {formatStatus(selectedBooking.status)}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Preferred Date & Time
                        </label>
                        <p className="text-gray-900">
                          {formatDate(selectedBooking.preferredDate)} at{" "}
                          {selectedBooking.preferredTime}{" "}
                          {selectedBooking.timezone}
                        </p>
                        {isUpcoming(selectedBooking.preferredDate) &&
                          selectedBooking.status === "confirmed" && (
                            <p className="text-green-600 text-sm font-medium">
                              Upcoming meeting
                            </p>
                          )}
                      </div>
                      {selectedBooking.alternativeDate && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Alternative Date & Time
                          </label>
                          <p className="text-gray-900">
                            {formatDate(selectedBooking.alternativeDate)} at{" "}
                            {selectedBooking.alternativeTime}{" "}
                            {selectedBooking.timezone}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Meeting Mode
                        </label>
                        <p className="text-gray-900">
                          {selectedBooking.meetingMode === "video"
                            ? "📹 Video Call"
                            : selectedBooking.meetingMode === "phone"
                            ? "📞 Phone Call"
                            : "🏢 In-Person"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Participants
                        </label>
                        <p className="text-gray-900">
                          {selectedBooking.participants}{" "}
                          {selectedBooking.participants > 1
                            ? "people"
                            : "person"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purpose */}
                {selectedBooking.purpose && (
                  <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Discussion Purpose
                    </h3>
                    <p className="text-gray-700">{selectedBooking.purpose}</p>
                  </div>
                )}

                {/* Agenda */}
                {selectedBooking.agenda && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Meeting Agenda
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedBooking.agenda}
                    </p>
                  </div>
                )}

                {/* Special Requests */}
                {selectedBooking.specialRequests && (
                  <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Special Requests
                    </h3>
                    <p className="text-gray-700">
                      {selectedBooking.specialRequests}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="mt-6 bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Booking Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Booked
                      </label>
                      <p className="text-gray-900">
                        {formatDate(selectedBooking.createdAt)} (
                        {formatRelativeTime(selectedBooking.createdAt)})
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Newsletter Signup
                      </label>
                      <p className="text-gray-900">
                        {selectedBooking.newsletter ? "Yes" : "No"}
                      </p>
                    </div>
                    {selectedBooking.statusUpdatedAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Status Updated
                        </label>
                        <p className="text-gray-900">
                          {formatRelativeTime(selectedBooking.statusUpdatedAt)}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Source
                      </label>
                      <p className="text-gray-900">Book Meet Modal</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-4">
                  {selectedBooking.status === "pending_confirmation" && (
                    <button
                      onClick={() => handleConfirmBooking(selectedBooking.id)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Icon
                        icon="solar:check-circle-bold"
                        width={16}
                        className="mr-2"
                      />
                      Confirm Booking & Send Email
                    </button>
                  )}

                  <a
                    href={`mailto:${
                      selectedBooking.email
                    }?subject=Consultation Booking Confirmation - ${formatConsultationType(
                      selectedBooking.consultationType
                    )}&body=Hello ${
                      selectedBooking.firstName
                    },%0A%0AThank you for booking a ${formatConsultationType(
                      selectedBooking.consultationType
                    ).toLowerCase()} with XtraWrkx.%0A%0AWe have received your booking for ${formatDate(
                      selectedBooking.preferredDate
                    )} at ${selectedBooking.preferredTime} ${
                      selectedBooking.timezone
                    }.%0A%0A`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                  >
                    <Icon
                      icon="solar:letter-bold"
                      width={16}
                      className="mr-2"
                    />
                    Send Custom Email
                  </a>

                  {selectedBooking.status === "confirmed" &&
                    isUpcoming(selectedBooking.preferredDate) && (
                      <a
                        href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${formatConsultationType(
                          selectedBooking.consultationType
                        )}&dates=${
                          new Date(selectedBooking.preferredDate)
                            .toISOString()
                            .replace(/[-:]/g, "")
                            .split(".")[0]
                        }Z/${
                          new Date(
                            new Date(selectedBooking.preferredDate).getTime() +
                              60 * 60 * 1000
                          )
                            .toISOString()
                            .replace(/[-:]/g, "")
                            .split(".")[0]
                        }Z&details=Consultation%20with%20${
                          selectedBooking.firstName
                        }%20${selectedBooking.lastName}&location=${
                          selectedBooking.meetingMode === "video"
                            ? "Video Call"
                            : selectedBooking.meetingMode === "phone"
                            ? "Phone Call"
                            : "In-Person"
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                      >
                        <Icon
                          icon="solar:calendar-add-bold"
                          width={16}
                          className="mr-2"
                        />
                        Add to Calendar
                      </a>
                    )}

                  <select
                    value={selectedBooking.status || "pending_confirmation"}
                    onChange={(e) =>
                      handleStatusUpdate(selectedBooking.id, e.target.value)
                    }
                    className="border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="pending_confirmation">
                      Pending Confirmation
                    </option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
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

export default ConsultationBookingsPage;
