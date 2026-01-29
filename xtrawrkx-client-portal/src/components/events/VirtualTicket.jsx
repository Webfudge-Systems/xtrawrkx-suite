"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  QrCode,
  Download,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  User,
  Mail,
  Phone,
  CheckCircle,
  Star,
  Copy,
  Share2,
  Smartphone,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import ModernButton from "@/components/ui/ModernButton";

export default function VirtualTicket({ event, onDownload }) {
  const [showQRCode, setShowQRCode] = useState(true);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const getTicketTypeColor = (type) => {
    switch (type) {
      case "VIP":
        return "bg-gradient-to-r from-yellow-400 to-orange-500";
      case "Premium":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "Standard":
        return "bg-gradient-to-r from-blue-500 to-blue-600";
      case "Free":
        return "bg-gradient-to-r from-gray-500 to-gray-600";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You might want to show a toast notification here
  };

  const shareTicket = () => {
    if (navigator.share) {
      navigator.share({
        title: `My ticket for ${event.title}`,
        text: `I'm attending ${event.title} on ${formatDate(event.date)}!`,
        url: window.location.href,
      });
    } else {
      // Fallback to copying URL
      copyToClipboard(window.location.href);
    }
  };

  // Generate a simple QR code placeholder (in a real app, you'd use a QR code library)
  const generateQRCode = () => {
    return `QR-${event.registrationDetails.ticketNumber}-${event.id}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-4">
        {/* Ticket Header */}
        <div className="text-center">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold mb-2 ${getTicketTypeColor(event.ticketType)}`}
          >
            <Ticket className="h-4 w-4" />
            {event.ticketType} Ticket
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {event.title}
          </h3>
          <p className="text-sm text-gray-600">
            Ticket #{event.registrationDetails.ticketNumber}
          </p>
        </div>

        {/* QR Code Section */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  Digital Ticket
                </span>
              </div>

              {showQRCode ? (
                <div className="bg-white rounded-lg p-4 inline-block shadow-sm">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    <div className="text-xs text-gray-500 text-center">
                      <QrCode className="h-16 w-16 mx-auto mb-1 text-gray-400" />
                      <div className="font-mono text-xs">
                        {generateQRCode()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-4 inline-block shadow-sm">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Smartphone className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <div className="text-xs text-gray-500">
                        Show this ticket at entry
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3">
                <button
                  onClick={() => setShowQRCode(!showQRCode)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  {showQRCode ? "Hide QR Code" : "Show QR Code"}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Details */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Event Details
          </h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Date</span>
              <span className="text-sm font-medium text-gray-900">
                {formatDate(event.date)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Time</span>
              <span className="text-sm font-medium text-gray-900">
                {formatTime(event.time)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Location</span>
              <span className="text-sm font-medium text-gray-900 text-right max-w-32 truncate">
                {event.location}
              </span>
            </div>
          </div>
        </div>

        {/* Attendee Information */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <User className="h-4 w-4" />
            Attendee Information
          </h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Name</span>
              <span className="text-sm font-medium text-gray-900">
                {event.registrationDetails.attendeeName}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Email</span>
              <span className="text-sm font-medium text-gray-900 text-right max-w-32 truncate">
                {event.registrationDetails.email}
              </span>
            </div>
          </div>
        </div>

        {/* Ticket Status */}
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Ticket Valid
            </span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            This ticket is valid for entry to the event
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <ModernButton
            type="primary"
            size="sm"
            text="Download Ticket"
            icon={Download}
            onClick={onDownload}
            className="w-full"
          />

          <div className="grid grid-cols-2 gap-2">
            <ModernButton
              type="secondary"
              size="sm"
              text="Copy Ticket ID"
              icon={Copy}
              onClick={() =>
                copyToClipboard(event.registrationDetails.ticketNumber)
              }
              className="text-xs"
            />
            <ModernButton
              type="secondary"
              size="sm"
              text="Share"
              icon={Share2}
              onClick={shareTicket}
              className="text-xs"
            />
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <div className="flex items-start gap-2">
            <Star className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="text-sm font-medium text-yellow-800 mb-1">
                Important Notes
              </h5>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Present this ticket at the event entrance</li>
                <li>• Keep your phone charged for QR code scanning</li>
                <li>• Arrive 15 minutes before the event starts</li>
                <li>• Contact support if you have any issues</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
