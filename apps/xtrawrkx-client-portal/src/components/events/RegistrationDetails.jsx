"use client";

import { motion } from "framer-motion";
import {
  User,
  CreditCard,
  AlertCircle,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function RegistrationDetails({ event }) {
  const editedDetails = event.registrationDetails || {};

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // If no registration details, show registration prompt
  if (!event.registrationDetails) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Not Registered
          </h3>
          <p className="text-gray-500 mb-6">
            You haven&apos;t registered for this event yet. Register on the
            xtrawrkx website to secure your spot.
          </p>
          {event.websiteUrl && (
            <a
              href={`${event.websiteUrl}/register`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-xtrawrkx-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-xtrawrkx-700 w-full"
            >
              Register Now
            </a>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-4">
        {/* Registration Status */}
        <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-900">
              Registration Status
            </span>
          </div>
          <Badge className="bg-green-100 text-green-800 capitalize">
            {event.registrationStatus}
          </Badge>
        </div>

        {/* Registration ID */}
        {editedDetails.registrationId && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-gray-500">Registration ID</span>
              <span className="text-xs font-mono font-medium text-gray-900 break-all">
                {editedDetails.registrationId}
              </span>
            </div>
          </div>
        )}

        {/* Company */}
        {editedDetails.companyName && (
          <div className="space-y-1">
            <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <User className="h-3 w-3" /> Company
            </label>
            <p className="text-sm font-medium text-gray-900">
              {editedDetails.companyName}
            </p>
          </div>
        )}

        {/* Payment Information */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </h4>

          <div className="space-y-2 rounded-lg bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Status</span>
              <Badge
                className={getPaymentStatusColor(
                  editedDetails.paymentStatus
                )}
              >
                {editedDetails.isFree
                  ? "Free"
                  : editedDetails.paymentStatus || "—"}
              </Badge>
            </div>

            {!editedDetails.isFree && editedDetails.totalCost != null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{Number(editedDetails.totalCost).toLocaleString()}
                </span>
              </div>
            )}

            {editedDetails.registeredAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Registered on</span>
                <span className="text-sm text-gray-900">
                  {formatDate(editedDetails.registeredAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Visit on website */}
        {event.websiteUrl && (
          <div className="pt-2 border-t border-gray-200">
            <a
              href={event.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              View event on website ↗
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}
