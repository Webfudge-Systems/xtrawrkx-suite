"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle,
  Edit,
  Save,
  X,
  AlertCircle,
  MapPin,
  Clock,
  Ticket,
  Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import ModernButton from "@/components/ui/ModernButton";

export default function RegistrationDetails({ event, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState(
    event.registrationDetails || {}
  );

  const handleSave = () => {
    // Here you would typically save the changes to your backend
    setIsEditing(false);
    // You might want to show a success message here
  };

  const handleCancel = () => {
    setEditedDetails(event.registrationDetails);
    setIsEditing(false);
  };

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
            You haven't registered for this event yet. Click "Register Now" to
            secure your spot.
          </p>
          <ModernButton
            type="primary"
            size="md"
            text="Register Now"
            onClick={() => {
            }}
            className="w-full"
          />
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="font-medium text-gray-900">
              Registration Status
            </span>
          </div>
          <Badge className="bg-green-100 text-green-800">
            {event.registrationStatus}
          </Badge>
        </div>

        {/* Registration ID */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Registration ID</span>
            <span className="text-sm font-mono font-medium text-gray-900">
              {editedDetails.registrationId}
            </span>
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal Information
          </h4>

          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Full Name
              </label>
              {isEditing ? (
                <Input
                  value={editedDetails.attendeeName}
                  onChange={(e) =>
                    setEditedDetails({
                      ...editedDetails,
                      attendeeName: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">
                  {editedDetails.attendeeName}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Email Address
              </label>
              {isEditing ? (
                <Input
                  type="email"
                  value={editedDetails.email}
                  onChange={(e) =>
                    setEditedDetails({
                      ...editedDetails,
                      email: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                  <Mail className="h-3 w-3 text-gray-400" />
                  {editedDetails.email}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Phone Number
              </label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={editedDetails.phone}
                  onChange={(e) =>
                    setEditedDetails({
                      ...editedDetails,
                      phone: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                  <Phone className="h-3 w-3 text-gray-400" />
                  {editedDetails.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Event Preferences */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Event Preferences
          </h4>

          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Dietary Requirements
              </label>
              {isEditing ? (
                <Input
                  value={editedDetails.dietaryRequirements}
                  onChange={(e) =>
                    setEditedDetails({
                      ...editedDetails,
                      dietaryRequirements: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">
                  {editedDetails.dietaryRequirements}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Special Requests
              </label>
              {isEditing ? (
                <Input
                  value={editedDetails.specialRequests}
                  onChange={(e) =>
                    setEditedDetails({
                      ...editedDetails,
                      specialRequests: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">
                  {editedDetails.specialRequests}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Emergency Contact
          </h4>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">
              Contact Information
            </label>
            {isEditing ? (
              <Input
                value={editedDetails.emergencyContact}
                onChange={(e) =>
                  setEditedDetails({
                    ...editedDetails,
                    emergencyContact: e.target.value,
                  })
                }
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-900 mt-1">
                {editedDetails.emergencyContact}
              </p>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Information
          </h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Status</span>
              <Badge
                className={getPaymentStatusColor(editedDetails.paymentStatus)}
              >
                {editedDetails.paymentStatus}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Method</span>
              <span className="text-sm text-gray-900">
                {editedDetails.paymentMethod}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Registration Date</span>
              <span className="text-sm text-gray-900">
                {formatDate(editedDetails.registrationDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200">
          {isEditing ? (
            <div className="flex gap-2">
              <ModernButton
                type="success"
                size="sm"
                text="Save Changes"
                icon={Save}
                onClick={handleSave}
                className="flex-1"
              />
              <ModernButton
                type="secondary"
                size="sm"
                text="Cancel"
                icon={X}
                onClick={handleCancel}
                className="flex-1"
              />
            </div>
          ) : (
            <ModernButton
              type="secondary"
              size="sm"
              text="Edit Registration"
              icon={Edit}
              onClick={() => setIsEditing(true)}
              className="w-full"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
