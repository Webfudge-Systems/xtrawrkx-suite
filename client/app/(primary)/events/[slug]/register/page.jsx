"use client";
import React, { useState, useEffect, use } from "react";
import { notFound } from "next/navigation";
import { Icon } from "@iconify/react";
import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import Button from "@/src/components/common/Button";
import RegistrationSuccess from "@/src/components/common/RegistrationSuccess";
import { eventsData, getEventBySlug } from "@/src/data/EventsData";
import {
  eventRegistrationService,
  EventService,
} from "@/src/services/databaseService";
import { formatEventDate } from "@/src/utils/dateUtils";
import Script from "next/script";
import Image from "next/image";
import { commonToasts, toastUtils } from "@/src/utils/toast";
import {
  sendRegistrationEmail,
  sendPaymentConfirmationEmail,
} from "@/src/utils/emailUtils";
import { usePublicAuth } from "@/src/contexts/PublicAuthContext";
import {
  LEAD_COMPANY_TYPES,
  LEAD_COMPANY_SUB_TYPES,
} from "@/src/data/companyRegistrationOptions";

const designations = [
  "CEO/Founder",
  "CTO/VP Technology",
  "VP/Director",
  "Manager",
  "Senior Executive",
  "Executive",
  "Engineer",
  "Analyst",
  "Consultant",
  "Other",
];

const companyTypes = LEAD_COMPANY_TYPES;
const subTypeOptions = LEAD_COMPANY_SUB_TYPES;

