"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Ticket,
  Edit,
  Eye,
  ExternalLink,
  Filter,
  Search,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Star,
  Download,
  QrCode,
} from "lucide-react";
import ModernButton from "@/components/ui/ModernButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import EventCard from "@/components/events/EventCard";
import RegistrationDetails from "@/components/events/RegistrationDetails";
import VirtualTicket from "@/components/events/VirtualTicket";
import EventGalleryModal from "@/components/events/EventGalleryModal";

// Mock data for events
const mockEvents = [
  {
    id: 1,
    title: "XEN Annual Conference 2024",
    description:
      "Join us for the biggest entrepreneurship conference of the year featuring industry leaders, networking opportunities, and exclusive workshops.",
    date: "2024-03-15",
    time: "09:00 AM",
    location: "Convention Center, Downtown",
    category: "Conference",
    status: "upcoming",
    registrationStatus: "confirmed",
    ticketType: "VIP",
    price: "$299",
    capacity: 500,
    registered: 342,
    image: "/images/events/conference.jpg",
    websiteUrl: "https://xtrawrkx.com/events/xen-conference-2024",
    registrationDetails: {
      registrationId: "REG-2024-001",
      attendeeName: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      dietaryRequirements: "Vegetarian",
      emergencyContact: "Jane Doe - +1 (555) 987-6543",
      specialRequests: "Wheelchair accessible seating",
      registrationDate: "2024-01-15",
      paymentStatus: "paid",
      paymentMethod: "Credit Card",
      ticketNumber: "TKT-2024-001",
    },
  },
  {
    id: 2,
    title: "XEV.FiN Investment Workshop",
    description:
      "Learn advanced investment strategies and portfolio management techniques from financial experts.",
    date: "2024-02-28",
    time: "02:00 PM",
    location: "Financial District, Suite 200",
    category: "Workshop",
    status: "upcoming",
    registrationStatus: "confirmed",
    ticketType: "Standard",
    price: "$149",
    capacity: 50,
    registered: 28,
    image: "/images/events/workshop.jpg",
    websiteUrl: "https://xtrawrkx.com/events/investment-workshop",
    registrationDetails: {
      registrationId: "REG-2024-002",
      attendeeName: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      dietaryRequirements: "None",
      emergencyContact: "Jane Doe - +1 (555) 987-6543",
      specialRequests: "None",
      registrationDate: "2024-01-20",
      paymentStatus: "paid",
      paymentMethod: "PayPal",
      ticketNumber: "TKT-2024-002",
    },
  },
  {
    id: 3,
    title: "XEVTG Tech Meetup",
    description:
      "Monthly tech meetup featuring the latest trends in software development and AI.",
    date: "2024-01-20",
    time: "06:00 PM",
    location: "Tech Hub, Innovation Center",
    category: "Meetup",
    status: "completed",
    registrationStatus: "attended",
    ticketType: "Free",
    price: "Free",
    capacity: 100,
    registered: 89,
    image: "/images/events/meetup.jpg",
    websiteUrl: "https://xtrawrkx.com/events/tech-meetup-jan",
    registrationDetails: {
      registrationId: "REG-2024-003",
      attendeeName: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      dietaryRequirements: "None",
      emergencyContact: "Jane Doe - +1 (555) 987-6543",
      specialRequests: "None",
      registrationDate: "2024-01-10",
      paymentStatus: "paid",
      paymentMethod: "Free Event",
      ticketNumber: "TKT-2024-003",
    },
  },
  {
    id: 4,
    title: "XEN Leadership Summit 2024",
    description:
      "Exclusive leadership summit for entrepreneurs and business leaders featuring keynote speakers and networking sessions.",
    date: "2024-04-10",
    time: "08:00 AM",
    location: "Grand Hotel, Business District",
    category: "Conference",
    status: "upcoming",
    registrationStatus: "confirmed",
    ticketType: "Premium",
    price: "$499",
    capacity: 200,
    registered: 156,
    image: "/images/events/summit.jpg",
    websiteUrl: "https://xtrawrkx.com/events/leadership-summit-2024",
    registrationDetails: {
      registrationId: "REG-2024-004",
      attendeeName: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      dietaryRequirements: "Gluten-free",
      emergencyContact: "Jane Doe - +1 (555) 987-6543",
      specialRequests: "Vegetarian meal preference",
      registrationDate: "2024-02-01",
      paymentStatus: "paid",
      paymentMethod: "Credit Card",
      ticketNumber: "TKT-2024-004",
    },
  },
  {
    id: 5,
    title: "XEV.FiN Crypto Workshop",
    description:
      "Learn about cryptocurrency trading, DeFi protocols, and blockchain technology from industry experts.",
    date: "2023-12-15",
    time: "10:00 AM",
    location: "Financial Center, Suite 500",
    category: "Workshop",
    status: "completed",
    registrationStatus: "attended",
    ticketType: "Standard",
    price: "$199",
    capacity: 75,
    registered: 68,
    image: "/images/events/crypto-workshop.jpg",
    websiteUrl: "https://xtrawrkx.com/events/crypto-workshop-dec",
    registrationDetails: {
      registrationId: "REG-2023-005",
      attendeeName: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      dietaryRequirements: "None",
      emergencyContact: "Jane Doe - +1 (555) 987-6543",
      specialRequests: "None",
      registrationDate: "2023-11-20",
      paymentStatus: "paid",
      paymentMethod: "PayPal",
      ticketNumber: "TKT-2023-005",
    },
  },
  {
    id: 6,
    title: "XEN Innovation Summit 2024",
    description:
      "Discover the latest innovations in technology, entrepreneurship, and sustainable business practices.",
    date: "2024-05-20",
    time: "09:00 AM",
    location: "Innovation Center, Tech District",
    category: "Conference",
    status: "upcoming",
    registrationStatus: "not_registered",
    ticketType: "Premium",
    price: "$399",
    capacity: 300,
    registered: 156,
    image: "/images/events/innovation-summit.jpg",
    websiteUrl: "https://xtrawrkx.com/events/innovation-summit-2024",
    registrationDetails: null,
  },
  {
    id: 7,
    title: "XEV.FiN Trading Masterclass",
    description:
      "Advanced trading strategies and risk management techniques for professional traders.",
    date: "2024-04-05",
    time: "02:00 PM",
    location: "Trading Floor, Financial District",
    category: "Workshop",
    status: "upcoming",
    registrationStatus: "not_registered",
    ticketType: "VIP",
    price: "$599",
    capacity: 25,
    registered: 8,
    image: "/images/events/trading-masterclass.jpg",
    websiteUrl: "https://xtrawrkx.com/events/trading-masterclass",
    registrationDetails: null,
  },
  {
    id: 8,
    title: "XEVTG Developer Meetup",
    description:
      "Monthly meetup for developers featuring talks on modern web technologies and open source projects.",
    date: "2024-03-25",
    time: "06:30 PM",
    location: "Developer Hub, Downtown",
    category: "Meetup",
    status: "upcoming",
    registrationStatus: "not_registered",
    ticketType: "Free",
    price: "Free",
    capacity: 80,
    registered: 45,
    image: "/images/events/dev-meetup.jpg",
    websiteUrl: "https://xtrawrkx.com/events/dev-meetup-mar",
    registrationDetails: null,
  },
];

