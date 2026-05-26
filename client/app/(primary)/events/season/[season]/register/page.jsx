"use client";
import React, { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { notFound } from "next/navigation";
import { Icon } from "@iconify/react";
import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import Button from "@/src/components/common/Button";
import Image from "next/image";
import {
  eventRegistrationService,
  EventService,
} from "@/src/services/databaseService";
import { CloudinaryService } from "@/src/services/cloudinaryService";
import { formatEventDate } from "@/src/utils/dateUtils";
import RegistrationSuccess from "@/src/components/common/RegistrationSuccess";
import { commonToasts, toastUtils } from "@/src/utils/toast";
import {
  sendSeasonRegistrationEmail,
  sendSeasonPaymentConfirmationEmail,
} from "@/src/utils/emailUtils";
import {
  LEAD_COMPANY_TYPES,
  LEAD_COMPANY_SUB_TYPES,
} from "@/src/data/companyRegistrationOptions";

const communityOptions = [
  { id: "none", name: "Not a member" },
  { id: "xen", name: "XEN Community" },
  { id: "xev-fin", name: "XEV.FIN Community", freeSlots: 1, slotType: "gnp" },
  { id: "xevtg", name: "XEVTG Community", freeSlots: 1, slotType: "gnp" },
  { id: "xd-d", name: "XD&D Community", freeSlots: 1, slotType: "gnp" },
];

const xenLevelOptions = [
  { id: "x0", name: "X0", freeSlots: 1, totalFree: false, gnpOnly: true },
  { id: "x1", name: "X1", freeSlots: 1, totalFree: false, gnpOnly: true },
  { id: "x2", name: "X2", freeSlots: 5, totalFree: false, gnpOnly: false },
  { id: "x3", name: "X3", freeSlots: 5, totalFree: false, gnpOnly: false },
  { id: "x4", name: "X4", freeSlots: 5, totalFree: false, gnpOnly: false },
  { id: "x5", name: "X5", freeSlots: 5, totalFree: false, gnpOnly: false },
];

const clientStatusOptions = [
  { id: "none", name: "None", discount: 0, specialOffer: null },
  {
    id: "existing-client",
    name: "Existing Client",
    discount: 0,
    specialOffer: "5_gnp_or_1_asp",
  },
  {
    id: "former-client",
    name: "Former Client",
    discount: 25,
    specialOffer: null,
  },
  {
    id: "sponsor-partner",
    name: "Sponsor/Partner",
    discount: 50,
    specialOffer: "discount_only",
    maxPasses: 5,
  },
];

const ticketTypes = [
  {
    id: "gnp",
    name: "General Networking Pass (GNP)",
    price: 8000,
    description: "Access to networking sessions and general event activities",
  },
  {
    id: "asp",
    name: "Active Support Pass (ASP)",
    price: 60000,
    description:
      "Full access to all sessions, workshops, and premium networking opportunities. Fixed price of ₹60,000 for 1-2 members per company.",
  },
];

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

export default function SeasonRegistration({ params }) {
  const { season } = use(params);
  const searchParams = useSearchParams();
  const fromEvent = searchParams.get("from");

  const [seasonEvents, setSeasonEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [highlightPricingButton, setHighlightPricingButton] = useState(false);

  const eventService = new EventService();

  const [formData, setFormData] = useState({
    // Season Information
    season: season,
    selectedEvents: [], // Array of event IDs user wants to attend

    // Company Information
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    companyType: "",
    subType: "",
    companySize: "",
    companyCommunity: "none",
    xenLevel: "",
    clientStatus: "none",
    linkedinUrl: "",
    pitchDeck: null,

    // Ticket Information
    ticketType: "gnp", // Default to General Networking Pass

    // Primary Contact
    primaryContactName: "",
    primaryContactEmail: "",
    primaryContactPhone: "",
    primaryContactDesignation: "",

    // Personnel
    personnel: [
      {
        name: "",
        email: "",
        phone: "",
        designation: "",
        isAttending: true,
      },
    ],

    // Additional Information
    specialRequests: "",
    emergencyContact: "",
    emergencyPhone: "",

    // Agreement
    termsAccepted: false,
    privacyAccepted: false,
  });

  // Fetch events for the season
  useEffect(() => {
    const fetchSeasonEvents = async () => {
      try {
        setLoading(true);
        const events = await eventService.getUpcomingEventsBySeason(season);

        if (events.length === 0) {
          setError(`No upcoming events found for season ${season}`);
          setLoading(false);
          return;
        }

        setSeasonEvents(events);

        // If coming from a specific event, pre-select it
        if (fromEvent) {
          const fromEventData = events.find((e) => e.slug === fromEvent);
          if (fromEventData) {
            setFormData((prev) => ({
              ...prev,
              selectedEvents: [fromEventData.id],
            }));
          }
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching season events:", err);
        setError("Failed to load season events");
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonEvents();
  }, [season, fromEvent]);

  // Auto-open pricing modal or highlight button after page loads
  useEffect(() => {
    if (!loading && seasonEvents.length > 0) {
      // Check if user has seen pricing rules before (localStorage)
      const hasSeenPricingRules = localStorage.getItem("hasSeenPricingRules");

      if (!hasSeenPricingRules) {
        // Auto-open modal for first-time visitors
        const timer = setTimeout(() => {
          setShowPricingModal(true);
          localStorage.setItem("hasSeenPricingRules", "true");
        }, 2000); // Open modal 2 seconds after page loads

        return () => clearTimeout(timer);
      } else {
        // For returning users, just highlight the button
        const timer = setTimeout(() => {
          setHighlightPricingButton(true);
          // Auto-remove highlight after 5 seconds
          const removeTimer = setTimeout(() => {
            setHighlightPricingButton(false);
          }, 5000);
          return () => clearTimeout(removeTimer);
        }, 1000); // Start highlighting 1 second after page loads

        return () => clearTimeout(timer);
      }
    }
  }, [loading, seasonEvents]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Special handling for company type change
    if (name === "companyType") {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
        subType: "", // Clear sub-type when company type changes
        pitchDeck: null, // Clear pitch deck when company type changes
      }));
    }
    // Special handling for community change
    else if (name === "companyCommunity") {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
        xenLevel: value === "xen" ? "" : "", // Reset XEN level when community changes
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    // Clear errors
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Clear sub-type error when company type changes
    if (name === "companyType" && errors.subType) {
      setErrors((prev) => ({ ...prev, subType: "" }));
    }

    // Clear pitch deck error when company type changes
    if (name === "companyType" && errors.pitchDeck) {
      setErrors((prev) => ({ ...prev, pitchDeck: "" }));
    }

    // Clear XEN level error when community changes
    if (name === "companyCommunity" && errors.xenLevel) {
      setErrors((prev) => ({ ...prev, xenLevel: "" }));
    }
  };

  const handleEventSelection = (eventId) => {
    setFormData((prev) => ({
      ...prev,
      selectedEvents: prev.selectedEvents.includes(eventId)
        ? prev.selectedEvents.filter((id) => id !== eventId)
        : [...prev.selectedEvents, eventId],
    }));
  };

  const addPersonnel = () => {
    setFormData((prev) => ({
      ...prev,
      personnel: [
        ...prev.personnel,
        {
          name: "",
          email: "",
          phone: "",
          designation: "",
          isAttending: true,
        },
      ],
    }));
  };

  const removePersonnel = (index) => {
    setFormData((prev) => ({
      ...prev,
      personnel: prev.personnel.filter((_, i) => i !== index),
    }));
  };

  const updatePersonnel = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      personnel: prev.personnel.map((person, i) =>
        i === index ? { ...person, [field]: value } : person
      ),
    }));
  };

  const copyPrimaryContactToPerson1 = () => {
    if (formData.personnel.length > 0) {
      setFormData((prev) => ({
        ...prev,
        personnel: prev.personnel.map((person, i) =>
          i === 0
            ? {
                ...person,
                name: prev.primaryContactName,
                email: prev.primaryContactEmail,
                phone: prev.primaryContactPhone,
                designation: prev.primaryContactDesignation,
              }
            : person
        ),
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  const calculatePricing = () => {
    const selectedTicket = ticketTypes.find(
      (t) => t.id === formData.ticketType
    );
    const basePrice = selectedTicket ? selectedTicket.price : 8000;
    let totalCost = 0;
    let discountAmount = 0;
    let isFree = false;
    let freeMembers = 0;
    let paidMembers = 0;
    let violatesRules = false;
    let ruleViolationMessage = "";

    const attendingCount = formData.personnel.filter(
      (p) => p.isAttending
    ).length;
    const selectedEventCount = formData.selectedEvents.length;
    const companyCommunity = communityOptions.find(
      (c) => c.id === formData.companyCommunity
    );
    const clientStatus = clientStatusOptions.find(
      (s) => s.id === formData.clientStatus
    );
    const xenLevel = xenLevelOptions.find((x) => x.id === formData.xenLevel);

    // Check if company is part of any community (not "none")
    const isPartOfCommunity = formData.companyCommunity !== "none";

    // RULE: Company Slot Purchase Rules - Each company can buy only 1 ASP and 1 ASP includes 2 members
    if (formData.ticketType === "asp" && attendingCount > 2) {
      violatesRules = true;
      ruleViolationMessage =
        "ASP includes maximum 2 members only. Please reduce team size or switch to GNP.";
    }

    // Step 1: Handle special client status offers first (highest priority)
    if (clientStatus && clientStatus.specialOffer === "5_gnp_or_1_asp") {
      // Existing clients: 5 free GNPs OR 1 free ASP
      if (formData.ticketType === "gnp") {
        // GNP: Up to 5 members free, additional members pay ₹8,000
        if (attendingCount <= 5) {
          totalCost = 0;
          isFree = true;
          freeMembers = attendingCount;
          discountAmount = basePrice * attendingCount;
        } else {
          freeMembers = 5;
          paidMembers = attendingCount - 5;
          totalCost = paidMembers * basePrice;
          discountAmount = basePrice * 5;
        }
      } else if (formData.ticketType === "asp") {
        // ASP: 1 free ASP for existing clients (covers up to 2 members)
        if (attendingCount <= 2) {
          totalCost = 0; // FREE ASP
          isFree = true;
          freeMembers = attendingCount;
          paidMembers = 0;
          discountAmount = basePrice; // Full ASP price as discount
        } else {
          violatesRules = true;
          ruleViolationMessage =
            "ASP includes maximum 2 members only. Please reduce team size.";
        }
      }
    }
    // Step 2: Handle sponsor/partner discounts (no free slots, only discounts)
    else if (clientStatus && clientStatus.id === "sponsor-partner") {
      if (formData.ticketType === "gnp") {
        // 50% off on up to 5 GNPs
        if (attendingCount <= 5) {
          totalCost = attendingCount * basePrice * 0.5; // 50% off
          discountAmount = attendingCount * basePrice * 0.5;
          freeMembers = 0;
          paidMembers = attendingCount;
        } else {
          // First 5 get 50% off, rest pay full price
          const discountedMembers = 5;
          const fullPriceMembers = attendingCount - 5;
          totalCost =
            discountedMembers * basePrice * 0.5 + fullPriceMembers * basePrice;
          discountAmount = discountedMembers * basePrice * 0.5;
          freeMembers = 0;
          paidMembers = attendingCount;
        }
      } else if (formData.ticketType === "asp") {
        // 50% off on ASP (fixed price for 1-2 members)
        if (attendingCount <= 2) {
          totalCost = basePrice * 0.5; // 50% off fixed ASP price
          discountAmount = basePrice * 0.5;
          freeMembers = 0;
          paidMembers = 1; // Count as 1 "unit" since ASP is fixed price
        } else {
          violatesRules = true;
          ruleViolationMessage = "ASP includes maximum 2 members only.";
        }
      }
    }
    // Step 3: Apply community free slots + other client status discounts
    else {
      // Check for XEN X2+ special benefits (5 free GNPs OR 1 free ASP)
      if (
        formData.companyCommunity === "xen" &&
        xenLevel &&
        !xenLevel.gnpOnly &&
        clientStatus?.id !== "existing-client"
      ) {
        // XEN X2-X5: 5 free GNPs OR 1 free ASP (same as existing client benefits)
        if (formData.ticketType === "gnp") {
          // GNP: Up to 5 members free, additional members pay ₹8,000
          if (attendingCount <= 5) {
            totalCost = 0;
            isFree = true;
            freeMembers = attendingCount;
            discountAmount = basePrice * attendingCount;
          } else {
            freeMembers = 5;
            paidMembers = attendingCount - 5;
            totalCost = paidMembers * basePrice;
            discountAmount = basePrice * 5;
          }
        } else if (formData.ticketType === "asp") {
          // ASP: 1 free ASP for XEN X2+ (covers up to 2 members)
          if (attendingCount <= 2) {
            totalCost = 0; // FREE ASP
            isFree = true;
            freeMembers = attendingCount;
            paidMembers = 0;
            discountAmount = basePrice; // Full ASP price as discount
          } else {
            violatesRules = true;
            ruleViolationMessage =
              "ASP includes maximum 2 members only. Please reduce team size.";
          }
        }
      } else {
        // Regular community benefits (GNP ONLY)
        let communityFreeSlots = 0;

        if (isPartOfCommunity && formData.ticketType === "gnp") {
          // Free slots only apply to GNP tickets
          if (formData.companyCommunity === "xen" && xenLevel) {
            // XEN X1 gets 1 free GNP slot, X2+ handled above
            if (xenLevel.gnpOnly) {
              communityFreeSlots = xenLevel.freeSlots; // X1: 1 slot
            } else {
              // X2+ already handled in the special case above
              communityFreeSlots = 0;
            }
          } else {
            // XEV.FIN, XEVTG, XD&D get 1 free GNP slot each
            const community = communityOptions.find(
              (c) => c.id === formData.companyCommunity
            );
            if (community && community.slotType === "gnp") {
              communityFreeSlots = 1;
            }
          }
        }

        if (attendingCount === 0) {
          totalCost = 0;
          isFree = true;
        } else {
          // Calculate with community free slots (GNP only)
          let freeFromCommunity = 0;

          if (formData.ticketType === "gnp") {
            // Free slots only apply to GNP
            freeFromCommunity = Math.min(attendingCount, communityFreeSlots);
          } else {
            // ASP gets no free slots from community membership
            freeFromCommunity = 0;
          }

          if (formData.ticketType === "asp") {
            // ASP is fixed price for 1-2 members
            if (attendingCount <= 2) {
              freeMembers = freeFromCommunity;
              paidMembers = 1; // Count as 1 "unit" since ASP is fixed price

              // Calculate base cost - ASP is fixed price regardless of 1 or 2 members
              let baseCostForPaid = basePrice; // Fixed ASP price

              // Apply client status discount (former client gets 25% off)
              if (clientStatus && clientStatus.discount > 0) {
                const clientDiscount =
                  baseCostForPaid * (clientStatus.discount / 100);
                totalCost = baseCostForPaid - clientDiscount;
                discountAmount = clientDiscount;
              } else {
                totalCost = baseCostForPaid;
                discountAmount = 0;
              }
            } else {
              violatesRules = true;
              ruleViolationMessage = "ASP includes maximum 2 members only.";
            }
          } else {
            // GNP pricing - per member
            const paidCount = attendingCount - freeFromCommunity;

            freeMembers = freeFromCommunity;
            paidMembers = paidCount;

            // Calculate base cost for paid members
            let baseCostForPaid = paidCount * basePrice;

            // Apply client status discount to paid members (former client gets 25% off)
            if (clientStatus && clientStatus.discount > 0) {
              const clientDiscount =
                baseCostForPaid * (clientStatus.discount / 100);
              totalCost = baseCostForPaid - clientDiscount;
              discountAmount = freeFromCommunity * basePrice + clientDiscount;
            } else {
              totalCost = baseCostForPaid;
              discountAmount = freeFromCommunity * basePrice;
            }
          }

          if (totalCost === 0) {
            isFree = true;
          }
        }
      }
    }

    // Calculate savings based on ticket type
    let savings = 0;
    if (formData.ticketType === "asp") {
      // ASP: savings = discount amount (since ASP is fixed price)
      savings = discountAmount;
    } else {
      // GNP: savings = original total minus final cost
      savings = basePrice * attendingCount - totalCost;
    }

    return {
      attendingCount,
      selectedEventCount,
      ticketType: selectedTicket
        ? selectedTicket.name
        : "General Networking Pass (GNP)",
      baseAmount: basePrice,
      discountAmount,
      totalCost,
      savings,
      companyCommunity: companyCommunity
        ? companyCommunity.name
        : "Not a member",
      clientStatus: clientStatus ? clientStatus.name : "None",
      isFree: totalCost === 0,
      freeMembers,
      paidMembers,
      isPartOfCommunity,
      violatesRules,
      ruleViolationMessage,
    };
  };

  const validateForm = () => {
    const newErrors = {};
    const pricing = calculatePricing();

    // Check for rule violations
    if (pricing.violatesRules) {
      newErrors.ruleViolation = pricing.ruleViolationMessage;
    }

    // Season validation
    if (formData.selectedEvents.length === 0) {
      newErrors.selectedEvents = "Please select at least one event to attend";
    }

    // Company validation
    if (!formData.companyName.trim())
      newErrors.companyName = "Company name is required";
    if (!formData.companyEmail.trim())
      newErrors.companyEmail = "Company email is required";
    if (!formData.companyPhone.trim())
      newErrors.companyPhone = "Company phone is required";
    if (!formData.companyType.trim())
      newErrors.companyType = "Company type is required";
    if (!formData.subType.trim()) newErrors.subType = "Sub-type is required";
    if (formData.companyCommunity === "xen" && !formData.xenLevel.trim())
      newErrors.xenLevel = "XEN membership level is required";
    if (formData.companyType && !formData.pitchDeck)
      newErrors.pitchDeck = `${
        formData.companyType === "startup-corporate"
          ? "Pitch deck"
          : "Corporate deck"
      } is required`;

    // Validate file size (10MB max)
    if (formData.pitchDeck && formData.pitchDeck.size > 10 * 1024 * 1024) {
      newErrors.pitchDeck = "File size must be less than 10MB";
    }

    // Validate file type
    if (formData.pitchDeck) {
      const allowedTypes = [".pdf", ".ppt", ".pptx"];
      const fileName = formData.pitchDeck.name.toLowerCase();
      const isValidType = allowedTypes.some((type) => fileName.endsWith(type));
      if (!isValidType) {
        newErrors.pitchDeck = "File must be PDF, PPT, or PPTX format";
      }
    }

    // Primary contact validation
    if (!formData.primaryContactName.trim())
      newErrors.primaryContactName = "Primary contact name is required";
    if (!formData.primaryContactEmail.trim())
      newErrors.primaryContactEmail = "Primary contact email is required";
    if (!formData.primaryContactPhone.trim())
      newErrors.primaryContactPhone = "Primary contact phone is required";

    // Personnel validation
    formData.personnel.forEach((person, index) => {
      if (person.isAttending) {
        if (!person.name.trim())
          newErrors[`personnel_${index}_name`] = "Name is required";
        if (!person.email.trim())
          newErrors[`personnel_${index}_email`] = "Email is required";
        if (!person.phone.trim())
          newErrors[`personnel_${index}_phone`] = "Phone is required";
        if (!person.designation.trim())
          newErrors[`personnel_${index}_designation`] =
            "Designation is required";
      }
    });

    // Terms validation
    if (!formData.termsAccepted)
      newErrors.termsAccepted = "You must accept the terms and conditions";
    if (!formData.privacyAccepted)
      newErrors.privacyAccepted = "You must accept the privacy policy";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const processPayment = async (registrationData, registrationId, pricing) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Validate amount
        if (!pricing.totalCost || pricing.totalCost <= 0) {
          reject(
            new Error("Invalid payment amount. Please refresh and try again.")
          );
          return;
        }

        // Validate registration ID
        if (!registrationId) {
          reject(new Error("Registration error. Please try again."));
          return;
        }

        const selectedEventTitles = seasonEvents
          .filter((event) => formData.selectedEvents.includes(event.id))
          .map((event) => event.title)
          .join(", ");

        // Step 1: Create Razorpay order on backend
        const orderResponse = await fetch("/api/create-razorpay-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: pricing.totalCost,
            description: `Season ${season} Registration - ${pricing.ticketType}`,
          }),
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          throw new Error(
            `Failed to create payment order: ${
              errorData.details || errorData.error || "Unknown error"
            }`
          );
        }

        const orderData = await orderResponse.json();

        if (!orderData.id) {
          throw new Error("Invalid order response from server");
        }

        const razorpayKeyId = "rzp_live_627XWffhtRryPe";

        if (!razorpayKeyId || !razorpayKeyId.startsWith("rzp_")) {
          reject(
            new Error("Invalid Razorpay configuration. Please contact support.")
          );
          return;
        }

        // Step 2: Configure Razorpay options with real order ID
        const options = {
          key: razorpayKeyId,
          amount: orderData.amount, // Amount from backend (already in paise)
          currency: orderData.currency,
          name: "xtrawrkx Events",
          description: `Season ${season} - ${pricing.ticketType}`,
          order_id: orderData.id, // Real Razorpay order ID from backend
          handler: async function (response) {
            console.log("Payment successful:", response);
            try {
              // Update registration with payment details
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
                  await eventRegistrationService.updateSeasonRegistration(
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
                    // Wait for 1 second before retrying
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                  }
                }
              }

              if (!updateSuccess) {
                // Log detailed error for debugging
                console.error(
                  "Failed to update registration after",
                  maxRetries,
                  "attempts"
                );
                console.error("Registration ID:", registrationId);
                console.error("Payment ID:", response.razorpay_payment_id);

                // Log this for manual admin review
                try {
                  await eventRegistrationService.createFailedPaymentLog({
                    registrationId,
                    paymentId: response.razorpay_payment_id,
                    paymentSignature: response.razorpay_signature,
                    orderId: response.razorpay_order_id,
                    season: season,
                    registrationData: updatedRegistrationData,
                    errorType: "database_update_failed",
                    maxRetries,
                    timestamp: new Date().toISOString(),
                  });
                } catch (logError) {
                  console.error("Failed to log failed payment:", logError);
                }

                throw new Error(
                  "Database update failed after multiple attempts"
                );
              }

              // Send season payment confirmation email
              try {
                await sendSeasonPaymentConfirmationEmail(
                  updatedRegistrationData,
                  registrationId,
                  response.razorpay_payment_id,
                  season
                );
              } catch (emailError) {
                console.error(
                  "Failed to send season payment confirmation email:",
                  emailError
                );
                // Don't fail the payment process due to email issues
              }

              resolve(response);
            } catch (error) {
              console.error("Error in payment handler:", error);
              reject(
                new Error(
                  `Payment completed but failed to update registration. Please contact support with payment ID: ${response.razorpay_payment_id}. Error: ${error.message}`
                )
              );
            }
          },
          prefill: {
            name: formData.primaryContactName || "",
            email: formData.primaryContactEmail || "",
            contact: formData.primaryContactPhone || "",
          },
          notes: {
            registrationId: registrationId,
            season: season,
            selectedEvents: selectedEventTitles,
            companyName: formData.companyName || "",
          },
          theme: {
            color: "#3B82F6",
          },
          modal: {
            ondismiss: function () {
              reject(new Error("Payment cancelled by user"));
            },
            escape: true,
            backdropclose: false,
          },
        };

        // Step 3: Load Razorpay script dynamically and open payment
        const loadRazorpayAndPay = () => {
          if (typeof window !== "undefined") {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            script.onload = () => {
              try {
                const razorpay = new window.Razorpay(options);

                razorpay.on("payment.failed", function (response) {
                  const error = response.error;
                  const errorMessage =
                    error.description ||
                    error.reason ||
                    "Payment failed. Please try again.";
                  reject(new Error(errorMessage));
                });

                razorpay.open();
              } catch (error) {
                reject(new Error("Failed to initialize payment gateway."));
              }
            };
            script.onerror = () => {
              reject(
                new Error(
                  "Failed to load payment gateway. Please check your internet connection."
                )
              );
            };
            document.body.appendChild(script);
          }
        };

        // Check if Razorpay is already loaded
        if (window.Razorpay) {
          const razorpay = new window.Razorpay(options);
          razorpay.on("payment.failed", function (response) {
            const error = response.error;
            const errorMessage =
              error.description ||
              error.reason ||
              "Payment failed. Please try again.";
            reject(new Error(errorMessage));
          });
          razorpay.open();
        } else {
          loadRazorpayAndPay();
        }
      } catch (error) {
        reject(
          new Error(
            error.message || "Failed to process payment. Please try again."
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
      const pricing = calculatePricing();

      // Upload pitch deck file if present
      let pitchDeckUrl = null;
      let pitchDeckName = null;
      let pitchDeckSize = null;

      if (formData.pitchDeck) {
        setIsUploadingFile(true);
        try {
          const uploadOptions = {
            folder: "pitch_decks",
            public_id: `pitch_deck_${formData.companyName.replace(
              /\s+/g,
              "_"
            )}_${Date.now()}`,
          };

          const uploadResult = await CloudinaryService.uploadFile(
            formData.pitchDeck,
            uploadOptions
          );

          pitchDeckUrl = uploadResult.url;
          pitchDeckName = formData.pitchDeck.name;
          pitchDeckSize = formData.pitchDeck.size;
        } catch (uploadError) {
          console.error("Error uploading pitch deck:", uploadError);
          toastUtils.error(
            `Error uploading file: ${uploadError.message}. Please check the console for more details.`,
            { autoClose: 8000 }
          );
          return;
        } finally {
          setIsUploadingFile(false);
        }
      }

      // Get selected event details
      const selectedEventDetails = seasonEvents.filter((event) =>
        formData.selectedEvents.includes(event.id)
      );

      // Prepare registration data for database
      const registrationData = {
        // Season Information
        season: season,
        registrationType: "season",
        selectedEvents: formData.selectedEvents,
        selectedEventDetails: selectedEventDetails.map((event) => ({
          id: event.id,
          title: event.title,
          date: event.date,
          location: event.location,
          slug: event.slug,
        })),

        // Company Information
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        companyPhone: formData.companyPhone,
        companyAddress: formData.companyAddress,
        companyType: formData.companyType,
        subType: formData.subType,
        companySize: formData.companySize,
        companyCommunity: formData.companyCommunity,
        xenLevel: formData.xenLevel,
        clientStatus: formData.clientStatus,
        linkedinUrl: formData.linkedinUrl,
        pitchDeckUrl: pitchDeckUrl,
        pitchDeckName: pitchDeckName,
        pitchDeckSize: pitchDeckSize,

        // Ticket Information
        ticketType: formData.ticketType,
        ticketName: pricing.ticketType,

        // Primary Contact
        primaryContactName: formData.primaryContactName,
        primaryContactEmail: formData.primaryContactEmail,
        primaryContactPhone: formData.primaryContactPhone,
        primaryContactDesignation: formData.primaryContactDesignation,

        // Personnel List
        personnel: formData.personnel.filter((p) => p.isAttending),

        // Additional Information
        specialRequests: formData.specialRequests,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,

        // Pricing Information
        totalCost: pricing.totalCost,
        baseAmount: pricing.baseAmount,
        discountAmount: pricing.discountAmount,
        isFree: pricing.isFree,
        attendingCount: pricing.attendingCount,
        selectedEventCount: pricing.selectedEventCount,
        freeMembers: pricing.freeMembers,
        paidMembers: pricing.paidMembers,
        isPartOfCommunity: pricing.isPartOfCommunity,
        savings: pricing.savings,

        // Agreement
        termsAccepted: formData.termsAccepted,
        privacyAccepted: formData.privacyAccepted,

        // Registration Status
        status: pricing.isFree ? "confirmed" : "pending", // Free registrations are confirmed immediately
        paymentStatus: pricing.isFree ? "completed" : "pending",
      };

      // Save season registration to database
      const registrationResult =
        await eventRegistrationService.createSeasonRegistration(
          registrationData
        );
      const registrationId = registrationResult.id;

      // If it's a free registration, complete immediately
      if (pricing.isFree) {
        // Send season registration confirmation email for free registrations
        const emailSent = await sendSeasonRegistrationEmail(
          registrationData,
          registrationId,
          season
        );

        // Show success toast and page for free registrations
        toastUtils.success(
          `🎉 Season registration completed successfully! Your registration ID is: ${registrationId}. Welcome to Season ${season} Events!${
            emailSent
              ? " Confirmation email sent."
              : " Note: Email notification may be delayed."
          }`,
          { autoClose: 10000 }
        );

        setSuccessData({
          registrationId,
          companyName: formData.companyName,
          season: season,
          ticketType: pricing.ticketType,
          totalCost: 0,
          eventTitle: `Season ${season} Events`,
        });
        setShowSuccessPage(true);
      } else {
        // Process payment for paid registrations
        try {
          await processPayment(registrationData, registrationId, pricing);

          // Show success toast and page for paid registrations
          toastUtils.success(
            `🎉 Payment successful! Season ${season} registration completed. Registration ID: ${registrationId}. You'll receive a confirmation email shortly.`,
            { autoClose: 12000 }
          );

          setSuccessData({
            registrationId,
            companyName: formData.companyName,
            season: season,
            ticketType: pricing.ticketType,
            totalCost: pricing.totalCost,
            eventTitle: `Season ${season} Events`,
          });
          setShowSuccessPage(true);
        } catch (paymentError) {
          if (paymentError.message === "Payment cancelled by user") {
            toastUtils.warning(
              `💳 Payment was cancelled. Your registration has been saved and you can complete the payment later. Registration ID: ${registrationId}. You can contact support to complete payment if needed.`,
              { autoClose: 10000 }
            );
          } else if (paymentError.message.includes("Payment gateway")) {
            toastUtils.error(
              `🔄 ${paymentError.message}. Registration ID: ${registrationId}. Please try again in a moment.`,
              { autoClose: 8000 }
            );
          } else if (paymentError.message.includes("Payment failed:")) {
            toastUtils.error(
              `❌ ${paymentError.message}. Registration ID: ${registrationId}. Please try a different payment method or contact support.`,
              { autoClose: 10000 }
            );
          } else {
            toastUtils.error(
              `⚠️ Payment could not be completed. Your registration has been saved. Registration ID: ${registrationId}. Error: ${paymentError.message}. Please contact support for assistance.`,
              { autoClose: 12000 }
            );
          }

          // Registration saved - user can manually navigate or retry payment if needed
        }
      }
    } catch (error) {
      console.error("Error submitting season registration:", error);
      toastUtils.error("Registration failed. Please try again.", {
        autoClose: 8000,
      });
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
            Loading season events...
          </h3>
        </div>
      </div>
    );
  }

  if (error || seasonEvents.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Icon
            icon="mdi:alert-circle"
            className="text-red-500 mx-auto mb-4"
            width={64}
          />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {error || `No events found for Season ${season}`}
          </h3>
          <p className="text-gray-500 mb-4">
            No upcoming events are available for registration in this season.
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

  const pricing = calculatePricing();

  return (
    <div className="min-h-screen bg-gray-50">
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
                text="← Back to Events"
                type="secondary"
                link="/events"
                className="text-sm bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
              Season {season} Registration
            </h1>
            <p className="text-white/90 mb-4 drop-shadow">
              Register once for the entire season and choose which events to
              attend
            </p>
            <div className="flex items-center space-x-6 text-white/80">
              <div className="flex items-center space-x-2">
                <Icon icon="mdi:calendar-range" width={20} />
                <span>Season {season}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon icon="mdi:calendar-multiple" width={16} />
                <span>{seasonEvents.length} events available</span>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <form onSubmit={handleSubmit}>
        <Container className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Selection */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Icon
                    icon="mdi:calendar-multiple"
                    width={24}
                    className="mr-2 text-brand-primary"
                  />
                  Select Events to Attend
                </h2>

                {errors.selectedEvents && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {errors.selectedEvents}
                  </div>
                )}

                <div className="space-y-4">
                  {seasonEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`border rounded-xl p-4 cursor-pointer transition-all ${
                        formData.selectedEvents.includes(event.id)
                          ? "border-brand-primary bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleEventSelection(event.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          <input
                            type="checkbox"
                            checked={formData.selectedEvents.includes(event.id)}
                            onChange={() => handleEventSelection(event.id)}
                            onClick={() => handleEventSelection(event.id)}
                            className="w-5 h-5 text-brand-primary border-gray-300 rounded focus:ring-brand-primary cursor-pointer"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {event.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Icon icon="mdi:calendar" width={16} />
                              <span>
                                {formatEventDate(event.date) || event.date}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon icon="mdi:map-marker" width={16} />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon icon="mdi:tag" width={16} />
                              <span>{event.category}</span>
                            </div>
                          </div>
                          {event.description && (
                            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Icon
                    icon="solar:buildings-2-bold"
                    width={24}
                    className="mr-2 text-brand-primary"
                  />
                  Company Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company Name */}
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

                  {/* Company Email */}
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

                  {/* Company Phone */}
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

                  {/* Community Membership */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Community Membership
                    </label>
                    <select
                      name="companyCommunity"
                      value={formData.companyCommunity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      {communityOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                          {option.id !== "none" &&
                            option.id !== "xen" &&
                            " (1 free GNP slot)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* XEN Membership Level - Only show if XEN Community is selected */}
                  {formData.companyCommunity === "xen" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        XEN Membership Level *
                      </label>
                      <select
                        name="xenLevel"
                        value={formData.xenLevel}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                          errors.xenLevel
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Select XEN level</option>
                        {xenLevelOptions.map((level) => (
                          <option key={level.id} value={level.id}>
                            {level.name}
                            {level.gnpOnly
                              ? " (1 free GNP slot only)"
                              : level.freeSlots === 5
                              ? " (5 free GNPs or 1 free ASP)"
                              : ""}
                          </option>
                        ))}
                      </select>
                      {errors.xenLevel && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.xenLevel}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Relationship with Company */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship with Company
                    </label>
                    <select
                      name="clientStatus"
                      value={formData.clientStatus}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      {clientStatusOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                          {option.specialOffer === "5_gnp_or_1_asp" &&
                            option.id === "existing-client" &&
                            " (5 free GNPs or 1 free ASP)"}
                          {option.specialOffer === "discount_only" &&
                            option.id === "sponsor-partner" &&
                            " (50% off: up to 5 GNPs or ASP)"}
                          {option.discount > 0 &&
                            !option.specialOffer &&
                            ` (${option.discount}% discount)`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Company Address */}
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

                  {/* Company Type */}
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

                  {/* Sub-type */}
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

                  {/* Company Size */}
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

                  {/* LinkedIn URL */}
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

                  {/* Pitch Deck Upload - Conditional based on company type */}
                  {formData.companyType && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {formData.companyType === "startup-corporate"
                          ? "Pitch Deck"
                          : "Corporate Deck"}{" "}
                        *
                      </label>
                      <input
                        type="file"
                        name="pitchDeck"
                        onChange={handleFileChange}
                        accept=".pdf,.ppt,.pptx"
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                          errors.pitchDeck
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300"
                        }`}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Upload your{" "}
                        {formData.companyType === "startup-corporate"
                          ? "pitch deck"
                          : "corporate deck"}{" "}
                        (PDF, PPT, PPTX - Max 10MB)
                      </p>
                      {errors.pitchDeck && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.pitchDeck}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Ticket Selection */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Icon
                    icon="solar:ticket-bold"
                    width={24}
                    className="mr-2 text-brand-primary"
                  />
                  Ticket Selection
                </h2>

                {/* Rule Violation Warning */}
                {errors.ruleViolation && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <Icon
                        icon="mdi:alert-circle"
                        width={20}
                        className="text-red-500 mr-2 mt-0.5"
                      />
                      <div>
                        <h4 className="text-red-800 font-medium mb-1">
                          Rule Violation
                        </h4>
                        <p className="text-red-700 text-sm">
                          {errors.ruleViolation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ticketTypes.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        formData.ticketType === ticket.id
                          ? "border-brand-primary bg-brand-primary/5"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      onClick={() =>
                        handleInputChange({
                          target: { name: "ticketType", value: ticket.id },
                        })
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <input
                              type="radio"
                              name="ticketType"
                              value={ticket.id}
                              checked={formData.ticketType === ticket.id}
                              onChange={handleInputChange}
                              className="text-brand-primary"
                            />
                            <h3 className="font-semibold text-gray-900">
                              {ticket.name}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {ticket.description}
                          </p>
                          <div className="text-2xl font-bold text-brand-primary">
                            ₹{ticket.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary Contact */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Icon
                    icon="solar:user-bold"
                    width={24}
                    className="mr-2 text-brand-primary"
                  />
                  Primary Contact Person
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary Contact Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      name="primaryContactName"
                      value={formData.primaryContactName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                        errors.primaryContactName
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Primary contact name"
                    />
                    {errors.primaryContactName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.primaryContactName}
                      </p>
                    )}
                  </div>

                  {/* Primary Contact Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      name="primaryContactEmail"
                      value={formData.primaryContactEmail}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                        errors.primaryContactEmail
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="contact@company.com"
                    />
                    {errors.primaryContactEmail && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.primaryContactEmail}
                      </p>
                    )}
                  </div>

                  {/* Primary Contact Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      name="primaryContactPhone"
                      value={formData.primaryContactPhone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                        errors.primaryContactPhone
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="+91 98765 43210"
                    />
                    {errors.primaryContactPhone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.primaryContactPhone}
                      </p>
                    )}
                  </div>

                  {/* Primary Contact Designation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation
                    </label>
                    <select
                      name="primaryContactDesignation"
                      value={formData.primaryContactDesignation}
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

              {/* Personnel Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Icon
                      icon="solar:users-group-two-rounded-bold"
                      width={24}
                      className="mr-2 text-brand-primary"
                    />
                    Team Members
                  </h2>
                  <Button
                    text="Add Person"
                    type="secondary"
                    onClick={addPersonnel}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-6">
                  {formData.personnel.map((person, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900">
                          Person {index + 1}
                          {index === 0 && (
                            <span className="text-sm text-gray-500 ml-2">
                              (Team Lead)
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {index === 0 && (
                            <Button
                              text="Copy Primary Contact"
                              type="secondary"
                              onClick={copyPrimaryContactToPerson1}
                              className="text-xs"
                              icon="mdi:content-copy"
                            />
                          )}
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={person.isAttending}
                              onChange={(e) =>
                                updatePersonnel(
                                  index,
                                  "isAttending",
                                  e.target.checked
                                )
                              }
                              className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                            />
                            <span className="text-sm text-gray-600">
                              Attending
                            </span>
                          </label>
                          {formData.personnel.length > 1 && (
                            <button
                              onClick={() => removePersonnel(index)}
                              className="text-xs text-dark cursor-pointer hover:bg-red-500 hover:text-white rounded-full flex  p-2"
                            >
                              <Icon
                                icon="mdi:delete"
                                width={16}
                                className="text-danger"
                              />
                            </button>
                          )}
                        </div>
                      </div>

                      {person.isAttending && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Name *
                            </label>
                            <input
                              type="text"
                              value={person.name}
                              onChange={(e) =>
                                updatePersonnel(index, "name", e.target.value)
                              }
                              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                                errors[`personnel_${index}_name`]
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                              placeholder="Full name"
                            />
                            {errors[`personnel_${index}_name`] && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors[`personnel_${index}_name`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email *
                            </label>
                            <input
                              type="email"
                              value={person.email}
                              onChange={(e) =>
                                updatePersonnel(index, "email", e.target.value)
                              }
                              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                                errors[`personnel_${index}_email`]
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                              placeholder="Email address"
                            />
                            {errors[`personnel_${index}_email`] && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors[`personnel_${index}_email`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone *
                            </label>
                            <input
                              type="tel"
                              value={person.phone}
                              onChange={(e) =>
                                updatePersonnel(index, "phone", e.target.value)
                              }
                              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                                errors[`personnel_${index}_phone`]
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                              placeholder="Phone number"
                            />
                            {errors[`personnel_${index}_phone`] && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors[`personnel_${index}_phone`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Designation *
                            </label>
                            <select
                              value={person.designation}
                              onChange={(e) =>
                                updatePersonnel(
                                  index,
                                  "designation",
                                  e.target.value
                                )
                              }
                              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                                errors[`personnel_${index}_designation`]
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                            >
                              <option value="">Select designation</option>
                              {designations.map((designation) => (
                                <option key={designation} value={designation}>
                                  {designation}
                                </option>
                              ))}
                            </select>
                            {errors[`personnel_${index}_designation`] && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors[`personnel_${index}_designation`]}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Icon
                    icon="solar:info-circle-bold"
                    width={24}
                    className="mr-2 text-brand-primary"
                  />
                  Additional Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Requests / Dietary Requirements
                    </label>
                    <textarea
                      name="specialRequests"
                      value={formData.specialRequests}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                      placeholder="Any special requirements or dietary restrictions..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        placeholder="Emergency contact person"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="tel"
                        name="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        placeholder="Emergency contact number"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Icon
                    icon="solar:shield-check-bold"
                    width={24}
                    className="mr-2 text-brand-primary"
                  />
                  Agreement
                </h2>

                <div className="space-y-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleInputChange}
                      className={`w-5 h-5 text-brand-primary border-gray-300 rounded focus:ring-brand-primary mt-1 ${
                        errors.termsAccepted ? "border-red-500" : ""
                      }`}
                    />
                    <span className="text-sm text-gray-700">
                      I accept the{" "}
                      <a
                        href="#"
                        className="text-brand-primary hover:underline"
                      >
                        Terms and Conditions
                      </a>{" "}
                      for season registration
                    </span>
                  </label>
                  {errors.termsAccepted && (
                    <p className="text-red-500 text-sm">
                      {errors.termsAccepted}
                    </p>
                  )}

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="privacyAccepted"
                      checked={formData.privacyAccepted}
                      onChange={handleInputChange}
                      className={`w-5 h-5 text-brand-primary border-gray-300 rounded focus:ring-brand-primary mt-1 ${
                        errors.privacyAccepted ? "border-red-500" : ""
                      }`}
                    />
                    <span className="text-sm text-gray-700">
                      I accept the{" "}
                      <a
                        href="#"
                        className="text-brand-primary hover:underline"
                      >
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                  {errors.privacyAccepted && (
                    <p className="text-red-500 text-sm">
                      {errors.privacyAccepted}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Pricing Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Icon
                          icon="solar:calculator-bold"
                          width={20}
                          className="mr-2 text-brand-primary"
                        />
                        Registration Summary
                      </h3>
                      {/* NEW badge for first-time visitors */}
                      {!localStorage.getItem("hasSeenPricingRules") && (
                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-600 rounded-full animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPricingModal(true);
                          setHighlightPricingButton(false);
                        }}
                        className={`flex cursor-pointer items-center space-x-1 px-3 py-1.5 text-xs font-medium text-brand-primary bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all duration-300 ${
                          highlightPricingButton
                            ? "animate-pulse ring-2 ring-brand-primary ring-opacity-75 shadow-lg scale-105"
                            : ""
                        }`}
                      >
                        <Icon icon="mdi:help-circle" width={14} />
                        <span>Pricing Rules</span>
                      </button>

                      {/* Tooltip */}
                      {highlightPricingButton && (
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg shadow-lg z-10 whitespace-nowrap animate-bounce">
                          Click here to understand pricing!
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}

                      {/* Glowing animation */}
                      {highlightPricingButton && (
                        <div className="absolute inset-0 rounded-lg bg-brand-primary opacity-20 animate-ping"></div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Season Info */}
                    <div className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          Season {season}
                        </span>
                        <span className="text-sm text-brand-primary font-semibold">
                          {seasonEvents.length} events
                        </span>
                      </div>
                    </div>

                    {/* Selected Ticket */}
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Selected Ticket:</span>
                        <span className="font-medium text-right">
                          {pricing.ticketType}
                        </span>
                      </div>
                    </div>

                    {/* Selected Events */}
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Selected Events:</span>
                        <span className="font-medium">
                          {pricing.selectedEventCount}
                        </span>
                      </div>
                    </div>

                    {/* Attending Count */}
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">People Attending:</span>
                        <span className="font-medium">
                          {pricing.attendingCount}
                        </span>
                      </div>
                    </div>

                    {/* Community */}
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Community:</span>
                        <span className="font-medium">
                          {pricing.companyCommunity}
                        </span>
                      </div>
                    </div>

                    {/* Relationship with Company */}
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Relationship:</span>
                        <span className="font-medium">
                          {pricing.clientStatus}
                        </span>
                      </div>
                    </div>

                    {/* Member Breakdown */}
                    {pricing.attendingCount > 0 &&
                      (pricing.isPartOfCommunity ||
                        formData.clientStatus !== "none") && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <div className="text-sm font-medium text-blue-900 mb-2">
                            Benefits Breakdown:
                          </div>
                          <div className="space-y-1 text-xs">
                            {formData.clientStatus === "existing-client" && (
                              <div className="text-green-700 text-xs mb-2 font-medium">
                                {formData.ticketType === "gnp"
                                  ? "Existing Client: 5 free GNP passes"
                                  : "Existing Client: 1 free ASP pass"}
                              </div>
                            )}
                            {formData.clientStatus === "sponsor-partner" && (
                              <div className="text-blue-700 text-xs mb-2 font-medium">
                                {formData.ticketType === "gnp"
                                  ? "Sponsor/Partner: 50% off up to 5 GNP passes"
                                  : "Sponsor/Partner: 50% off ASP pass"}
                              </div>
                            )}
                            {pricing.isPartOfCommunity &&
                              formData.clientStatus !== "existing-client" &&
                              formData.clientStatus !== "sponsor-partner" && (
                                <div className="text-green-700 text-xs mb-2 font-medium">
                                  {formData.companyCommunity === "xen" &&
                                  formData.xenLevel
                                    ? `XEN ${formData.xenLevel.toUpperCase()} Member: ${
                                        xenLevelOptions.find(
                                          (x) => x.id === formData.xenLevel
                                        )?.gnpOnly
                                          ? "1 free GNP slot only"
                                          : formData.ticketType === "gnp"
                                          ? "5 free GNP slots"
                                          : "1 free ASP"
                                      }`
                                    : formData.companyCommunity !== "none"
                                    ? `${
                                        communityOptions.find(
                                          (c) =>
                                            c.id === formData.companyCommunity
                                        )?.name
                                      }: 1 free GNP slot${
                                        formData.ticketType === "asp"
                                          ? " (GNP only, not applicable to ASP)"
                                          : ""
                                      }`
                                    : ""}
                                </div>
                              )}
                            {pricing.freeMembers > 0 && (
                              <div className="flex items-center justify-between text-green-700">
                                <span>Free Members:</span>
                                <span className="font-semibold">
                                  {pricing.freeMembers}
                                </span>
                              </div>
                            )}
                            {pricing.paidMembers > 0 && (
                              <div className="flex items-center justify-between text-blue-700">
                                <span>
                                  Paid Members{" "}
                                  {formData.clientStatus ===
                                    "sponsor-partner" &&
                                    "(50% discount applied)"}
                                  :
                                </span>
                                <span className="font-semibold">
                                  {pricing.paidMembers}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    <div className="border-t border-gray-200 pt-4">
                      {/* Base Amount */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {formData.ticketType === "asp"
                            ? "ASP Base Price (1-2 members):"
                            : pricing.isPartOfCommunity
                            ? "Regular Price (without benefits):"
                            : "Base Amount:"}
                        </span>
                        <span className="font-medium">
                          {formData.ticketType === "asp"
                            ? `₹${pricing.baseAmount.toLocaleString()}`
                            : pricing.isPartOfCommunity
                            ? `₹${(
                                pricing.baseAmount * pricing.attendingCount
                              ).toLocaleString()}`
                            : `₹${pricing.baseAmount.toLocaleString()}`}
                        </span>
                      </div>

                      {/* Community Benefits */}
                      {pricing.isPartOfCommunity && pricing.savings > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Community Savings:</span>
                          <span>-₹{pricing.savings.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Total */}
                      <div className="flex items-center justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Total Amount:</span>
                        <span className="text-brand-primary">
                          {pricing.isFree
                            ? "FREE"
                            : `₹${pricing.totalCost.toLocaleString()}`}
                        </span>
                      </div>

                      {/* Savings */}
                      {pricing.savings > 0 && (
                        <div className="text-center text-sm text-green-600 mt-2">
                          You save ₹{pricing.savings.toLocaleString()}!
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      text={
                        isUploadingFile
                          ? "Uploading file..."
                          : isSubmitting
                          ? "Processing..."
                          : pricing.isFree
                          ? "Complete Registration (FREE)"
                          : `Complete Registration (₹${pricing.totalCost.toLocaleString()})`
                      }
                      type="primary"
                      onClick={handleSubmit}
                      disabled={isSubmitting || isUploadingFile}
                      className="w-full mt-6"
                    />

                    {/* Help Text */}
                    <div className="text-xs text-gray-500 text-center mt-4">
                      <p>
                        *{" "}
                        <strong>
                          FREE SLOTS: GNP ONLY (except XEN X2+ & Existing
                          Clients get ASP too)
                        </strong>
                      </p>
                      <p>* XEV.FIN/XEVTG/XD&D: 1 free GNP slot</p>
                      <p>
                        * XEN X1: 1 free GNP slot | XEN X2+: 5 free GNPs or 1
                        free ASP
                      </p>
                      <p>* Existing clients: 5 free GNPs OR 1 free ASP</p>
                      <p>* Sponsors/Partners: 50% off (up to 5 GNPs or ASP)</p>
                      <p>
                        * <strong>ASP: Fixed ₹60,000 for 1-2 members</strong>
                      </p>
                      <p>* Former clients: 25% discount</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </form>

      {/* Pricing Rules Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Icon
                    icon="mdi:information"
                    width={24}
                    className="mr-2 text-brand-primary"
                  />
                  Complete Pricing Rules & Benefits
                </h2>
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Icon icon="mdi:close" width={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Ticket Types */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <Icon icon="solar:ticket-bold" width={20} className="mr-2" />
                  Ticket Types
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      General Networking Pass (GNP)
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      ₹8,000 per member
                    </p>
                    <p className="text-xs text-gray-500">
                      Access to networking sessions and general event activities
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Active Support Pass (ASP)
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      ₹60,000 fixed price
                    </p>
                    <p className="text-xs text-gray-500">
                      Full access to all sessions. Fixed price for 1-2 members
                      maximum per company.
                    </p>
                  </div>
                </div>
              </div>

              {/* Free Benefits */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                  <Icon icon="mdi:gift" width={20} className="mr-2" />
                  Free Benefits (Priority Order)
                </h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      1. Existing Clients (Highest Priority)
                    </h4>
                    <div className="text-sm space-y-1">
                      <p>
                        • <strong>GNP:</strong> 5 free passes (additional
                        members pay ₹8,000 each)
                      </p>
                      <p>
                        • <strong>ASP:</strong> 1 completely free ASP (₹0 total
                        cost)
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      2. XEN Community Levels
                    </h4>
                    <div className="text-sm space-y-1">
                      <p>
                        • <strong>XEN X1:</strong> 1 free GNP slot only (no ASP
                        benefits)
                      </p>
                      <p>
                        • <strong>XEN X2-X5:</strong> 5 free GNPs OR 1 free ASP
                        (same as existing clients)
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      3. Other Community Members (GNP Only)
                    </h4>
                    <div className="text-sm space-y-1">
                      <p>
                        • <strong>XEV.FIN:</strong> 1 free GNP slot
                      </p>
                      <p>
                        • <strong>XEVTG:</strong> 1 free GNP slot
                      </p>
                      <p>
                        • <strong>XD&D:</strong> 1 free GNP slot
                      </p>
                      <p className="text-red-600">
                        • <strong>Note:</strong> No ASP benefits for these
                        communities
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount Benefits */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center">
                  <Icon icon="mdi:percent" width={20} className="mr-2" />
                  Discount Benefits
                </h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Sponsors/Partners (50% Discount)
                    </h4>
                    <div className="text-sm space-y-1">
                      <p>
                        • <strong>GNP:</strong> 50% off up to 5 members (₹4,000
                        each), then ₹8,000 for additional
                      </p>
                      <p>
                        • <strong>ASP:</strong> 50% off fixed price (₹30,000)
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Former Clients (25% Discount)
                    </h4>
                    <div className="text-sm space-y-1">
                      <p>
                        • <strong>GNP:</strong> 25% off all members (₹6,000
                        each)
                      </p>
                      <p>
                        • <strong>ASP:</strong> 25% off fixed price (₹45,000)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Rules */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                  <Icon icon="mdi:alert" width={20} className="mr-2" />
                  Important Rules & Limitations
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    • <strong>ASP Limit:</strong> Maximum 2 members per ASP
                    ticket
                  </p>
                  <p>
                    • <strong>Company Purchase:</strong> 1 ASP maximum OR
                    multiple GNPs per company
                  </p>
                  <p>
                    • <strong>Free Slot Priority:</strong> Existing Client → XEN
                    X2+ → Community Benefits
                  </p>
                  <p>
                    • <strong>No Benefit Stacking:</strong> Cannot combine
                    existing client + XEN X2+ benefits
                  </p>
                  <p>
                    • <strong>ASP Pricing:</strong> Fixed ₹60,000 covers 1-2
                    members (not per member)
                  </p>
                  <p>
                    • <strong>Free ASP Access:</strong> Only Existing Clients &
                    XEN X2+ levels
                  </p>
                </div>
              </div>

              {/* Examples */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Icon icon="mdi:lightbulb" width={20} className="mr-2" />
                  Pricing Examples
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-3 border">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Example 1: Existing Client + GNP
                    </h4>
                    <p>3 members, GNP ticket</p>
                    <p className="text-green-600">
                      • 3 members = FREE (5 free slots available)
                    </p>
                    <p className="font-medium">Total: ₹0</p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Example 2: XEN X1 + GNP
                    </h4>
                    <p>3 members, GNP ticket</p>
                    <p className="text-green-600">• 1 member = FREE</p>
                    <p className="text-blue-600">• 2 members = ₹16,000</p>
                    <p className="font-medium">Total: ₹16,000</p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Example 3: Sponsor + ASP
                    </h4>
                    <p>2 members, ASP ticket</p>
                    <p className="text-orange-600">• 50% discount on ₹60,000</p>
                    <p className="font-medium">Total: ₹30,000</p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Example 4: XEN X3 + ASP
                    </h4>
                    <p>2 members, ASP ticket</p>
                    <p className="text-green-600">• 1 free ASP = FREE</p>
                    <p className="font-medium">Total: ₹0</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
              <button
                onClick={() => setShowPricingModal(false)}
                className="w-full bg-brand-primary text-white py-2 px-4 rounded-lg hover:bg-brand-primary/90 transition-colors font-medium"
              >
                Got it, close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