export default function CompanyEventRegistration({ params }) {
  const { slug } = use(params);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAuthGate, setShowAuthGate] = useState(false);

  const { isAuthenticated, profile, loading: authLoading } = usePublicAuth();
  const eventService = new EventService();

  // Fetch event by slug from Firebase with fallback to static data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        console.log("Fetching event with slug:", slug);

        // Try Firebase first
        const fetchedEvent = await eventService.getEventBySlug(slug);
        console.log("Fetched event from Firebase:", fetchedEvent);

        if (fetchedEvent) {
          setEvent(fetchedEvent);
          setError(null);
        } else {
          console.log("Event not found in Firebase, trying static data");
          // Fallback to static data
          const staticEvent = getEventBySlug(slug);
          console.log("Fetched event from static data:", staticEvent);

          if (staticEvent) {
            setEvent(staticEvent);
            setError(null);
          } else {
            console.log("Event not found in static data either");
            setError("Event not found");
          }
        }
      } catch (err) {
        console.error(
          "Error fetching event from Firebase, trying static data:",
          err
        );

        // Fallback to static data on error
        try {
          const staticEvent = getEventBySlug(slug);
          if (staticEvent) {
            console.log("Using static data as fallback:", staticEvent);
            setEvent(staticEvent);
            setError(null);
          } else {
            setError("Event not found");
          }
        } catch (staticErr) {
          console.error("Error with static data fallback:", staticErr);
          setError("Failed to load event");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "",
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    companyType: "",
    subType: "",
    companySize: "",
    linkedinUrl: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Show auth gate once auth state is resolved and user is not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowAuthGate(true);
    }
  }, [authLoading, isAuthenticated]);

  // Auto-fill form fields from profile when authenticated
  useEffect(() => {
    if (isAuthenticated && profile) {
      setFormData((prev) => ({
        ...prev,
        name:
          prev.name ||
          [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
          profile.displayName ||
          "",
        email: prev.email || profile.email || "",
        designation: prev.designation || profile.jobTitle || "",
        companyName: prev.companyName || profile.company || "",
        companyEmail:
          prev.companyEmail || (!prev.companyEmail ? profile.email : "") || "",
        linkedinUrl: prev.linkedinUrl || "",
      }));
    }
  }, [isAuthenticated, profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Parse price from event data
  const parseEventPrice = () => {
    if (!event || !event.price) {
      return { amount: 0, isFree: true };
    }

    const priceStr = String(event.price).toLowerCase().trim();

    // Check if it's free
    if (priceStr === "free" || priceStr === "₹0" || priceStr === "0") {
      return { amount: 0, isFree: true };
    }

    // Extract number from price string (e.g., "₹5,000" or "5000" or "₹5000")
    const priceMatch = priceStr.match(/[\d,]+/);
    if (priceMatch) {
      const amount = parseInt(priceMatch[0].replace(/,/g, ""), 10);
      return { amount: isNaN(amount) ? 0 : amount, isFree: false };
    }

    return { amount: 0, isFree: true };
  };

  const validateForm = () => {
    const newErrors = {};

    // Personal Information Validation
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Please enter a valid email address";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";

    // Company Information Validation
    if (!formData.companyName.trim())
      newErrors.companyName = "Company name is required";
    if (!formData.companyEmail.trim())
      newErrors.companyEmail = "Company email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail))
      newErrors.companyEmail = "Please enter a valid company email address";
    if (!formData.companyPhone.trim())
      newErrors.companyPhone = "Company phone is required";
    if (!formData.companyType)
      newErrors.companyType = "Company type is required";
    if (formData.companyType && !formData.subType)
      newErrors.subType = "Sub-type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const processPayment = (registrationData, registrationId, priceInfo) => {
    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        console.error(
          "Razorpay SDK not loaded - possible ad blocker interference"
        );
        reject(
          new Error(
            "🚫 Payment gateway blocked! Please disable ad blocker and try again."
          )
        );
        return;
      }

      if (!razorpayLoaded) {
        console.error("Razorpay script not fully loaded");
        reject(
          new Error(
            "🔄 Payment gateway still loading. Please wait a moment and try again."
          )
        );
        return;
      }

      if (priceInfo.isFree || priceInfo.amount <= 0) {
        reject(new Error("Invalid payment amount."));
        return;
      }

      if (!registrationId) {
        reject(new Error("Registration error. Please try again."));
        return;
      }

      const amountInPaise = Math.round(priceInfo.amount * 100);

      console.log("Processing payment:", {
        registrationId,
        amount: priceInfo.amount,
        amountInPaise,
        eventTitle: event.title,
      });

      const options = {
        key: "rzp_live_JB7S2UmHSR0kL5",
        amount: amountInPaise,
        currency: "INR",
        name: "XtraWrkx Events",
        description: `${event.title} - Event Registration`,
        order_id: `event_${registrationId}_${Date.now()}`,
        handler: async function (response) {
          console.log("Payment successful:", response);
          try {
            const updatedRegistrationData = {
              ...registrationData,
              paymentStatus: "completed",
              status: "confirmed",
              paymentId: response.razorpay_payment_id,
              paymentSignature: response.razorpay_signature,
              orderId: response.razorpay_order_id,
              paidAt: new Date().toISOString(),
            };

            // Retry logic for updating registration
            let retryCount = 0;
            const maxRetries = 3;
            let updateSuccess = false;

            while (retryCount < maxRetries && !updateSuccess) {
              try {
                await eventRegistrationService.updateRegistration(
                  registrationId,
                  updatedRegistrationData
                );
                updateSuccess = true;
                console.log(
                  "Registration updated successfully after",
                  retryCount + 1,
                  "attempt(s)"
                );
              } catch (updateError) {
                retryCount++;
                console.error(
                  `Registration update attempt ${retryCount} failed:`,
                  updateError
                );

                if (retryCount < maxRetries) {
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                }
              }
            }

            if (!updateSuccess) {
              try {
                await eventRegistrationService.createFailedPaymentLog({
                  registrationId,
                  paymentId: response.razorpay_payment_id,
                  paymentSignature: response.razorpay_signature,
                  orderId: response.razorpay_order_id,
                  eventId: event.id,
                  eventSlug: event.slug,
                  registrationData: updatedRegistrationData,
                  errorType: "database_update_failed",
                  maxRetries,
                  timestamp: new Date().toISOString(),
                });
              } catch (logError) {
                console.error("Failed to log failed payment:", logError);
              }

              throw new Error("Database update failed after multiple attempts");
            }

            // Send payment confirmation email
            try {
              await sendPaymentConfirmationEmail(
                updatedRegistrationData,
                registrationId,
                response.razorpay_payment_id
              );
            } catch (emailError) {
              console.error(
                "Failed to send payment confirmation email:",
                emailError
              );
            }

            resolve(response);
          } catch (error) {
            console.error("Error updating payment status:", error);
            reject(
              new Error(
                `Payment completed but failed to update registration. Please contact support with payment ID: ${response.razorpay_payment_id}. Error: ${error.message}`
              )
            );
          }
        },
        prefill: {
          name: formData.name || "",
          email: formData.email || "",
          contact: formData.phone || "",
        },
        notes: {
          registrationId: registrationId,
          eventTitle: event.title,
          companyName: formData.companyName || "",
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: function () {
            console.log("Payment modal dismissed by user");
            reject(new Error("Payment cancelled by user"));
          },
          escape: true,
          backdropclose: false,
        },
      };

      try {
        const razorpay = new window.Razorpay(options);

        razorpay.on("payment.failed", function (response) {
          console.error("Payment failed:", response.error);
          const error = response.error;
          let errorMessage = "❌ Payment Failed\n\n";

          if (error.code === "BAD_REQUEST_ERROR") {
            errorMessage +=
              "🚫 Bad Request Error - Please disable ad blocker and try again.";
          } else if (error.code === "GATEWAY_ERROR") {
            errorMessage +=
              "🏦 Bank/Gateway Issue - Please try a different payment method.";
          } else if (error.code === "NETWORK_ERROR") {
            errorMessage +=
              "🌐 Network Issue - Please check your internet connection.";
          } else {
            const desc =
              error.description || error.reason || "Unknown payment error";
            errorMessage += `Details: ${desc}`;
          }

          reject(new Error(errorMessage));
        });

        razorpay.open();
      } catch (error) {
        console.error("Error creating/opening Razorpay:", error);
        reject(
          new Error(
            "🚫 Failed to open payment gateway. Please refresh the page and try again."
          )
        );
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toastUtils.validationError(
        "Please correct the errors in the form before submitting."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const priceInfo = parseEventPrice();

      // Prepare registration data for database
      const registrationData = {
        // Registration Type
        registrationType: "individual",

        // Event Information
        eventId: event.id || event.slug,
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,

        // Personal Information (Primary Contact)
        primaryContactName: formData.name,
        primaryContactEmail: formData.email,
        primaryContactPhone: formData.phone,
        primaryContactDesignation: formData.designation,

        // Company Information
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        companyPhone: formData.companyPhone,
        companyAddress: formData.companyAddress,
        companyType: formData.companyType,
        subType: formData.subType,
        companySize: formData.companySize,
        linkedinUrl: formData.linkedinUrl,

        // Pricing Information
        totalCost: priceInfo.amount,
        isFree: priceInfo.isFree,
        eventPrice: event.price,

        // Registration Status
        status: priceInfo.isFree ? "confirmed" : "pending",
        paymentStatus: priceInfo.isFree ? "completed" : "pending",
      };

      // Save registration to database
      const registrationResult =
        await eventRegistrationService.createRegistration(registrationData);
      const registrationId = registrationResult.id;

      console.log("Registration saved with ID:", registrationId);

      // If it's a free registration, complete immediately
      if (priceInfo.isFree) {
        const emailSent = await sendRegistrationEmail(
          registrationData,
          registrationId
        );

        toastUtils.success(
          `🎉 Registration completed successfully! Your registration ID is: ${registrationId}. Welcome to ${
            event.title
          }!${
            emailSent
              ? " Confirmation email sent."
              : " Note: Email notification may be delayed."
          }`,
          { autoClose: 10000 }
        );

        setSuccessData({
          registrationId,
          companyName: formData.companyName,
          eventTitle: event.title,
          totalCost: 0,
        });
        setShowSuccessPage(true);

        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          designation: "",
          companyName: "",
          companyEmail: "",
          companyPhone: "",
          companyAddress: "",
          companyType: "",
          subType: "",
          companySize: "",
          linkedinUrl: "",
        });
      } else {
        // Process payment for paid registrations
        try {
          await processPayment(registrationData, registrationId, priceInfo);

          toastUtils.success(
            `🎉 Payment successful! Registration completed for ${event.title}. Registration ID: ${registrationId}. You'll receive a confirmation email shortly.`,
            { autoClose: 12000 }
          );

          setSuccessData({
            registrationId,
            companyName: formData.companyName,
            eventTitle: event.title,
            totalCost: priceInfo.amount,
          });
          setShowSuccessPage(true);

          // Reset form
          setFormData({
            name: "",
            email: "",
            phone: "",
            designation: "",
            companyName: "",
            companyEmail: "",
            companyPhone: "",
            companyAddress: "",
            companyType: "",
            subType: "",
            companySize: "",
            linkedinUrl: "",
          });
        } catch (paymentError) {
          console.error("Payment error:", paymentError);

          if (paymentError.message === "Payment cancelled by user") {
            toastUtils.warning(
              `💳 Payment was cancelled. Your registration has been saved and you can complete the payment later. Registration ID: ${registrationId}.`,
              { autoClose: 10000 }
            );
          } else {
            toastUtils.error(
              `⚠️ Payment could not be completed. Your registration has been saved. Registration ID: ${registrationId}. Error: ${paymentError.message}. Please contact support for assistance.`,
              { autoClose: 12000 }
            );
          }
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toastUtils.error(
        "There was an error processing your registration. Please try again. If the problem persists, please contact support.",
        { autoClose: 8000 }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Icon
            icon="mdi:loading"
            className="text-brand-primary mx-auto mb-4 animate-spin"
            width={64}
          />
          <h3 className="text-xl font-semibold text-gray-600">
            Loading event...
          </h3>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Icon
            icon="mdi:alert-circle"
            className="text-red-500 mx-auto mb-4"
            width={64}
          />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {error || "Event not found"}
          </h3>
          <p className="text-gray-500 mb-4">
            The event you're looking for doesn't exist or registration is not
            available.
          </p>
          <Button text="Back to Events" type="primary" link="/events" />
        </div>
      </div>
    );
  }

  // Show success page if registration is complete
  if (showSuccessPage && successData) {
    return (
      <RegistrationSuccess
        registrationData={successData}
        onRedirect={() => (window.location.href = "/events")}
      />
    );
  }

  const priceInfo = parseEventPrice();
  const displayPrice = priceInfo.isFree
    ? "FREE"
    : `₹${priceInfo.amount.toLocaleString()}`;

  const registerRedirect = `/events/${slug}/register`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Auth Gate Modal */}
      {showAuthGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => (window.location.href = `/events/${slug}`)}
          />
          {/* Modal */}
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-[0_32px_80px_rgba(15,23,42,0.22)] overflow-hidden">
            {/* Top accent */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-secondary px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                  <Icon icon="solar:lock-bold" width={24} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-white/70">
                    Account required
                  </p>
                  <h3 className="text-lg font-bold leading-tight">
                    Register an account first
                  </h3>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <p className="text-sm leading-relaxed text-slate-600">
                To register for{" "}
                <span className="font-semibold text-slate-900">
                  {event?.title}
                </span>
                , you need an xtrawrkx account. Once registered, we&apos;ll
                automatically fill your details in this form.
              </p>

              {/* Steps */}
              <div className="mt-5 space-y-2.5">
                {[
                  {
                    num: "1",
                    label: "Create your free xtrawrkx account",
                    icon: "solar:user-plus-bold",
                  },
                  {
                    num: "2",
                    label: "You'll be brought back here automatically",
                    icon: "solar:arrow-right-bold",
                  },
                  {
                    num: "3",
                    label: "Your details are auto-filled — just confirm",
                    icon: "solar:check-circle-bold",
                  },
                ].map(({ num, label, icon }) => (
                  <div key={num} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary/10">
                      <Icon
                        icon={icon}
                        width={14}
                        className="text-brand-primary"
                      />
                    </div>
                    <p className="text-sm text-slate-700">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                <a
                  href={`/auth?mode=signup&redirect=${encodeURIComponent(registerRedirect)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary px-5 py-3.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-[0.98]"
                >
                  <Icon icon="solar:user-plus-bold" width={18} />
                  Create an account
                </a>
                <a
                  href={`/auth?mode=login&redirect=${encodeURIComponent(registerRedirect)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
                >
                  <Icon icon="solar:login-bold" width={18} />
                  I already have an account
                </a>
              </div>

              <button
                type="button"
                onClick={() => (window.location.href = `/events/${slug}`)}
                className="mt-4 w-full text-center text-xs text-slate-400 transition hover:text-slate-600"
              >
                ← Back to event
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <Section className="relative border-b overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/reg_hero.svg"
            alt="Registration Header Background"
            className="object-cover object-right"
            fill
            priority
          />
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
        </div>

        <Container className="relative z-10">
          <div className="py-6 pt-[170px]">
            <div className="flex items-center space-x-3 mb-4">
              <Button
                text="← Back to Event"
                type="secondary"
                link={`/events/${slug}`}
                className="text-sm bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
              Event Registration
            </h1>
            <p className="text-white/90 mb-4 drop-shadow">
              Register for {event.title} and secure your spot
            </p>
            <div className="flex items-center space-x-6 text-white/80">
              <div className="flex items-center space-x-2">
                <Icon icon="mdi:calendar" width={20} />
                <span>{formatEventDate(event.date) || event.date}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon icon="mdi:map-marker" width={16} />
                <span>{event.location}</span>
              </div>
              {event.time && (
                <div className="flex items-center space-x-2">
                  <Icon icon="mdi:clock-outline" width={16} />
                  <span>{event.time}</span>
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* Profile auto-fill banner */}
      {isAuthenticated && profile && (
        <div className="border-b border-emerald-200 bg-emerald-50">
          <Container>
            <div className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-2.5 text-sm text-emerald-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shrink-0">
                  {(
                    profile.firstName?.[0] ||
                    profile.displayName?.[0] ||
                    "U"
                  ).toUpperCase()}
                </div>
                <span>
                  Signed in as{" "}
                  <strong>
                    {[profile.firstName, profile.lastName]
                      .filter(Boolean)
                      .join(" ") || profile.displayName}
                  </strong>{" "}
                  — details auto-filled below. You can still edit any field.
                </span>
              </div>
              <a
                href="/profile"
                className="shrink-0 text-xs font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
              >
                View profile
              </a>
            </div>
          </Container>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Container className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Personal Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Icon
                      icon="solar:user-bold"
                      width={24}
                      className="mr-2 text-brand-primary"
                    />
                    Personal Information
                  </h2>
                  {isAuthenticated && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
                      <Icon icon="solar:check-circle-bold" width={13} />
                      Auto-filled from your profile
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                        errors.name
                          ? "border-red-300 bg-red-50"
                          : formData.name && isAuthenticated
                          ? "border-emerald-300 bg-emerald-50/50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
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
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                        errors.email
                          ? "border-red-300 bg-red-50"
                          : formData.email && isAuthenticated
                          ? "border-emerald-300 bg-emerald-50/50"
                          : "border-gray-300"
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
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                        errors.phone
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="+91 98765 43210"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation
                    </label>
                    <select
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      <option value="">Select designation</option>
                      {designations.map((designation) => (
                        <option key={designation} value={designation}>
                          {designation}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Icon
                      icon="solar:buildings-2-bold"
                      width={24}
                      className="mr-2 text-brand-primary"
                    />
                    Company Information
                  </h2>
                  {isAuthenticated && (formData.companyName || formData.companyEmail) && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
                      <Icon icon="solar:check-circle-bold" width={13} />
                      Partially auto-filled
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                        errors.companyName
                          ? "border-red-300 bg-red-50"
                          : formData.companyName && isAuthenticated
                          ? "border-emerald-300 bg-emerald-50/50"
                          : "border-gray-300"
                      }`}
                      placeholder="Your company name"
                    />
                    {errors.companyName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.companyName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Email *
                    </label>
                    <input
                      type="email"
                      name="companyEmail"
                      value={formData.companyEmail}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                        errors.companyEmail
                          ? "border-red-300 bg-red-50"
                          : formData.companyEmail && isAuthenticated
                          ? "border-emerald-300 bg-emerald-50/50"
                          : "border-gray-300"
                      }`}
                      placeholder="company@example.com"
                    />
                    {errors.companyEmail && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.companyEmail}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Phone *
                    </label>
                    <input
                      type="tel"
                      name="companyPhone"
                      value={formData.companyPhone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                        errors.companyPhone
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="+91 98765 43210"
                    />
                    {errors.companyPhone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.companyPhone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Type *
                    </label>
                    <select
                      name="companyType"
                      value={formData.companyType}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                        errors.companyType
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select company type</option>
                      {companyTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {errors.companyType && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.companyType}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sub-type *
                    </label>
                    <select
                      name="subType"
                      value={formData.subType}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                        errors.subType
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      disabled={!formData.companyType}
                    >
                      <option value="">
                        {formData.companyType
                          ? "Select sub-type"
                          : "Please select company type first"}
                      </option>
                      {formData.companyType &&
                        subTypeOptions[formData.companyType]?.map((subType) => (
                          <option key={subType} value={subType}>
                            {subType}
                          </option>
                        ))}
                    </select>
                    {errors.subType && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.subType}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Size
                    </label>
                    <select
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      <option value="">Select company size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-1000">201-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Address
                    </label>
                    <textarea
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                      placeholder="Complete company address"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company LinkedIn URL
                    </label>
                    <input
                      type="url"
                      name="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                        errors.linkedinUrl
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="https://linkedin.com/company/your-company"
                    />
                    {errors.linkedinUrl && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.linkedinUrl}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Registration Summary */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Icon
                      icon="solar:calculator-bold"
                      width={20}
                      className="mr-2 text-brand-primary"
                    />
                    Registration Summary
                  </h3>

                  <div className="space-y-4">
                    {/* Event Details */}
                    <div className="space-y-3 pb-4 border-b border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Event:</span>
                        <span className="font-medium text-right text-gray-900">
                          {event.title}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium text-gray-900">
                          {formatEventDate(event.date) || event.date}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium text-gray-900">
                          {event.location}
                        </span>
                      </div>

                      {event.time && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Time:</span>
                          <span className="font-medium text-gray-900">
                            {event.time}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Registration Fee:</span>
                        <span className="font-medium text-gray-900">
                          {displayPrice}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex items-center justify-between text-lg font-bold text-gray-900">
                          <span>Total Amount:</span>
                          <span className="text-brand-primary">
                            {displayPrice}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    text={
                      isSubmitting
                        ? "Processing..."
                        : priceInfo.isFree
                        ? "Complete Registration (FREE)"
                        : `Complete Registration (${displayPrice})`
                    }
                    type="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full mt-6"
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </form>

      {/* Razorpay Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => console.error("Failed to load Razorpay SDK")}
      />
    </div>
  );
}