const filterOptions = [
  { value: "all", label: "All Events" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "conference", label: "Conferences" },
  { value: "workshop", label: "Workshops" },
  { value: "meetup", label: "Meetups" },
];

export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [eventCategoryTab, setEventCategoryTab] = useState("my-events");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryEvent, setGalleryEvent] = useState(null);

  const filteredEvents = mockEvents.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by event category tab
    let matchesCategoryTab = true;
    if (eventCategoryTab === "my-events") {
      matchesCategoryTab =
        event.registrationStatus === "confirmed" ||
        event.registrationStatus === "attended";
    } else if (eventCategoryTab === "all-events") {
      matchesCategoryTab = true; // Show all events
    } else if (eventCategoryTab === "past-events") {
      matchesCategoryTab = event.status === "completed";
    }

    const matchesFilter =
      filterStatus === "all" ||
      event.status === filterStatus ||
      event.category.toLowerCase() === filterStatus;

    return matchesSearch && matchesCategoryTab && matchesFilter;
  });

  const handleOpenGallery = (event) => {
    setGalleryEvent(event);
    setShowGalleryModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRegistrationStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "attended":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                Events
              </h1>
              <p className="text-gray-600 text-lg">
                {eventCategoryTab === "my-events" &&
                  "Manage your event registrations and access virtual tickets"}
                {eventCategoryTab === "all-events" &&
                  "Browse all available events and register"}
                {eventCategoryTab === "past-events" &&
                  "View past events and access photo galleries"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold">
                {mockEvents.length} Events
              </div>
            </div>
          </motion.div>
        </div>

        {/* Event Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-8">
            <div className="flex items-center space-x-2 mb-6">
              <button
                onClick={() => setEventCategoryTab("my-events")}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  eventCategoryTab === "my-events"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-white/80 text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  My Events
                  <span className="bg-white/20 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                    {
                      mockEvents.filter(
                        (e) =>
                          e.registrationStatus === "confirmed" ||
                          e.registrationStatus === "attended"
                      ).length
                    }
                  </span>
                </div>
              </button>
              <button
                onClick={() => setEventCategoryTab("all-events")}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  eventCategoryTab === "all-events"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-white/80 text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  All Events
                  <span className="bg-white/20 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                    {mockEvents.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setEventCategoryTab("past-events")}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  eventCategoryTab === "past-events"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-white/80 text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Past Events
                  <span className="bg-white/20 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                    {mockEvents.filter((e) => e.status === "completed").length}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/80 border border-gray-200/50 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-6 py-3 bg-white/80 border border-gray-200/50 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200"
                  >
                    <Filter className="h-4 w-4" />
                    Filter
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
                    />
                  </button>
                  {showFilters && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                      {filterOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFilterStatus(option.value);
                            setShowFilters(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                            filterStatus === option.value
                              ? "bg-blue-50 text-blue-700"
                              : ""
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Events List */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {eventCategoryTab === "my-events" && "My Events"}
                      {eventCategoryTab === "all-events" && "All Events"}
                      {eventCategoryTab === "past-events" && "Past Events"}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {eventCategoryTab === "my-events" &&
                        "Events you're registered for"}
                      {eventCategoryTab === "all-events" &&
                        "Browse and register for events"}
                      {eventCategoryTab === "past-events" &&
                        "Events you've attended with photo galleries"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-semibold">
                      {
                        filteredEvents.filter((e) => e.status === "upcoming")
                          .length
                      }{" "}
                      Upcoming
                    </div>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-semibold">
                      {
                        filteredEvents.filter((e) => e.status === "completed")
                          .length
                      }{" "}
                      Completed
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    >
                      <EventCard
                        event={event}
                        onClick={() => {
                          setSelectedEvent(event);
                          setActiveTab("details");
                        }}
                        onViewWebsite={() =>
                          window.open(event.websiteUrl, "_blank")
                        }
                        onOpenGallery={handleOpenGallery}
                      />
                    </motion.div>
                  ))}
                </div>

                {filteredEvents.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {eventCategoryTab === "my-events" &&
                        "No registered events"}
                      {eventCategoryTab === "all-events" &&
                        "No events available"}
                      {eventCategoryTab === "past-events" && "No past events"}
                    </h3>
                    <p className="text-gray-500">
                      {eventCategoryTab === "my-events" &&
                        "You haven't registered for any events yet"}
                      {eventCategoryTab === "all-events" &&
                        "There are no events available"}
                      {eventCategoryTab === "past-events" &&
                        "You haven't attended any events yet"}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Event Details Sidebar */}
          <div className="lg:col-span-1">
            {selectedEvent ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="sticky top-6"
              >
                <div className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Event Details
                    </h3>
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex space-x-2 mb-6">
                    <button
                      onClick={() => setActiveTab("details")}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        activeTab === "details"
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-white/80 text-gray-600 hover:bg-white hover:text-gray-900"
                      }`}
                    >
                      {selectedEvent.registrationStatus === "not_registered"
                        ? "Registration"
                        : "Registration Details"}
                    </button>
                    {selectedEvent.registrationStatus !== "not_registered" && (
                      <button
                        onClick={() => setActiveTab("ticket")}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          activeTab === "ticket"
                            ? "bg-blue-500 text-white shadow-md"
                            : "bg-white/80 text-gray-600 hover:bg-white hover:text-gray-900"
                        }`}
                      >
                        Ticket
                      </button>
                    )}
                  </div>

                  {/* Tab Content */}
                  {activeTab === "details" && (
                    <RegistrationDetails
                      event={selectedEvent}
                      onEdit={() => {
                        // Handle edit registration
                      }}
                    />
                  )}

                  {activeTab === "ticket" &&
                    selectedEvent.registrationStatus !== "not_registered" && (
                      <VirtualTicket
                        event={selectedEvent}
                        onDownload={() => {
                          // Handle ticket download
                        }}
                      />
                    )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="sticky top-6"
              >
                <div className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-8">
                  <div className="text-center py-8">
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select an Event
                    </h3>
                    <p className="text-gray-500">
                      Click on any event to view registration details and access
                      your virtual ticket
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      <EventGalleryModal
        event={galleryEvent}
        isOpen={showGalleryModal}
        onClose={() => {
          setShowGalleryModal(false);
          setGalleryEvent(null);
        }}
      />
    </div>
  );
}
