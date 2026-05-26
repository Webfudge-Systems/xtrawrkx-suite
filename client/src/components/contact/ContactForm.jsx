"use client";
import { useState } from "react";
import { Icon } from "@iconify/react";
import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import SectionHeader from "@/src/components/common/SectionHeader";
import Button from "../common/Button";
import { commonToasts, toastUtils } from "@/src/utils/toast";

const inquiryTypes = [
  { value: "", label: "Select Inquiry Type" },
  { value: "services", label: "Services & Solutions" },
  { value: "community", label: "Community Membership" },
  { value: "events", label: "Events & Workshops" },
  { value: "partnership", label: "Partnership Opportunities" },
  { value: "support", label: "Technical Support" },
  { value: "feedback", label: "Feedback & Suggestions" },
  { value: "media", label: "Media & Press" },
  { value: "general", label: "General Inquiry" },
];

const purposes = [
  { value: "", label: "Select Purpose" },
  { value: "information", label: "Request Information" },
  { value: "quote", label: "Get a Quote" },
  { value: "consultation", label: "Schedule Consultation" },
  { value: "join", label: "Join Community/Event" },
  { value: "collaboration", label: "Explore Collaboration" },
  { value: "support", label: "Technical Support" },
  { value: "complaint", label: "File a Complaint" },
  { value: "other", label: "Other" },
];

const hearAboutUs = [
  { value: "", label: "How did you hear about us?" },
  { value: "search", label: "Search Engine" },
  { value: "social", label: "Social Media" },
  { value: "referral", label: "Referral from Friend/Colleague" },
  { value: "event", label: "Event/Conference" },
  { value: "email", label: "Email Marketing" },
  { value: "advertisement", label: "Online Advertisement" },
  { value: "news", label: "News/Article" },
  { value: "other", label: "Other" },
];

const priorities = [
  { value: "low", label: "Low - General Inquiry" },
  { value: "medium", label: "Medium - Business Related" },
  { value: "high", label: "High - Urgent Matter" },
];

