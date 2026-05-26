"use client";
import { useState } from "react";
import { Icon } from "@iconify/react";
import Button from "./Button";
import { commonToasts, toastUtils } from "@/src/utils/toast";

const consultationTypes = [
  {
    id: "free-consultation",
    title: "Free Consultation Call",
    duration: "30 minutes",
    description:
      "Initial discussion to understand your needs and explore opportunities",
    icon: "solar:chat-dots-bold",
    price: "Free",
  },
  {
    id: "business-consultation",
    title: "Business Consultation Call",
    duration: "45 minutes",
    description:
      "Focused consultation on specific business challenges or opportunities",
    icon: "solar:phone-bold",
    price: "Free",
  },
  {
    id: "technical-consultation",
    title: "Technical Consultation Call",
    duration: "60 minutes",
    description:
      "In-depth technical discussion about solutions, integrations, or development",
    icon: "solar:laptop-bold",
    price: "Free",
  },
];

const timeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
];

const purposes = [
  "Business Development Discussion",
  "Technical Solution Consultation",
  "Partnership Opportunities",
  "Service Requirements Discussion",
  "Project Consultation",
  "Community Collaboration",
  "Investment & Funding Discussion",
  "General Inquiry",
  "Other",
];

const BookMeetModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Consultation Type
    consultationType: "",

    // Step 2: Contact Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",

    // Step 3: Meeting Details
    purpose: "",
    preferredDate: "",
    preferredTime: "",
    alternativeDate: "",
    alternativeTime: "",
    timezone: "EST",
    meetingMode: "video", // video, phone, in-person

    // Step 4: Additional Information
    agenda: "",
    participants: 1,
    specialRequests: "",

    // Preferences
    newsletter: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.consultationType)
          newErrors.consultationType = "Please select a consultation type";
        break;

      case 2:
        if (!formData.firstName.trim())
          newErrors.firstName = "First name is required";
        if (!formData.lastName.trim())
          newErrors.lastName = "Last name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.phone.trim())
          newErrors.phone = "Phone number is required";

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        }
        break;

      case 3:
        if (!formData.purpose) newErrors.purpose = "Please select a purpose";
        if (!formData.preferredDate)
          newErrors.preferredDate = "Please select a preferred date";
        if (!formData.preferredTime)
          newErrors.preferredTime = "Please select a preferred time";
        break;

      case 4:
        // Optional validation for final step
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toastUtils.validationError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toastUtils.loading("Booking your consultation...");

    try {
      // Submit consultation booking to API
      const response = await fetch("/api/book-consultation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Show success and close modal
        toastUtils.update(
          loadingToast,
          "success",
          "Consultation request submitted successfully! You'll receive a confirmation email once we review and confirm your booking."
        );
        onClose();

        // Reset form
        setFormData({
          consultationType: "",
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          company: "",
          jobTitle: "",
          purpose: "",
          preferredDate: "",
          preferredTime: "",
          alternativeDate: "",
          alternativeTime: "",
          timezone: "EST",
          meetingMode: "video",
          agenda: "",
          participants: 1,
          specialRequests: "",
          newsletter: false,
        });
        setCurrentStep(1);
      } else {
        throw new Error(result.error || "Failed to book consultation");
      }
    } catch (error) {
      toastUtils.update(
        loadingToast,
        "error",
        "There was an error booking your consultation call. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedConsultationType = consultationTypes.find(
    (type) => type.id === formData.consultationType
  );

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[98vh] sm:h-[95vh] md:h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="bg-brand-primary text-white p-3 sm:p-4 md:p-6 flex-shrink-0">
          <div className="flex items-start md:items-center justify-between mb-4 md:mb-0">
            <div className="flex-1 pr-4">
              <h2 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">
                Schedule a Consultation Call
              </h2>
              <p className="text-white/90 text-sm md:text-base hidden sm:block">
                Book a free consultation to discuss your needs and explore
                opportunities
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <Icon
                icon="solar:close-circle-bold"
                width={20}
                className="md:w-6 md:h-6"
              />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-4 md:mt-6 space-x-2 md:space-x-4 overflow-x-auto">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-shrink-0">
                <div
                  className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-colors ${
                    currentStep >= step
                      ? "bg-white text-brand-primary"
                      : "bg-white/30 text-white"
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-8 md:w-12 h-0.5 mx-1 md:mx-2 transition-colors ${
                      currentStep > step ? "bg-white" : "bg-white/30"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="text-xs md:text-sm text-white/80 mt-2">
            Step {currentStep} of 4:{" "}
            <span className="hidden sm:inline">
              {currentStep === 1
                ? "Consultation Type"
                : currentStep === 2
                ? "Contact Information"
                : currentStep === 3
                ? "Call Details"
                : "Additional Information"}
            </span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto min-h-0 scroll-py-4">
          {/* Step 1: Consultation Type Selection */}
          {currentStep === 1 && (
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">
                  What type of consultation call would you like to schedule?
                </h3>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {consultationTypes.map((type) => (
                    <label
                      key={type.id}
                      className={`p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formData.consultationType === type.id
                          ? "border-brand-primary bg-brand-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="consultationType"
                        value={type.id}
                        checked={formData.consultationType === type.id}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-start space-x-3">
                        <Icon
                          icon={type.icon}
                          width={20}
                          className="text-brand-primary mt-1 md:w-6 md:h-6"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 text-sm md:text-base">
                              {type.title}
                            </h4>
                            <span className="text-green-600 font-bold text-sm md:text-base">
                              {type.price}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-gray-600 mb-2">
                            {type.description}
                          </p>
                          <div className="flex items-center text-xs md:text-sm text-gray-500">
                            <Icon
                              icon="solar:clock-circle-bold"
                              width={14}
                              className="mr-1 md:w-4 md:h-4"
                            />
                            {type.duration}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.consultationType && (
                  <p className="text-red-500 text-sm mt-2">
                    {errors.consultationType}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full border-2 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors min-h-[44px] ${
                        errors.firstName ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full border-2 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors min-h-[44px] ${
                        errors.lastName ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full border-2 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors min-h-[44px] ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full border-2 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors min-h-[44px] ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company (Optional)
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors min-h-[44px]"
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title (Optional)
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors min-h-[44px]"
                      placeholder="Your job title"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Call Details */}
          {currentStep === 3 && (
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">
                  Consultation Call Details
                </h3>

                {selectedConsultationType && (
                  <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                    <div className="flex items-center space-x-3">
                      <Icon
                        icon={selectedConsultationType.icon}
                        width={20}
                        className="text-brand-primary md:w-6 md:h-6"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base">
                          {selectedConsultationType.title}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          {selectedConsultationType.duration} •{" "}
                          <span className="text-green-600 font-medium">
                            {selectedConsultationType.price}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purpose of Consultation Call *
                    </label>
                    <select
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      className={`w-full border-2 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors min-h-[44px] ${
                        errors.purpose ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select purpose</option>
                      {purposes.map((purpose) => (
                        <option key={purpose} value={purpose}>
                          {purpose}
                        </option>
                      ))}
                    </select>
                    {errors.purpose && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.purpose}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Call Type
                    </label>
                    <select
                      name="meetingMode"
                      value={formData.meetingMode}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors min-h-[44px]"
                    >
                      <option value="video">Video Call (Zoom/Teams)</option>
                      <option value="phone">Phone Call</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleChange}
                      min={today}
                      className={`w-full border-2 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors min-h-[44px] ${
                        errors.preferredDate
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.preferredDate && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.preferredDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Time *
                    </label>
                    <select
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleChange}
                      className={`w-full border-2 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors min-h-[44px] ${
                        errors.preferredTime
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select time</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    {errors.preferredTime && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.preferredTime}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alternative Date
                    </label>
                    <input
                      type="date"
                      name="alternativeDate"
                      value={formData.alternativeDate}
                      onChange={handleChange}
                      min={today}
                      className="w-full border-2 border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alternative Time
                    </label>
                    <select
                      name="alternativeTime"
                      value={formData.alternativeTime}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors min-h-[44px]"
                    >
                      <option value="">Select time</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Additional Information */}
          {currentStep === 4 && (
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">
                  Additional Information
                </h3>

                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Call Agenda / What would you like to discuss?
                    </label>
                    <textarea
                      name="agenda"
                      value={formData.agenda}
                      onChange={handleChange}
                      rows={3}
                      className="w-full border-2 border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors resize-none"
                      placeholder="Please share the topics you'd like to cover, questions you have, or goals for the consultation call..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Participants
                      </label>
                      <select
                        name="participants"
                        value={formData.participants}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors min-h-[44px]"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <option key={num} value={num}>
                            {num} {num === 1 ? "person" : "people"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors min-h-[44px]"
                      >
                        <option value="EST">Eastern (EST)</option>
                        <option value="CST">Central (CST)</option>
                        <option value="MST">Mountain (MST)</option>
                        <option value="PST">Pacific (PST)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Requests or Requirements
                    </label>
                    <textarea
                      name="specialRequests"
                      value={formData.specialRequests}
                      onChange={handleChange}
                      rows={2}
                      className="w-full border-2 border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-colors resize-none"
                      placeholder="Any accessibility needs, technical requirements, or other special requests..."
                    />
                  </div>

                  <div className="border-t pt-4">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        name="newsletter"
                        checked={formData.newsletter}
                        onChange={handleChange}
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700">
                        I'd like to receive updates about Xtrawrkx services,
                        events, and industry insights
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-3 sm:px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 flex-shrink-0 border-t border-gray-200">
          <div className="order-2 sm:order-1">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors text-sm md:text-base py-2 px-3 rounded-lg hover:bg-gray-100 min-h-[44px]"
              >
                <Icon
                  icon="solar:arrow-left-bold"
                  width={14}
                  className="md:w-4 md:h-4"
                />
                <span>Previous</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 order-1 sm:order-2 w-full sm:w-auto">
            {currentStep < 4 ? (
              <Button
                text="Next Step"
                type="primary"
                onClick={nextStep}
                className="flex items-center space-x-2 w-full sm:w-auto justify-center min-h-[44px] pl-6"
              />
            ) : (
              <Button
                text={isSubmitting ? "Booking..." : "Book Consultation Call"}
                type="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-2 w-full sm:w-auto justify-center text-sm md:text-base min-h-[44px] pl-6"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookMeetModal;
