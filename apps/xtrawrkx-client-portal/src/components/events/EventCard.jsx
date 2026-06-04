"use client";

import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Ticket,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Star,
  ArrowRight,
  Camera,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import ModernButton from "@/components/ui/ModernButton";

export default function EventCard({
  event,
  selected = false,
  onClick,
  onViewWebsite,
  onOpenGallery,
}) {
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

  const getTicketTypeColor = (type) => {
    switch (type) {
      case "VIP":
        return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white";
      case "Premium":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
      case "Standard":
        return "bg-blue-100 text-blue-800";
      case "Free":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRegistrationIcon = (status) => {
    switch (status) {
      case "confirmed":
        return CheckCircle;
      case "pending":
        return AlertCircle;
      case "attended":
        return CheckCircle;
      case "cancelled":
        return AlertCircle;
      case "not_registered":
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const RegistrationIcon = getRegistrationIcon(event.registrationStatus);

  return (
    <div>
      <div
        className={`cursor-pointer rounded-2xl bg-gradient-to-br from-white/80 to-white/50 backdrop-blur-xl border shadow-md transition-all duration-300 overflow-hidden hover:shadow-lg ${
          selected
            ? "border-xtrawrkx-400 ring-2 ring-xtrawrkx-500/25"
            : "border-white/40 hover:border-xtrawrkx-200/60"
        }`}
        onClick={onClick}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">
                  {event.title}
                </h3>
                <Badge className={getTicketTypeColor(event.ticketType)}>
                  {event.ticketType}
                </Badge>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {event.description}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={getStatusColor(event.status)}>
                {event.status}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <RegistrationIcon className="h-4 w-4" />
                <span className="capitalize">
                  {event.registrationStatus === "not_registered"
                    ? "Not Registered"
                    : event.registrationStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="truncate">{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4 text-gray-400" />
              <span>
                {event.registered}/{event.capacity}
              </span>
            </div>
          </div>

          {/* Price and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Ticket className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {event.price}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-gray-600">{event.category}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ModernButton
                type="tertiary"
                size="sm"
                text="View Website"
                icon={ExternalLink}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewWebsite();
                }}
                className="text-xs"
              />
              {event.status === "completed" && onOpenGallery && (
                <ModernButton
                  type="secondary"
                  size="sm"
                  text="Gallery"
                  icon={Camera}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenGallery(event);
                  }}
                  className="text-xs"
                />
              )}
              {event.registrationStatus === "not_registered" ? (
                <ModernButton
                  type="primary"
                  size="sm"
                  text="Register Now"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (event.websiteUrl) {
                      window.open(event.websiteUrl, "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="text-xs"
                />
              ) : (
                <div className="flex items-center text-gray-400">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
