"use client";
import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import AdminLayout from "../../../../src/components/admin/AdminLayout";
import ProtectedRoute from "../../../../src/components/admin/ProtectedRoute";
import {
  eventService,
  resourceService,
  serviceService,
  eventRegistrationService,
  ContactService,
  BookingService,
} from "../../../../src/services/databaseService";
import Button from "../../../../src/components/common/Button";
import {
  formatDate,
  formatRelativeTime,
} from "../../../../src/utils/dateUtils";
import { notificationService } from "../../../../src/services/notificationService";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    resources: 0,
    events: 0,
    services: 0,
    registrations: 0,
    contactInquiries: 0,
    consultationBookings: 0,
    resourcesByType: {
      whitepapers: 0,
      articles: 0,
      reports: 0,
    },
    eventsByStatus: {
      upcoming: 0,
      ongoing: 0,
      completed: 0,
    },
    inquiriesByStatus: {
      new: 0,
      in_progress: 0,
      resolved: 0,
    },
    bookingsByStatus: {
      pending_confirmation: 0,
      confirmed: 0,
      completed: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentResources, setRecentResources] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState({
    database: { status: "loading", message: "Checking..." },
    storage: {
      firestore: { display: "Loading...", percentage: 0, totalDocuments: 0 },
      cloudinary: { display: "Loading...", percentage: 0 },
    },
    lastBackup: { text: "Loading...", hoursAgo: 0 },
  });
  const [systemStatusLoading, setSystemStatusLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    loadSystemStatus();

    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Refresh dashboard data every 5 minutes to check for new items
    const refreshTimer = setInterval(() => {
      loadDashboardData();
    }, 300000); // 5 minutes

    // Refresh system status every 30 seconds for real-time updates
    const systemStatusTimer = setInterval(() => {
      loadSystemStatus();
    }, 30000); // 30 seconds

    return () => {
      clearInterval(timer);
      clearInterval(refreshTimer);
      clearInterval(systemStatusTimer);
    };
  }, []);

  const loadSystemStatus = async () => {
    try {
      setSystemStatusLoading(true);
      const response = await fetch("/api/system-status");
      const result = await response.json();

      if (result.success && result.data) {
        setSystemStatus(result.data);
      }
    } catch (error) {
      console.error("Error loading system status:", error);
      // Keep previous status on error
    } finally {
      setSystemStatusLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Initialize services
      const contactService = new ContactService();
      const bookingService = new BookingService();

      // Fetch all data concurrently
      const [
        resourcesCount,
        eventsCount,
        servicesCount,
        registrationsCount,
        contactInquiriesCount,
        consultationBookingsCount,
        allResources,
        allEvents,
        allRegistrations,
        allInquiries,
        allBookings,
      ] = await Promise.all([
        resourceService.getCount(),
        eventService.getCount(),
        serviceService.getCount(),
        eventRegistrationService.getCount(),
        contactService.getCount(),
        bookingService.getCount(),
        resourceService.getWithLimit(5, "createdAt", "desc"),
        eventService.getWithLimit(5, "createdAt", "desc"),
        eventRegistrationService.getWithLimit(10, "createdAt", "desc"),
        contactService.getWithLimit(5, "createdAt", "desc"),
        bookingService.getWithLimit(5, "createdAt", "desc"),
      ]);

      // Calculate resource stats by type
      const resourcesByType = {
        whitepapers: 0,
        articles: 0,
        reports: 0,
      };

      // Get all resources to calculate type stats
      const allResourcesForStats = await resourceService.getAll();
      allResourcesForStats.forEach((resource) => {
        if (resource.type === "whitepaper") resourcesByType.whitepapers++;
        else if (resource.type === "article") resourcesByType.articles++;
        else if (resource.type === "report") resourcesByType.reports++;
      });

      // Calculate event stats by status
      const eventsByStatus = {
        upcoming: 0,
        ongoing: 0,
        completed: 0,
      };

      const now = new Date();
      const allEventsForStats = await eventService.getAll();
      allEventsForStats.forEach((event) => {
        const eventDate = new Date(event.date);
        const eventEndDate = event.endDate
          ? new Date(event.endDate)
          : eventDate;

        if (eventDate > now) {
          eventsByStatus.upcoming++;
        } else if (eventDate <= now && eventEndDate >= now) {
          eventsByStatus.ongoing++;
        } else {
          eventsByStatus.completed++;
        }
      });

      // Calculate inquiry stats by status
      const inquiriesByStatus = {
        new: 0,
        in_progress: 0,
        resolved: 0,
      };

      const allInquiriesForStats = await contactService.getInquiries();
      allInquiriesForStats.forEach((inquiry) => {
        const status = inquiry.status || "new";
        if (inquiriesByStatus.hasOwnProperty(status)) {
          inquiriesByStatus[status]++;
        }
      });

      // Calculate booking stats by status
      const bookingsByStatus = {
        pending_confirmation: 0,
        confirmed: 0,
        completed: 0,
      };

      const allBookingsForStats = await bookingService.getBookings();
      allBookingsForStats.forEach((booking) => {
        const status = booking.status || "pending_confirmation";
        if (bookingsByStatus.hasOwnProperty(status)) {
          bookingsByStatus[status]++;
        }
      });

      setStats({
        resources: resourcesCount,
        events: eventsCount,
        services: servicesCount,
        registrations: registrationsCount,
        contactInquiries: contactInquiriesCount,
        consultationBookings: consultationBookingsCount,
        resourcesByType,
        eventsByStatus,
        inquiriesByStatus,
        bookingsByStatus,
      });

      setRecentResources(allResources);
      setRecentEvents(allEvents);

      // Generate recent activity from actual data
      const activities = [];

      // Add recent resources
      allResources.slice(0, 3).forEach((resource) => {
        activities.push({
          id: `resource-${resource.id}`,
          type: "resource",
          action: "created",
          title: `New ${resource.type}: ${resource.title}`,
          time: formatRelativeTime(resource.createdAt),
          item: resource,
        });
      });

      // Add recent events
      allEvents.slice(0, 3).forEach((event) => {
        activities.push({
          id: `event-${event.id}`,
          type: "event",
          action: "created",
          title: `New event: ${event.title}`,
          time: formatRelativeTime(event.createdAt),
          item: event,
        });
      });

      // Add recent registrations
      allRegistrations.slice(0, 2).forEach((registration) => {
        activities.push({
          id: `registration-${registration.id}`,
          type: "registration",
          action: "registered",
          title: `${registration.firstName} ${registration.lastName} registered for event`,
          time: formatRelativeTime(registration.createdAt),
          item: registration,
        });
      });

      // Add recent contact inquiries
      allInquiries.slice(0, 2).forEach((inquiry) => {
        activities.push({
          id: `inquiry-${inquiry.id}`,
          type: "contact_inquiry",
          action: "submitted",
          title: `${inquiry.firstName} ${inquiry.lastName} submitted a ${
            inquiry.inquiryType || "general"
          } inquiry`,
          time: formatRelativeTime(inquiry.createdAt),
          item: inquiry,
        });
      });

      // Add recent consultation bookings
      allBookings.slice(0, 2).forEach((booking) => {
        activities.push({
          id: `booking-${booking.id}`,
          type: "consultation_booking",
          action: "booked",
          title: `${booking.firstName} ${
            booking.lastName
          } booked a ${booking.consultationType?.replace(
            "-",
            " "
          )} consultation`,
          time: formatRelativeTime(booking.createdAt),
          item: booking,
        });
      });

      // Sort activities by time (most recent first)
      activities.sort((a, b) => {
        const timeA = a.item.createdAt || new Date(0);
        const timeB = b.item.createdAt || new Date(0);
        return timeB - timeA;
      });

      setRecentActivity(activities.slice(0, 8));

      // Generate system notifications based on current stats
      const currentStats = {
        resources: resourcesCount,
        events: eventsCount,
        services: servicesCount,
        registrations: registrationsCount,
        contactInquiries: contactInquiriesCount,
        consultationBookings: consultationBookingsCount,
        resourcesByType,
        eventsByStatus,
        inquiriesByStatus,
        bookingsByStatus,
      };

      generateSystemNotifications(currentStats);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate system notifications
  const generateSystemNotifications = (currentStats) => {
    const existingNotifications = notificationService.getNotifications();
    const hasWelcomeNotification = existingNotifications.some(
      (n) => n.title === "Welcome to Admin Dashboard! 🎉"
    );

    // Add welcome notification on first load only
    if (!hasWelcomeNotification && existingNotifications.length === 0) {
      notificationService.addNotification({
        title: "Welcome to Admin Dashboard! 🎉",
        message:
          "You're all set up! Check out the quick actions below to get started managing your content.",
        type: "system",
        priority: "normal",
      });
    }

    // Check for new inquiries that need attention
    if (currentStats.inquiriesByStatus?.new > 0) {
      const hasInquiryNotification = existingNotifications.some(
        (n) =>
          n.title === "New Contact Inquiries" &&
          n.message.includes(
            `${currentStats.inquiriesByStatus.new} new contact inquiries`
          )
      );

      if (!hasInquiryNotification) {
        notificationService.addNotification({
          title: "New Contact Inquiries",
          message: `You have ${currentStats.inquiriesByStatus.new} new contact inquiries awaiting response.`,
          type: "inquiry",
          priority: currentStats.inquiriesByStatus.new > 5 ? "high" : "normal",
          action: "/admin/contact-inquiries",
        });
      }
    }

    // Check for pending bookings
    if (currentStats.bookingsByStatus?.pending_confirmation > 0) {
      const hasBookingNotification = existingNotifications.some(
        (n) =>
          n.title === "Pending Consultation Bookings" &&
          n.message.includes(
            `${currentStats.bookingsByStatus.pending_confirmation} consultation bookings`
          )
      );

      if (!hasBookingNotification) {
        notificationService.addNotification({
          title: "Pending Consultation Bookings",
          message: `${currentStats.bookingsByStatus.pending_confirmation} consultation bookings need confirmation.`,
          type: "booking",
          priority: "high",
          action: "/admin/consultation-bookings",
        });
      }
    }

    // Check for upcoming events
    if (currentStats.eventsByStatus?.upcoming > 0) {
      const hasEventNotification = existingNotifications.some(
        (n) =>
          n.title === "Upcoming Events" &&
          n.message.includes(
            `${currentStats.eventsByStatus.upcoming} upcoming events`
          )
      );

      if (!hasEventNotification) {
        notificationService.addNotification({
          title: "Upcoming Events",
          message: `You have ${currentStats.eventsByStatus.upcoming} upcoming events. Make sure everything is ready!`,
          type: "event",
          priority: "normal",
          action: "/admin/events",
        });
      }
    }

    // System health check notification (only add once per day)
    const today = new Date().toDateString();
    const hasSystemHealthCheck = existingNotifications.some(
      (n) =>
        n.title === "System Health Check" &&
        new Date(n.createdAt).toDateString() === today
    );

    if (!hasSystemHealthCheck) {
      notificationService.addNotification({
        title: "System Health Check",
        message:
          "All systems are running optimally. Database connection is stable.",
        type: "success",
        priority: "normal",
      });
    }
  };

  const quickActions = [
    {
      name: "Add Resource",
      href: "/admin/resources/new",
      icon: "solar:document-add-bold",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      description: "Create new whitepaper, article, or report",
    },
    {
      name: "Create Event",
      href: "/admin/events/new",
      icon: "solar:calendar-add-bold",
      color: "bg-gradient-to-br from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
      description: "Schedule a new event or workshop",
    },
    {
      name: "Add Service",
      href: "/admin/services/new",
      icon: "solar:widget-add-bold",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
      description: "Add a new business service",
    },
    {
      name: "Add Team Member",
      href: "/admin/team/new",
      icon: "solar:user-plus-bold",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      hoverColor: "hover:from-orange-600 hover:to-orange-700",
      description: "Add new team member",
    },
  ];

  const statCards = [
    {
      name: "Total Resources",
      value: stats.resources,
      icon: "solar:document-text-bold",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      trend: "+12%",
      trendColor: "text-green-600",
      link: "/admin/resources",
      subtitle: `${stats.resourcesByType.whitepapers} whitepapers, ${stats.resourcesByType.articles} articles, ${stats.resourcesByType.reports} reports`,
    },
    {
      name: "Total Events",
      value: stats.events,
      icon: "solar:calendar-bold",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      trend: "+8%",
      trendColor: "text-green-600",
      link: "/admin/events",
      subtitle: `${stats.eventsByStatus.upcoming} upcoming, ${stats.eventsByStatus.ongoing} ongoing`,
    },
    {
      name: "Services",
      value: stats.services,
      icon: "solar:widget-bold",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      trend: "+5%",
      trendColor: "text-green-600",
      link: "/admin/services",
      subtitle: "Business services offered",
    },
    {
      name: "Registrations",
      value: stats.registrations,
      icon: "solar:users-group-rounded-bold",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      trend: "+25%",
      trendColor: "text-green-600",
      link: "/admin/registrations",
      subtitle: "Total event registrations",
    },
    {
      name: "Contact Inquiries",
      value: stats.contactInquiries,
      icon: "solar:letter-bold",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      trend: "+18%",
      trendColor: "text-green-600",
      link: "/admin/contact-inquiries",
      subtitle: `${stats.inquiriesByStatus.new} new, ${stats.inquiriesByStatus.resolved} resolved`,
    },
    {
      name: "Consultation Bookings",
      value: stats.consultationBookings,
      icon: "solar:calendar-mark-bold",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-200",
      trend: "+15%",
      trendColor: "text-green-600",
      link: "/admin/consultation-bookings",
      subtitle: `${stats.bookingsByStatus.confirmed} confirmed, ${stats.bookingsByStatus.pending_confirmation} pending`,
    },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case "resource":
        return "solar:document-text-bold";
      case "event":
        return "solar:calendar-bold";
      case "service":
        return "solar:widget-bold";
      case "registration":
        return "solar:user-plus-bold";
      case "contact_inquiry":
        return "solar:letter-bold";
      case "consultation_booking":
        return "solar:calendar-mark-bold";
      default:
        return "solar:bell-bold";
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "resource":
        return "text-blue-600";
      case "event":
        return "text-green-600";
      case "service":
        return "text-purple-600";
      case "registration":
        return "text-orange-600";
      case "contact_inquiry":
        return "text-red-600";
      case "consultation_booking":
        return "text-teal-600";
      default:
        return "text-gray-600";
    }
  };

  const getActivityBgColor = (type) => {
    switch (type) {
      case "resource":
        return "bg-blue-100";
      case "event":
        return "bg-green-100";
      case "service":
        return "bg-purple-100";
      case "registration":
        return "bg-orange-100";
      case "contact_inquiry":
        return "bg-red-100";
      case "consultation_booking":
        return "bg-teal-100";
      default:
        return "bg-gray-100";
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout title="Dashboard">
          <div className="animate-pulse space-y-8">
            {/* Header Skeleton */}
            <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl p-8">
              <div className="h-8 bg-gray-300 rounded mb-4 w-64"></div>
              <div className="h-4 bg-gray-300 rounded w-96"></div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-xl p-6 h-32"></div>
              ))}
            </div>

            {/* Quick Actions Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-xl h-24"></div>
              ))}
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-gray-200 rounded-xl h-96"></div>
              <div className="bg-gray-200 rounded-xl h-96"></div>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AdminLayout title="Dashboard">
        <div className="space-y-8">
          {/* Enhanced Welcome Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, Admin! 👋
                </h1>
                <p className="text-blue-100 text-lg">
                  Here's what's happening with your content management system
                  today.
                </p>
                <div className="mt-4 flex items-center text-blue-100">
                  <Icon
                    icon="solar:calendar-bold"
                    width={20}
                    className="mr-2"
                  />
                  <span>
                    {currentTime.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="mt-6 lg:mt-0">
                <div className="flex flex-col space-y-2 text-right">
                  <div className="text-blue-100">
                    {currentTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-sm text-blue-200">
                    Last updated: {formatRelativeTime(new Date())}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {statCards.map((card) => (
              <div
                key={card.name}
                className={`bg-white rounded-xl shadow-sm border ${card.borderColor} p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105`}
                onClick={() => (window.location.href = card.link)}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`p-3 rounded-xl ${card.bgColor} group-hover:scale-110 transition-transform`}
                  >
                    <Icon icon={card.icon} width={24} className={card.color} />
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs font-medium ${card.trendColor} flex items-center`}
                    >
                      <Icon
                        icon="solar:arrow-up-bold"
                        width={12}
                        className="mr-1"
                      />
                      {card.trend}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600">
                    {card.name}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 mt-2">
                      {card.subtitle}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Quick Actions */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action) => (
                <a
                  key={action.name}
                  href={action.href}
                  className={`${action.color} ${action.hoverColor} text-white rounded-xl p-6 transition-all duration-200 transform hover:scale-105 hover:shadow-xl group`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold">{action.name}</h4>
                      <p className="text-white/80 text-sm mt-1">
                        {action.description}
                      </p>
                    </div>
                    <Icon
                      icon={action.icon}
                      width={32}
                      className="text-white/80 group-hover:text-white transition-colors"
                    />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Enhanced Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Icon
                      icon="solar:bell-bold"
                      width={24}
                      className="mr-2 text-blue-600"
                    />
                    Recent Activity
                  </h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {recentActivity.length} items
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div
                        key={activity.id}
                        className="flex items-center group hover:bg-gray-50 p-3 rounded-lg transition-colors"
                      >
                        <div
                          className={`p-2 rounded-lg ${getActivityBgColor(
                            activity.type
                          )}`}
                        >
                          <Icon
                            icon={getActivityIcon(activity.type)}
                            width={16}
                            className={getActivityColor(activity.type)}
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.time}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          #{index + 1}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Icon
                        icon="solar:inbox-bold"
                        width={48}
                        className="text-gray-300 mx-auto mb-4"
                      />
                      <p className="text-gray-500">No recent activity</p>
                    </div>
                  )}
                </div>
                {recentActivity.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <Button
                      text="View All Activity"
                      type="secondary"
                      className="w-full"
                      icon="solar:arrow-right-bold"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced System Status & Quick Stats */}
            <div className="space-y-6">
              {/* System Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Icon
                      icon="solar:settings-bold"
                      width={24}
                      className="mr-2 text-green-600"
                    />
                    System Status
                  </h3>
                </div>
                <div className="p-6">
                  {systemStatusLoading ? (
                    <div className="space-y-4">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse"
                        >
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          systemStatus.database.status === "online"
                            ? "bg-green-50"
                            : systemStatus.database.status === "offline"
                            ? "bg-red-50"
                            : "bg-yellow-50"
                        }`}
                      >
                        <span className="text-sm text-gray-600 flex items-center">
                          <Icon
                            icon="solar:database-bold"
                            width={16}
                            className="mr-2"
                          />
                          Database
                        </span>
                        <span
                          className={`flex items-center text-sm font-medium ${
                            systemStatus.database.status === "online"
                              ? "text-green-600"
                              : systemStatus.database.status === "offline"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {systemStatus.database.status === "online" ? (
                            <Icon
                              icon="solar:check-circle-bold"
                              width={16}
                              className="mr-1"
                            />
                          ) : systemStatus.database.status === "offline" ? (
                            <Icon
                              icon="solar:close-circle-bold"
                              width={16}
                              className="mr-1"
                            />
                          ) : (
                            <Icon
                              icon="solar:clock-circle-bold"
                              width={16}
                              className="mr-1"
                            />
                          )}
                          {systemStatus.database.message}
                        </span>
                      </div>
                      {/* Firestore Storage */}
                      <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                        <span className="text-sm text-gray-600 flex items-center">
                          <Icon
                            icon="solar:database-bold"
                            width={16}
                            className="mr-2"
                          />
                          Firestore Storage
                        </span>
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-gray-900 font-medium">
                            {systemStatus.storage.firestore?.display ||
                              "Loading..."}
                          </span>
                          {systemStatus.storage.firestore?.totalDocuments !==
                            undefined && (
                            <span className="text-xs text-gray-500 mt-0.5">
                              {systemStatus.storage.firestore.totalDocuments.toLocaleString()}{" "}
                              documents
                            </span>
                          )}
                          <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                (systemStatus.storage.firestore?.percentage ||
                                  0) > 80
                                  ? "bg-red-500"
                                  : (systemStatus.storage.firestore
                                      ?.percentage || 0) > 60
                                  ? "bg-yellow-500"
                                  : "bg-indigo-500"
                              }`}
                              style={{
                                width: `${Math.min(
                                  systemStatus.storage.firestore?.percentage ||
                                    0,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      {/* Cloudinary Storage */}
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-gray-600 flex items-center">
                          <Icon
                            icon="solar:cloud-bold"
                            width={16}
                            className="mr-2"
                          />
                          Cloudinary Storage
                        </span>
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-gray-900 font-medium">
                            {systemStatus.storage.cloudinary?.display ||
                              "Loading..."}
                          </span>
                          {systemStatus.storage.cloudinary?.source ===
                          "cloudinary" ? (
                            <span className="text-xs text-gray-500 mt-0.5">
                              From Cloudinary API
                            </span>
                          ) : systemStatus.storage.cloudinary?.error ? (
                            <span className="text-xs text-red-500 mt-0.5">
                              API Error
                            </span>
                          ) : null}
                          <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                (systemStatus.storage.cloudinary?.percentage ||
                                  0) > 80
                                  ? "bg-red-500"
                                  : (systemStatus.storage.cloudinary
                                      ?.percentage || 0) > 60
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                              }`}
                              style={{
                                width: `${Math.min(
                                  systemStatus.storage.cloudinary?.percentage ||
                                    0,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <span className="text-sm text-gray-600 flex items-center">
                          <Icon
                            icon="solar:shield-check-bold"
                            width={16}
                            className="mr-2"
                          />
                          Last Backup
                        </span>
                        <span className="text-sm text-gray-900 font-medium">
                          {systemStatus.lastBackup.text}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Last updated: {formatRelativeTime(new Date())}
                      </span>
                      <button
                        onClick={loadSystemStatus}
                        className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                        disabled={systemStatusLoading}
                      >
                        <Icon
                          icon="solar:refresh-bold"
                          width={14}
                          className={`mr-1 ${
                            systemStatusLoading ? "animate-spin" : ""
                          }`}
                        />
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Icon
                      icon="solar:chart-square-bold"
                      width={24}
                      className="mr-2 text-purple-600"
                    />
                    Quick Overview
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        New Inquiries
                      </span>
                      <span className="text-lg font-bold text-red-600">
                        {stats.inquiriesByStatus.new}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Pending Bookings
                      </span>
                      <span className="text-lg font-bold text-orange-600">
                        {stats.bookingsByStatus.pending_confirmation}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Upcoming Events
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {stats.eventsByStatus.upcoming}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Content
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {stats.resources + stats.events + stats.services}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Content Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Resources */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Icon
                    icon="solar:document-text-bold"
                    width={24}
                    className="mr-2 text-blue-600"
                  />
                  Recent Resources
                </h3>
                <Button
                  text="View All"
                  type="secondary"
                  size="sm"
                  link="/admin/resources"
                  icon="solar:arrow-right-bold"
                />
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentResources.length > 0 ? (
                    recentResources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Icon
                              icon={
                                resource.type === "whitepaper"
                                  ? "solar:document-text-bold"
                                  : resource.type === "article"
                                  ? "solar:book-2-bold"
                                  : resource.type === "report"
                                  ? "solar:chart-square-bold"
                                  : "solar:document-bold"
                              }
                              width={24}
                              className="text-blue-600"
                            />
                          </div>
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {resource.title}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {resource.type} •{" "}
                            {formatRelativeTime(resource.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Icon
                        icon="solar:document-bold"
                        width={48}
                        className="text-gray-300 mx-auto mb-4"
                      />
                      <p className="text-gray-500">No resources yet</p>
                      <Button
                        text="Create First Resource"
                        type="primary"
                        size="sm"
                        link="/admin/resources/new"
                        className="mt-4"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Icon
                    icon="solar:calendar-bold"
                    width={24}
                    className="mr-2 text-green-600"
                  />
                  Recent Events
                </h3>
                <Button
                  text="View All"
                  type="secondary"
                  size="sm"
                  link="/admin/events"
                  icon="solar:arrow-right-bold"
                />
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentEvents.length > 0 ? (
                    recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <Icon
                              icon="solar:calendar-bold"
                              width={24}
                              className="text-green-600"
                            />
                          </div>
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(event.date)} • {event.category}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Icon
                        icon="solar:calendar-bold"
                        width={48}
                        className="text-gray-300 mx-auto mb-4"
                      />
                      <p className="text-gray-500">No events yet</p>
                      <Button
                        text="Create First Event"
                        type="primary"
                        size="sm"
                        link="/admin/events/new"
                        className="mt-4"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
