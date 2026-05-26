"use client";
import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import AdminLayout from "../../../../src/components/admin/AdminLayout";
import ProtectedRoute from "../../../../src/components/admin/ProtectedRoute";
import {
  eventService,
  eventRegistrationService,
} from "../../../../src/services/databaseService";
import Button from "../../../../src/components/common/Button";
import {
  formatDate,
  formatRelativeTime,
} from "../../../../src/utils/dateUtils";

// Excel export utility
const exportToExcel = (data, filename) => {
  const headers = [
    "Registration ID",
    "Registration Type",
    "Season",
    "Company Name",
    "Company Email",
    "Company Phone",
    "Company Address",
    "Company Type",
    "Company Size",
    "Industry",
    "Community",
    "XEN Level",
    "Client Status",
    "Ticket Type",
    "Primary Contact Name",
    "Primary Contact Email",
    "Primary Contact Phone",
    "Primary Contact Designation",
    "Total Attendees",
    "Personnel Names",
    "Personnel Emails",
    "Personnel Phones",
    "Personnel Designations",
    "Event Title",
    "Event Date",
    "Event Location",
    "Total Cost",
    "Base Amount",
    "Discount Amount",
    "Registration Status",
    "Special Requests",
    "Emergency Contact",
    "Emergency Phone",
    "Registration Date",
    "Is Free Registration",
  ];

  const csvContent = [
    headers.join(","),
    ...data.map((registration) => {
      const personnel = registration.personnel || [];

      return [
        registration.id || "",
        registration.registrationType || "",
        registration.season || "",
        `"${(registration.companyName || "").replace(/"/g, '""')}"`,
        registration.companyEmail || "",
        registration.companyPhone || "",
        `"${(registration.companyAddress || "").replace(/"/g, '""')}"`,
        registration.companyType || "",
        registration.companySize || "",
        registration.industry || "",
        registration.companyCommunity || "",
        registration.xenLevel || "",
        registration.clientStatus || "",
        registration.ticketType || "",
        `"${(registration.primaryContactName || "").replace(/"/g, '""')}"`,
        registration.primaryContactEmail || "",
        registration.primaryContactPhone || "",
        registration.primaryContactDesignation || "",
        personnel.filter((p) => p.isAttending).length || 1,
        `"${personnel
          .filter((p) => p.isAttending)
          .map((p) => p.name)
          .join("; ")
          .replace(/"/g, '""')}"`,
        `"${personnel
          .filter((p) => p.isAttending)
          .map((p) => p.email)
          .join("; ")
          .replace(/"/g, '""')}"`,
        `"${personnel
          .filter((p) => p.isAttending)
          .map((p) => p.phone || "")
          .join("; ")
          .replace(/"/g, '""')}"`,
        `"${personnel
          .filter((p) => p.isAttending)
          .map((p) => p.designation || "")
          .join("; ")
          .replace(/"/g, '""')}"`,
        `"${(registration.eventTitle || "").replace(/"/g, '""')}"`,
        registration.eventDate || "",
        `"${(registration.eventLocation || "").replace(/"/g, '""')}"`,
        registration.totalCost || 0,
        registration.baseAmount || 0,
        registration.discountAmount || 0,
        registration.status || "",
        `"${(registration.specialRequests || "").replace(/"/g, '""')}"`,
        registration.emergencyContact || "",
        registration.emergencyPhone || "",
        registration.registrationDate || registration.createdAt || "",
        registration.isFree ? "Yes" : "No",
      ].join(",");
    }),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default function RegistrationManagement() {
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterCompanyType, setFilterCompanyType] = useState("All");
  const [filterEvent, setFilterEvent] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("registrationDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [bulkSelection, setBulkSelection] = useState([]);
  const [showRegistrationDetails, setShowRegistrationDetails] = useState(null);
  const [editRegistration, setEditRegistration] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    loadRegistrations();
    loadEvents();
  }, []);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const registrationsData =
        await eventRegistrationService.getRegistrations();
      setRegistrations(registrationsData);
    } catch (error) {
      console.error("Error loading registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const eventsData = await eventService.getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  const handleEditRegistration = (registration) => {
    setEditRegistration(registration);
  };

  const handleSaveRegistration = async (updatedData) => {
    try {
      await eventRegistrationService.updateRegistration(
        editRegistration.id,
        updatedData
      );
      setEditRegistration(null);
      loadRegistrations();
      alert("Registration updated successfully!");
    } catch (error) {
      console.error("Error updating registration:", error);
      alert("Error updating registration: " + error.message);
    }
  };

  const handleStatusUpdate = async (registrationId, newStatus) => {
    try {
      await eventRegistrationService.updateRegistrationStatus(
        registrationId,
        newStatus
      );
      loadRegistrations();
    } catch (error) {
      console.error("Error updating registration status:", error);
      alert("Error updating registration status");
    }
  };

  const handleDeleteRegistration = async (registrationId) => {
    if (confirm("Are you sure you want to delete this registration?")) {
      try {
        await eventRegistrationService.delete(registrationId);
        loadRegistrations();
      } catch (error) {
        console.error("Error deleting registration:", error);
        alert("Error deleting registration");
      }
    }
  };

  const handleExportToExcel = () => {
    if (filteredRegistrations.length === 0) {
      alert("No registrations to export");
      return;
    }

    const filename = `registrations_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    exportToExcel(filteredRegistrations, filename);

    // Optional: Show success message
    console.log(
      `Exported ${filteredRegistrations.length} registrations to ${filename}`
    );
  };

  // Filter and sort registrations
  const filteredRegistrations = registrations
    .filter((registration) => {
      const matchesType =
        filterType === "All" ||
        (filterType === "event" &&
          registration.registrationType !== "season") ||
        (filterType === "season" && registration.registrationType === "season");

      const matchesSearch =
        registration.companyName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        registration.primaryContactName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        registration.primaryContactEmail
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        registration.eventTitle
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        registration.season?.toString().includes(searchTerm);

      const matchesStatus =
        filterStatus === "All" || registration.status === filterStatus;

      const matchesCompanyType =
        filterCompanyType === "All" ||
        registration.companyCommunity === filterCompanyType;

      // Event filter - matches registrations where the registrant will attend the selected event
      let matchesEvent = true;
      if (filterEvent !== "All") {
        // Find the selected event from the events list
        const selectedEvent = events.find((e) => e.id === filterEvent);

        // Check if filterEvent is a season label (e.g., "Season XSOS2026")
        const isSeasonFilter = filterEvent.startsWith("Season ");

        if (isSeasonFilter) {
          // Filter by season - show all registrations for this season
          const seasonLabel = `Season ${registration.season}`;
          matchesEvent = seasonLabel === filterEvent;
        } else if (selectedEvent) {
          // Filter by specific event - show registrations where registrant will attend this event
          if (registration.registrationType === "season") {
            // For season registrations, check if this event is in selectedEventDetails
            matchesEvent =
              registration.selectedEventDetails &&
              Array.isArray(registration.selectedEventDetails) &&
              registration.selectedEventDetails.some(
                (e) =>
                  e.id === selectedEvent.id ||
                  e.slug === selectedEvent.slug ||
                  String(e.id) === String(selectedEvent.id) ||
                  String(e.slug) === String(selectedEvent.slug) ||
                  (e.title &&
                    selectedEvent.title &&
                    e.title.toLowerCase().trim() ===
                      selectedEvent.title.toLowerCase().trim())
              );
          } else {
            // For single event registrations, match by eventId, eventTitle, or event slug
            const eventIdMatch =
              registration.eventId === selectedEvent.id ||
              registration.eventId === selectedEvent.slug ||
              String(registration.eventId) === String(selectedEvent.id) ||
              String(registration.eventId) === String(selectedEvent.slug);

            const eventTitleMatch =
              registration.eventTitle &&
              selectedEvent.title &&
              registration.eventTitle.toLowerCase().trim() ===
                selectedEvent.title.toLowerCase().trim();

            const eventSlugMatch =
              registration.eventSlug === selectedEvent.slug ||
              registration.eventSlug === selectedEvent.id ||
              String(registration.eventSlug) === String(selectedEvent.slug) ||
              String(registration.eventSlug) === String(selectedEvent.id);

            matchesEvent = eventIdMatch || eventTitleMatch || eventSlugMatch;
          }
        } else {
          // Fallback: direct matching if event not found in list
          matchesEvent =
            registration.eventId === filterEvent ||
            registration.eventTitle === filterEvent ||
            registration.eventSlug === filterEvent ||
            String(registration.eventId) === String(filterEvent) ||
            String(registration.eventSlug) === String(filterEvent);
        }
      }

      // Date range filter
      const registrationDate = new Date(
        registration.registrationDate || registration.createdAt
      );
      let matchesDateRange = true;

      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (registrationDate < fromDate) {
          matchesDateRange = false;
        }
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (registrationDate > toDate) {
          matchesDateRange = false;
        }
      }

      return (
        matchesType &&
        matchesSearch &&
        matchesStatus &&
        matchesCompanyType &&
        matchesEvent &&
        matchesDateRange
      );
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "registrationDate" || sortBy === "createdAt") {
        // Fallback to createdAt if registrationDate doesn't exist
        if (sortBy === "registrationDate") {
          aValue = aValue || a.createdAt || a.registrationDate;
          bValue = bValue || b.createdAt || b.registrationDate;
        }
        
        // Convert to Date objects, handling null/undefined
        const aDate = aValue ? new Date(aValue) : null;
        const bDate = bValue ? new Date(bValue) : null;
        
        // Check for invalid dates and convert to timestamps for comparison
        if (!aDate || isNaN(aDate.getTime())) {
          aValue = 0; // Put invalid dates at the end
        } else {
          aValue = aDate.getTime();
        }
        
        if (!bDate || isNaN(bDate.getTime())) {
          bValue = 0; // Put invalid dates at the end
        } else {
          bValue = bDate.getTime();
        }
      } else {
        // Handle null/undefined values for non-date fields
        if (aValue == null) aValue = "";
        if (bValue == null) bValue = "";
        
        // Convert to strings for comparison if not already
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      // Compare values
      if (sortOrder === "asc") {
        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;
        return 0;
      } else {
        if (aValue > bValue) return -1;
        if (aValue < bValue) return 1;
        return 0;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRegistrations = filteredRegistrations.slice(
    startIndex,
    endIndex
  );

  // Statistics
  const stats = {
    total: filteredRegistrations.length,
    confirmed: filteredRegistrations.filter((r) => r.status === "confirmed")
      .length,
    pending: filteredRegistrations.filter((r) => r.status === "pending").length,
    cancelled: filteredRegistrations.filter((r) => r.status === "cancelled")
      .length,
    totalRevenue: filteredRegistrations.reduce(
      (sum, r) => sum + (r.totalCost || 0),
      0
    ),
    totalAttendees: filteredRegistrations.reduce(
      (sum, r) =>
        sum +
        (r.personnel ? r.personnel.filter((p) => p.isAttending).length : 1),
      0
    ),
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout title="Registration Management">
          <div className="animate-pulse space-y-8">
            <div className="bg-gray-200 rounded-xl h-32"></div>
            <div className="bg-gray-200 rounded-xl h-96"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Registration Management
              </h1>
              <p className="text-gray-600">
                Manage and edit event registrations from your CMS dashboard
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Button
                text="Export Data"
                type="primary"
                icon="mdi:download"
                className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg"
                onClick={handleExportToExcel}
              />
            </div>
          </div>

          {/* Modern Statistics Dashboard */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Registration Overview
              </h3>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              {/* Total Registrations */}
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
                      {stats.total}
                    </p>
                    <p className="text-sm text-gray-600">Registrations</p>
                  </div>
                </div>
              </div>

              {/* Confirmed Registrations */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-green-100 rounded-xl">
                      <Icon
                        icon="mdi:check-circle"
                        width={20}
                        className="text-green-600"
                      />
                    </div>
                    <div className="text-xs text-green-700 font-medium bg-green-100 px-2 py-1 rounded-full">
                      Confirmed
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {stats.confirmed}
                    </p>
                    <p className="text-sm text-gray-600">
                      {stats.total > 0
                        ? Math.round((stats.confirmed / stats.total) * 100)
                        : 0}
                      % of total
                    </p>
                  </div>
                </div>
              </div>

              {/* Pending Registrations */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-100 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-yellow-100 rounded-xl">
                      <Icon
                        icon="mdi:clock"
                        width={20}
                        className="text-yellow-600"
                      />
                    </div>
                    <div className="text-xs text-yellow-700 font-medium bg-yellow-100 px-2 py-1 rounded-full">
                      Pending
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {stats.pending}
                    </p>
                    <p className="text-sm text-gray-600">Needs approval</p>
                  </div>
                </div>
              </div>

              {/* Cancelled Registrations */}
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-100 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-red-100 rounded-xl">
                      <Icon
                        icon="mdi:close-circle"
                        width={20}
                        className="text-red-600"
                      />
                    </div>
                    <div className="text-xs text-red-700 font-medium bg-red-100 px-2 py-1 rounded-full">
                      Cancelled
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {stats.cancelled}
                    </p>
                    <p className="text-sm text-gray-600">
                      {stats.total > 0
                        ? Math.round((stats.cancelled / stats.total) * 100)
                        : 0}
                      % dropout
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <Icon
                        icon="mdi:currency-usd"
                        width={20}
                        className="text-emerald-600"
                      />
                    </div>
                    <div className="text-xs text-emerald-700 font-medium bg-emerald-100 px-2 py-1 rounded-full">
                      Revenue
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      ₹{stats.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Avg: ₹
                      {stats.total > 0
                        ? Math.round(
                            stats.totalRevenue / stats.total
                          ).toLocaleString()
                        : 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Attendees */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Icon
                        icon="mdi:account-multiple"
                        width={20}
                        className="text-purple-600"
                      />
                    </div>
                    <div className="text-xs text-purple-700 font-medium bg-purple-100 px-2 py-1 rounded-full">
                      Attendees
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {stats.totalAttendees}
                    </p>
                    <p className="text-sm text-gray-600">Total people</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Insights */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Registration Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                  <Icon
                    icon="mdi:calendar-multiple"
                    width={18}
                    className="mr-2 text-primary"
                  />
                  Registration Types
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">
                      Single Events:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {
                        filteredRegistrations.filter(
                          (r) => r.registrationType !== "season"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">
                      Season Registrations:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {
                        filteredRegistrations.filter(
                          (r) => r.registrationType === "season"
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                  <Icon
                    icon="mdi:account-group"
                    width={18}
                    className="mr-2 text-primary"
                  />
                  Community Breakdown
                </h4>
                <div className="space-y-2">
                  {["xen", "xev-fin", "xevtg", "xd-d"].map((community) => {
                    const count = filteredRegistrations.filter(
                      (r) => r.companyCommunity === community
                    ).length;
                    return (
                      count > 0 && (
                        <div
                          key={community}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-gray-600">
                            {community === "xen"
                              ? "XEN"
                              : community === "xev-fin"
                              ? "XEV.FiN"
                              : community === "xevtg"
                              ? "XEVTG"
                              : "xD&D"}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {count}
                          </span>
                        </div>
                      )
                    );
                  })}
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">No Community:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {
                        filteredRegistrations.filter(
                          (r) =>
                            !r.companyCommunity || r.companyCommunity === "none"
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                  <Icon
                    icon="mdi:ticket"
                    width={18}
                    className="mr-2 text-primary"
                  />
                  Ticket Types
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">ASP Tickets:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {
                        filteredRegistrations.filter(
                          (r) => r.ticketType === "asp"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">GNP Tickets:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {
                        filteredRegistrations.filter(
                          (r) => r.ticketType === "gnp"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">
                      Free Registrations:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {
                        filteredRegistrations.filter(
                          (r) => r.isFree || r.totalCost === 0
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="space-y-4">
              {/* First Row: Search Bar Only */}
              <div className="flex items-center">
                <div className="relative flex-1 max-w-md">
                  <Icon
                    icon="mdi:magnify"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    width={20}
                  />
                  <input
                    type="text"
                    placeholder="Search companies, contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Second Row: All Filters in One Row */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  style={{ minWidth: "100px" }}
                >
                  <option value="All">All</option>
                  <option value="event">Single Event</option>
                  <option value="season">Season Registration</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  style={{ minWidth: "100px" }}
                >
                  <option value="All">All</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {/* Event Filter */}
                <select
                  value={filterEvent}
                  onChange={(e) => setFilterEvent(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex-shrink-0"
                  style={{ minWidth: "150px", maxWidth: "300px" }}
                >
                  <option value="All">All Events</option>
                  {/* Single Events */}
                  {events
                    .filter((event) => event.id && event.title)
                    .map((event) => {
                      // Format: "Location || Title || Season" if available
                      let displayText = event.title;
                      const parts = [];
                      if (event.location) parts.push(event.location);
                      parts.push(event.title);
                      if (event.season) parts.push(event.season);
                      displayText = parts.join(" || ");
                      return (
                        <option key={event.id} value={event.id}>
                          {displayText}
                        </option>
                      );
                    })}
                  {/* Season Registrations */}
                  {registrations
                    .filter((r) => r.registrationType === "season" && r.season)
                    .reduce((acc, reg) => {
                      const seasonLabel = `Season ${reg.season}`;
                      if (!acc.includes(seasonLabel)) {
                        acc.push(seasonLabel);
                      }
                      return acc;
                    }, [])
                    .sort()
                    .map((season) => (
                      <option key={season} value={season}>
                        {season}
                      </option>
                    ))}
                </select>

                {/* Sort */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  style={{ minWidth: "150px" }}
                >
                  <option value="registrationDate-desc">Date (Newest)</option>
                  <option value="registrationDate-asc">Date (Oldest)</option>
                  <option value="companyName-asc">Name (A-Z)</option>
                  <option value="companyName-desc">Name (Z-A)</option>
                </select>

                {/* View Mode */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden ml-auto">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-3 py-2.5 ${
                      viewMode === "table"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } transition-colors`}
                    title="Table View"
                  >
                    <Icon icon="mdi:view-list" width={20} />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-2.5 border-l border-gray-300 ${
                      viewMode === "grid"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } transition-colors`}
                    title="Grid View"
                  >
                    <Icon icon="mdi:view-grid" width={20} />
                  </button>
                </div>
              </div>

              {/* Third Row: Date Range Filters */}
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Icon
                    icon="mdi:calendar-range"
                    className="text-gray-500"
                    width={20}
                  />
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Date Range:
                  </span>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-gray-500 mb-1.5">
                    From Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-10"
                    />
                    <Icon
                      icon="mdi:calendar"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                      width={18}
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-gray-500 mb-1.5">
                    To Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      min={dateFrom || undefined}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-10"
                    />
                    <Icon
                      icon="mdi:calendar"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                      width={18}
                    />
                  </div>
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                    }}
                    className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 mt-6"
                    title="Clear Date Filter"
                  >
                    <Icon icon="mdi:close" width={16} />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filtered Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {filteredRegistrations.length}
                </span>{" "}
                {filteredRegistrations.length === 1
                  ? "registration"
                  : "registrations"}
                {(() => {
                  const hasActiveFilters =
                    searchTerm ||
                    filterType !== "All" ||
                    filterStatus !== "All" ||
                    filterEvent !== "All" ||
                    filterCompanyType !== "All" ||
                    dateFrom ||
                    dateTo;

                  if (hasActiveFilters) {
                    return (
                      <>
                        {" "}
                        (filtered from{" "}
                        <span className="font-semibold text-gray-900">
                          {registrations.length}
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
                  filterType !== "All" ||
                  filterStatus !== "All" ||
                  filterEvent !== "All" ||
                  filterCompanyType !== "All" ||
                  dateFrom ||
                  dateTo;

                if (hasActiveFilters) {
                  return (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterType("All");
                        setFilterStatus("All");
                        setFilterEvent("All");
                        setFilterCompanyType("All");
                        setDateFrom("");
                        setDateTo("");
                        setCurrentPage(1);
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

          {/* Registrations Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                      Company & Contact Details
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Event & Community
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Attendees
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Cost & Status
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Registration Date
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRegistrations.map((registration) => (
                    <tr key={registration.id} className="hover:bg-gray-50">
                      {/* Company & Contact Details */}
                      <td className="px-8 py-6">
                        <div className="space-y-2">
                          <div className="text-base font-semibold text-gray-900">
                            {registration.companyName}
                          </div>
                          <div className="text-sm text-gray-700">
                            <Icon
                              icon="mdi:account"
                              width={16}
                              className="inline mr-2 text-blue-600"
                            />
                            {registration.primaryContactName}
                          </div>
                          <div className="text-sm text-gray-600">
                            <Icon
                              icon="mdi:email"
                              width={14}
                              className="inline mr-2 text-gray-500"
                            />
                            {registration.primaryContactEmail}
                          </div>
                          {registration.primaryContactPhone && (
                            <div className="text-sm text-gray-600">
                              <Icon
                                icon="mdi:phone"
                                width={14}
                                className="inline mr-2 text-gray-500"
                              />
                              {registration.primaryContactPhone}
                            </div>
                          )}
                          {registration.primaryContactDesignation && (
                            <div className="text-xs text-gray-500 mt-1">
                              <Icon
                                icon="mdi:briefcase"
                                width={12}
                                className="inline mr-1"
                              />
                              {registration.primaryContactDesignation}
                            </div>
                          )}
                          {registration.industry && (
                            <div className="text-xs text-gray-500 mt-1">
                              <Icon
                                icon="mdi:domain"
                                width={12}
                                className="inline mr-1"
                              />
                              {registration.industry}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Event & Community */}
                      <td className="px-8 py-6">
                        <div className="space-y-3">
                          {/* Event Type & Name */}
                          <div className="space-y-2">
                            <div>
                              {registration.registrationType === "season" ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                  <Icon
                                    icon="mdi:calendar-range"
                                    width={14}
                                    className="mr-1"
                                  />
                                  Season {registration.season}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                  <Icon
                                    icon="mdi:calendar"
                                    width={14}
                                    className="mr-1"
                                  />
                                  Single Event
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {registration.eventTitle ||
                                `Season ${registration.season}`}
                            </div>
                            {registration.eventDate && (
                              <div className="text-xs text-gray-500">
                                <Icon
                                  icon="mdi:calendar-clock"
                                  width={12}
                                  className="inline mr-1"
                                />
                                {formatDate(registration.eventDate)}
                              </div>
                            )}
                          </div>

                          {/* Community & Status */}
                          <div className="space-y-2">
                            {registration.companyCommunity &&
                            registration.companyCommunity !== "none" ? (
                              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Icon
                                  icon="mdi:account-group"
                                  width={12}
                                  className="mr-1"
                                />
                                {registration.companyCommunity === "xen"
                                  ? "XEN"
                                  : registration.companyCommunity === "xev-fin"
                                  ? "XEV.FiN"
                                  : registration.companyCommunity === "xevtg"
                                  ? "XEVTG"
                                  : registration.companyCommunity === "xd-d"
                                  ? "xD&D"
                                  : registration.companyCommunity}
                                {registration.companyCommunity === "xen" &&
                                  registration.xenLevel && (
                                    <span className="ml-1 font-bold">
                                      {registration.xenLevel.toUpperCase()}
                                    </span>
                                  )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">
                                No Community
                              </span>
                            )}

                            {/* Ticket Type */}
                            {registration.ticketType && (
                              <div>
                                <div
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    registration.ticketType === "asp"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  <Icon
                                    icon={
                                      registration.ticketType === "asp"
                                        ? "mdi:star"
                                        : "mdi:account"
                                    }
                                    width={12}
                                    className="mr-1"
                                  />
                                  {registration.ticketType === "asp"
                                    ? "ASP"
                                    : "GNP"}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Attendees */}
                      <td className="px-8 py-6">
                        <div className="space-y-3">
                          <div className="flex items-center text-lg font-bold text-blue-600">
                            <Icon
                              icon="mdi:account-multiple"
                              width={18}
                              className="mr-2"
                            />
                            {registration.personnel
                              ? registration.personnel.filter(
                                  (p) => p.isAttending
                                ).length
                              : 1}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">
                            {registration.personnel
                              ? registration.personnel.filter(
                                  (p) => p.isAttending
                                ).length
                              : 1}{" "}
                            attending
                          </div>
                          {registration.personnel &&
                            registration.personnel.length > 0 && (
                              <div className="space-y-1">
                                {registration.personnel
                                  .filter((p) => p.isAttending)
                                  .slice(0, 2)
                                  .map((person, index) => (
                                    <div
                                      key={index}
                                      className="text-xs text-gray-600 flex items-center"
                                    >
                                      <Icon
                                        icon="mdi:account"
                                        width={10}
                                        className="mr-1 text-gray-400"
                                      />
                                      <span className="truncate">
                                        {person.name}
                                      </span>
                                    </div>
                                  ))}
                                {registration.personnel.filter(
                                  (p) => p.isAttending
                                ).length > 2 && (
                                  <div className="text-xs text-gray-500 font-medium">
                                    +
                                    {registration.personnel.filter(
                                      (p) => p.isAttending
                                    ).length - 2}{" "}
                                    more
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      </td>

                      {/* Cost & Status */}
                      <td className="px-8 py-6">
                        <div className="space-y-3">
                          <div className="text-xl font-bold text-emerald-600">
                            ₹{(registration.totalCost || 0).toLocaleString()}
                          </div>

                          <div className="space-y-1">
                            {registration.baseAmount &&
                              registration.baseAmount !==
                                registration.totalCost && (
                                <div className="text-xs text-gray-500">
                                  Base: ₹
                                  {registration.baseAmount.toLocaleString()}
                                </div>
                              )}
                            {registration.discountAmount &&
                              registration.discountAmount > 0 && (
                                <div className="text-xs text-green-600 font-medium">
                                  Discount: -₹
                                  {registration.discountAmount.toLocaleString()}
                                </div>
                              )}
                            {registration.isFree && (
                              <div className="text-xs text-green-600 font-medium">
                                <Icon
                                  icon="mdi:gift"
                                  width={12}
                                  className="inline mr-1"
                                />
                                Free Registration
                              </div>
                            )}
                          </div>

                          <div>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                registration.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : registration.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              <Icon
                                icon={
                                  registration.status === "confirmed"
                                    ? "mdi:check-circle"
                                    : registration.status === "pending"
                                    ? "mdi:clock"
                                    : "mdi:close-circle"
                                }
                                width={14}
                                className="mr-1"
                              />
                              {registration.status?.charAt(0).toUpperCase() +
                                registration.status?.slice(1)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Registration Date */}
                      <td className="px-8 py-6">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(
                              registration.registrationDate ||
                                registration.createdAt
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatRelativeTime(
                              registration.registrationDate ||
                                registration.createdAt
                            )}
                          </div>
                          {registration.registrationDeadline && (
                            <div className="text-xs text-orange-600 font-medium">
                              <Icon
                                icon="mdi:clock-alert"
                                width={12}
                                className="inline mr-1"
                              />
                              Deadline:{" "}
                              {formatDate(registration.registrationDeadline)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                setShowRegistrationDetails(registration)
                              }
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50 transition-colors"
                              title="View Full Details"
                            >
                              <Icon icon="mdi:eye" width={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleEditRegistration(registration)
                              }
                              className="text-green-600 hover:text-green-900 p-2 rounded-full hover:bg-green-50 transition-colors"
                              title="Edit Registration"
                            >
                              <Icon icon="mdi:pencil" width={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteRegistration(registration.id)
                              }
                              className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors"
                              title="Delete Registration"
                            >
                              <Icon icon="mdi:delete" width={16} />
                            </button>
                          </div>

                          {/* Status Action Buttons */}
                          <div className="flex items-center gap-1">
                            {registration.status === "pending" && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    registration.id,
                                    "confirmed"
                                  )
                                }
                                className="text-green-600 hover:text-green-900 p-1 rounded text-xs bg-green-50 hover:bg-green-100 px-2 py-1 transition-colors"
                                title="Approve Registration"
                              >
                                <Icon
                                  icon="mdi:check"
                                  width={12}
                                  className="inline mr-1"
                                />
                                Approve
                              </button>
                            )}
                            {registration.status === "confirmed" && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    registration.id,
                                    "cancelled"
                                  )
                                }
                                className="text-orange-600 hover:text-orange-900 p-1 rounded text-xs bg-orange-50 hover:bg-orange-100 px-2 py-1 transition-colors"
                                title="Cancel Registration"
                              >
                                <Icon
                                  icon="mdi:cancel"
                                  width={12}
                                  className="inline mr-1"
                                />
                                Cancel
                              </button>
                            )}
                            {registration.status === "cancelled" && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    registration.id,
                                    "confirmed"
                                  )
                                }
                                className="text-green-600 hover:text-green-900 p-1 rounded text-xs bg-green-50 hover:bg-green-100 px-2 py-1 transition-colors"
                                title="Reactivate Registration"
                              >
                                <Icon
                                  icon="mdi:refresh"
                                  width={12}
                                  className="inline mr-1"
                                />
                                Restore
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginatedRegistrations.length === 0 && (
              <div className="text-center py-12">
                <Icon
                  icon="mdi:account-multiple-outline"
                  width={48}
                  className="mx-auto text-gray-400 mb-4"
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No registrations found
                </h3>
                <p className="text-gray-500">
                  {searchTerm || filterStatus !== "All" || filterType !== "All"
                    ? "Try adjusting your filters"
                    : "No registrations have been made yet"}
                </p>
              </div>
            )}

            {/* Pagination */}
            {filteredRegistrations.length > itemsPerPage && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(currentPage + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">{startIndex + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(endIndex, filteredRegistrations.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {filteredRegistrations.length}
                      </span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(currentPage - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Icon icon="mdi:chevron-left" className="h-5 w-5" />
                      </button>
                      {Array.from(
                        { length: Math.min(totalPages, 5) },
                        (_, i) => {
                          let pageNum = i + 1;
                          if (totalPages > 5) {
                            if (currentPage <= 3) pageNum = i + 1;
                            else if (currentPage >= totalPages - 2)
                              pageNum = totalPages - 4 + i;
                            else pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                currentPage === pageNum
                                  ? "z-10 bg-primary text-white"
                                  : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(currentPage + 1, totalPages))
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Icon icon="mdi:chevron-right" className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Registration Details Modal */}
        {showRegistrationDetails && (
          <RegistrationDetailsModal
            registration={showRegistrationDetails}
            onClose={() => setShowRegistrationDetails(null)}
          />
        )}

        {/* Edit Registration Modal */}
        {editRegistration && (
          <EditRegistrationModal
            registration={editRegistration}
            events={events}
            onClose={() => setEditRegistration(null)}
            onSave={handleSaveRegistration}
          />
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}

// Registration Details Modal Component
function RegistrationDetailsModal({ registration, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Icon
                  icon="mdi:account-details"
                  width={24}
                  className="text-blue-600"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Registration Details
                </h2>
                <p className="text-gray-600">
                  {registration.companyName} • {registration.primaryContactName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Icon icon="mdi:close" width={24} className="text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Company Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Company Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Company Name
                  </label>
                  <p className="text-gray-900">{registration.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Industry
                  </label>
                  <p className="text-gray-900">
                    {registration.industry || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Company Size
                  </label>
                  <p className="text-gray-900">
                    {registration.companySize === "startup"
                      ? "Startup (1-50)"
                      : registration.companySize === "medium"
                      ? "Medium (51-500)"
                      : registration.companySize === "large"
                      ? "Large (500+)"
                      : registration.companySize || "Not specified"}
                  </p>
                </div>
                {registration.companyAddress && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Address
                    </label>
                    <p className="text-gray-900">
                      {registration.companyAddress}
                    </p>
                  </div>
                )}
                {registration.companyEmail && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Company Email
                    </label>
                    <p className="text-gray-900">{registration.companyEmail}</p>
                  </div>
                )}
                {registration.companyPhone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Company Phone
                    </label>
                    <p className="text-gray-900">{registration.companyPhone}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Primary Contact
                  </label>
                  <p className="text-gray-900">
                    {registration.primaryContactName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="text-gray-900">
                    {registration.primaryContactEmail}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <p className="text-gray-900">
                    {registration.primaryContactPhone || "Not provided"}
                  </p>
                </div>
                {registration.primaryContactDesignation && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Designation
                    </label>
                    <p className="text-gray-900">
                      {registration.primaryContactDesignation}
                    </p>
                  </div>
                )}
                {registration.emergencyContact && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Emergency Contact
                    </label>
                    <p className="text-gray-900">
                      {registration.emergencyContact}
                      {registration.emergencyPhone &&
                        ` (${registration.emergencyPhone})`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Community & Membership Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Community & Membership
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Community
                </label>
                <p className="text-gray-900">
                  {registration.companyCommunity &&
                  registration.companyCommunity !== "none" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {registration.companyCommunity === "xen"
                        ? "XEN"
                        : registration.companyCommunity === "xev-fin"
                        ? "XEV.FiN"
                        : registration.companyCommunity === "xevtg"
                        ? "XEVTG"
                        : registration.companyCommunity === "xd-d"
                        ? "xD&D"
                        : registration.companyCommunity}
                      {registration.companyCommunity === "xen" &&
                        registration.xenLevel && (
                          <span className="ml-1 font-bold">
                            {registration.xenLevel.toUpperCase()}
                          </span>
                        )}
                    </span>
                  ) : (
                    "No Community"
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Client Status
                </label>
                <p className="text-gray-900">
                  {registration.clientStatus &&
                  registration.clientStatus !== "none" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {registration.clientStatus === "existing-client"
                        ? "Existing Client"
                        : registration.clientStatus === "former-client"
                        ? "Former Client"
                        : registration.clientStatus === "sponsor-partner"
                        ? "Sponsor/Partner"
                        : registration.clientStatus}
                    </span>
                  ) : (
                    "Regular"
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Company Type
                </label>
                <p className="text-gray-900">
                  {registration.companyType === "startup-corporate"
                    ? "Startup/Corporate"
                    : registration.companyType === "investor"
                    ? "Investor"
                    : registration.companyType || "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Event Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Event Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Event Type
                </label>
                <p className="text-gray-900">
                  {registration.registrationType === "season"
                    ? "Season Registration"
                    : "Single Event"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Event/Season
                </label>
                <p className="text-gray-900">
                  {registration.eventTitle || `Season ${registration.season}`}
                </p>
              </div>
            </div>
          </div>

          {/* Personnel */}
          {registration.personnel && registration.personnel.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Attendees
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  {registration.personnel
                    .filter((p) => p.isAttending)
                    .map((person, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-3 rounded"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {person.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {person.designation}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {person.email}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Financial Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Financial Information
            </h3>
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-700">
                      Total Cost
                    </span>
                    <span className="text-xl font-bold text-emerald-700">
                      ₹{(registration.totalCost || 0).toLocaleString()}
                    </span>
                  </div>
                  {registration.baseAmount &&
                    registration.baseAmount !== registration.totalCost && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-emerald-600">
                          Base Amount
                        </span>
                        <span className="text-sm font-medium text-emerald-600">
                          ₹{registration.baseAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  {registration.discountAmount > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-emerald-600">
                        Discount Applied
                      </span>
                      <span className="text-sm font-medium text-emerald-600">
                        -₹{registration.discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {registration.isFree && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Icon icon="mdi:gift" width={12} className="mr-1" />
                        Free Registration
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  {registration.ticketType && (
                    <div>
                      <span className="text-sm font-medium text-emerald-700">
                        Ticket Type
                      </span>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                            registration.ticketType === "asp"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <Icon
                            icon={
                              registration.ticketType === "asp"
                                ? "mdi:star"
                                : "mdi:account"
                            }
                            width={14}
                            className="mr-1"
                          />
                          {registration.ticketType === "asp"
                            ? "ASP (₹60,000)"
                            : "GNP (₹8,000/member)"}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="mt-2">
                    <span className="text-sm font-medium text-emerald-700">
                      Status
                    </span>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                          registration.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : registration.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <Icon
                          icon={
                            registration.status === "confirmed"
                              ? "mdi:check-circle"
                              : registration.status === "pending"
                              ? "mdi:clock"
                              : "mdi:close-circle"
                          }
                          width={14}
                          className="mr-1"
                        />
                        {registration.status?.charAt(0).toUpperCase() +
                          registration.status?.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          {(registration.specialRequests ||
            registration.termsAccepted ||
            registration.privacyAccepted) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Additional Details
              </h3>
              <div className="space-y-4">
                {registration.specialRequests && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Special Requests
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {registration.specialRequests}
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Terms Accepted
                    </label>
                    <p className="text-gray-900">
                      {registration.termsAccepted ? (
                        <span className="inline-flex items-center text-green-600">
                          <Icon
                            icon="mdi:check-circle"
                            width={16}
                            className="mr-1"
                          />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-600">
                          <Icon
                            icon="mdi:close-circle"
                            width={16}
                            className="mr-1"
                          />
                          No
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Privacy Accepted
                    </label>
                    <p className="text-gray-900">
                      {registration.privacyAccepted ? (
                        <span className="inline-flex items-center text-green-600">
                          <Icon
                            icon="mdi:check-circle"
                            width={16}
                            className="mr-1"
                          />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-600">
                          <Icon
                            icon="mdi:close-circle"
                            width={16}
                            className="mr-1"
                          />
                          No
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Registration ID
                    </label>
                    <p className="text-gray-900 font-mono text-sm">
                      {registration.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Registration Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Registration Timeline
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Registration Date
                  </span>
                  <span className="text-sm text-gray-900">
                    {formatDate(
                      registration.registrationDate || registration.createdAt
                    )}
                  </span>
                </div>
                {registration.updatedAt &&
                  registration.updatedAt !== registration.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Last Updated
                      </span>
                      <span className="text-sm text-gray-900">
                        {formatDate(registration.updatedAt)}
                      </span>
                    </div>
                  )}
                {registration.statusUpdatedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Status Updated
                    </span>
                    <span className="text-sm text-gray-900">
                      {formatDate(registration.statusUpdatedAt)}
                    </span>
                  </div>
                )}
                {registration.registrationDeadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Registration Deadline
                    </span>
                    <span className="text-sm text-orange-600">
                      {formatDate(registration.registrationDeadline)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <Button
              text="Close"
              type="secondary"
              onClick={onClose}
              className="px-6"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Registration Modal Component
function EditRegistrationModal({ registration, events, onClose, onSave }) {
  const [formData, setFormData] = useState({
    companyName: registration.companyName || "",
    primaryContactName: registration.primaryContactName || "",
    primaryContactEmail: registration.primaryContactEmail || "",
    primaryContactPhone: registration.primaryContactPhone || "",
    primaryContactDesignation: registration.primaryContactDesignation || "",
    industry: registration.industry || "",
    companySize: registration.companySize || "",
    companyCommunity: registration.companyCommunity || "",
    status: registration.status || "pending",
    totalCost: registration.totalCost || 0,
    specialRequests: registration.specialRequests || "",
    emergencyContact: registration.emergencyContact || "",
    emergencyPhone: registration.emergencyPhone || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving registration:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Icon icon="mdi:pencil" width={24} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Edit Registration
                </h2>
                <p className="text-gray-600">
                  Update registration details through CMS
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Icon icon="mdi:close" width={24} className="text-gray-600" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Company Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Company Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => handleChange("industry", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size
                </label>
                <select
                  value={formData.companySize}
                  onChange={(e) => handleChange("companySize", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Size</option>
                  <option value="startup">Startup (1-50)</option>
                  <option value="medium">Medium (51-500)</option>
                  <option value="large">Large (500+)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Community
                </label>
                <select
                  value={formData.companyCommunity}
                  onChange={(e) =>
                    handleChange("companyCommunity", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">No Community</option>
                  <option value="xen">XEN</option>
                  <option value="xev-fin">XEV.FiN</option>
                  <option value="xevtg">XEVTG</option>
                  <option value="xd-d">xD&D</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Primary Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={formData.primaryContactName}
                  onChange={(e) =>
                    handleChange("primaryContactName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.primaryContactEmail}
                  onChange={(e) =>
                    handleChange("primaryContactEmail", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.primaryContactPhone}
                  onChange={(e) =>
                    handleChange("primaryContactPhone", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  value={formData.primaryContactDesignation}
                  onChange={(e) =>
                    handleChange("primaryContactDesignation", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Registration Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Registration Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Cost (₹)
                </label>
                <input
                  type="number"
                  value={formData.totalCost}
                  onChange={(e) =>
                    handleChange("totalCost", parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  min="0"
                  step="1"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    handleChange("emergencyContact", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Phone
                </label>
                <input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) =>
                    handleChange("emergencyPhone", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests
            </label>
            <textarea
              value={formData.specialRequests}
              onChange={(e) => handleChange("specialRequests", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Any special requirements or notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              text="Cancel"
              type="secondary"
              onClick={onClose}
              disabled={saving}
            />
            <Button
              text={saving ? "Saving..." : "Save Changes"}
              type="primary"
              htmlType="submit"
              disabled={saving}
              icon={saving ? "mdi:loading" : "mdi:content-save"}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