export default function ContactForm() {
  const [form, setForm] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",

    // Organization Information
    company: "",
    jobTitle: "",
    website: "",

    // Inquiry Details
    inquiryType: "",
    purpose: "",
    priority: "medium",

    // Contact Preferences
    preferredContact: "email",
    bestTimeToCall: "",

    // Additional Information
    hearAboutUs: "",
    message: "",

    // Consent
    newsletter: false,
    privacy: false,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (!form.inquiryType) newErrors.inquiryType = "Please select inquiry type";
    if (!form.purpose) newErrors.purpose = "Please select purpose";
    if (!form.message.trim()) newErrors.message = "Message is required";
    if (!form.privacy) newErrors.privacy = "You must agree to privacy policy";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const loadingToast = toastUtils.loading("Sending your message...");

      try {
        // Submit contact inquiry to API
        const response = await fetch("/api/contact-inquiry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Success
          toastUtils.update(
            loadingToast,
            "success",
            "Thank you for your inquiry! We'll get back to you soon. Check your email for confirmation."
          );

          // Reset form after successful submission
          setForm({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            company: "",
            jobTitle: "",
            website: "",
            inquiryType: "",
            purpose: "",
            priority: "medium",
            preferredContact: "email",
            bestTimeToCall: "",
            hearAboutUs: "",
            message: "",
            newsletter: false,
            privacy: false,
          });
        } else {
          throw new Error(result.error || "Failed to submit inquiry");
        }
      } catch (error) {
        // Error
        toastUtils.update(
          loadingToast,
          "error",
          "Failed to send your message. Please try again."
        );
      }
    } else {
      toastUtils.validationError(
        "Please fill in all required fields correctly."
      );
    }
  };

  return (
    <Section>
      <Container>
        <div className="mb-12">
          <SectionHeader
            label="Get in Touch"
            title="Tell us about your inquiry"
          />
          <p className="text-lg text-gray-600 max-w-2xl">
            Please provide as much detail as possible so we can better assist
            you with your specific needs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Icon icon="solar:user-bold" className="mr-2" width={24} />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className={`w-full border-b-2 focus:border-brand-primary outline-none py-3 px-2 bg-transparent transition-colors ${
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
                  value={form.lastName}
                  onChange={handleChange}
                  className={`w-full border-b-2 focus:border-brand-primary outline-none py-3 px-2 bg-transparent transition-colors ${
                    errors.lastName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full border-b-2 focus:border-brand-primary outline-none py-3 px-2 bg-transparent transition-colors ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={`w-full border-b-2 focus:border-brand-primary outline-none py-3 px-2 bg-transparent transition-colors ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Organization Information Section */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Icon icon="solar:buildings-2-bold" className="mr-2" width={24} />
              Organization Information (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company/Organization
                </label>
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  className="w-full border-b-2 border-gray-300 focus:border-brand-primary outline-none py-3 px-2 bg-transparent transition-colors"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title/Position
                </label>
                <input
                  type="text"
                  name="jobTitle"
                  value={form.jobTitle}
                  onChange={handleChange}
                  className="w-full border-b-2 border-gray-300 focus:border-brand-primary outline-none py-3 px-2 bg-transparent transition-colors"
                  placeholder="Your job title"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  className="w-full border-b-2 border-gray-300 focus:border-brand-primary outline-none py-3 px-2 bg-transparent transition-colors"
                  placeholder="https://www.example.com"
                />
              </div>
            </div>
          </div>

          {/* Inquiry Details Section */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Icon
                icon="solar:question-circle-bold"
                className="mr-2"
                width={24}
              />
              Inquiry Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What is your inquiry about? *
                </label>
                <select
                  name="inquiryType"
                  value={form.inquiryType}
                  onChange={handleChange}
                  className={`w-full border-b-2 focus:border-brand-primary outline-none py-3 px-2 bg-transparent transition-colors ${
                    errors.inquiryType ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  {inquiryTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.inquiryType && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.inquiryType}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose of reaching out *
                </label>
                <select
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  className={`w-full border-b-2 focus:border-brand-primary outline-none py-3 px-2 bg-transparent transition-colors ${
                    errors.purpose ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  {purposes.map((purpose) => (
                    <option key={purpose.value} value={purpose.value}>
                      {purpose.label}
                    </option>
                  ))}
                </select>
                {errors.purpose && (
                  <p className="text-red-500 text-sm mt-1">{errors.purpose}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full border-b-2 border-gray-300 focus:border-brand-primary outline-none py-3 px-2 bg-transparent transition-colors"
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How did you hear about us?
                </label>
                <select
                  name="hearAboutUs"
                  value={form.hearAboutUs}
                  onChange={handleChange}
                  className="w-full border-b-2 border-gray-300 focus:border-brand-primary outline-none py-3 px-2 bg-transparent transition-colors"
                >
                  {hearAboutUs.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Preferences Section */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Icon icon="solar:phone-bold" className="mr-2" width={24} />
              Contact Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Contact Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="preferredContact"
                      value="email"
                      checked={form.preferredContact === "email"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Email
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="preferredContact"
                      value="phone"
                      checked={form.preferredContact === "phone"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Phone Call
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="preferredContact"
                      value="both"
                      checked={form.preferredContact === "both"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Either Email or Phone
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Best Time to Call (if phone selected)
                </label>
                <input
                  type="text"
                  name="bestTimeToCall"
                  value={form.bestTimeToCall}
                  onChange={handleChange}
                  className="w-full border-b-2 border-gray-300 focus:border-brand-primary outline-none py-3 px-2 bg-transparent transition-colors"
                  placeholder="e.g., Weekdays 9 AM - 5 PM EST"
                />
              </div>
            </div>
          </div>

          {/* Message Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Message *
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={6}
              className={`w-full border-2 rounded-lg focus:border-brand-primary outline-none py-3 px-4 transition-colors resize-none ${
                errors.message ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Please provide detailed information about your inquiry, specific requirements, timeline, budget (if applicable), and any other relevant details that will help us assist you better."
            />
            {errors.message && (
              <p className="text-red-500 text-sm mt-1">{errors.message}</p>
            )}
          </div>

          {/* Consent Section */}
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                name="privacy"
                checked={form.privacy}
                onChange={handleChange}
                className="mr-3 mt-1"
              />
              <label className="text-sm text-gray-700">
                I agree to the{" "}
                <a
                  href="/privacy-policy"
                  className="text-brand-primary hover:underline"
                >
                  Privacy Policy
                </a>{" "}
                and consent to the processing of my personal data for the
                purpose of responding to my inquiry. *
              </label>
            </div>
            {errors.privacy && (
              <p className="text-red-500 text-sm">{errors.privacy}</p>
            )}

            <div className="flex items-start">
              <input
                type="checkbox"
                name="newsletter"
                checked={form.newsletter}
                onChange={handleChange}
                className="mr-3 mt-1"
              />
              <label className="text-sm text-gray-700">
                I would like to receive updates, newsletters, and promotional
                content from Xtrawrkx (Optional)
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-start pt-6">
            <Button type="primary" text="Submit Inquiry" className="text-lg" />
          </div>
        </form>
      </Container>
    </Section>
  );
}
