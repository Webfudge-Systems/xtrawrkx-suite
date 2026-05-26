"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import AdminLayout from "@/src/components/admin/AdminLayout";
import ProtectedRoute from "@/src/components/admin/ProtectedRoute";
import { eventService } from "@/src/services/databaseService";
import { uploadImage } from "@/src/services/cloudinaryService";
import Button from "@/src/components/common/Button";

export default function NewEvent() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "Summit",
    season: "individual",
    date: "",
    time: "",
    location: "",
    venue: "",
    price: "",
    capacity: "",
    description: "",
    longDescription: "",
    heroImage: "",
    background: "",
    status: "upcoming",
    agenda: [],
    speakers: [],
    registrationEnabled: true,
    registrationDeadline: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [uploading, setUploading] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    "Summit",
    "Workshop",
    "Conference",
    "Competition",
    "Networking",
    "Webinar",
    "Panel Discussion",
  ];

  const statusOptions = ["upcoming", "ongoing", "completed", "cancelled"];

  const seasonOptions = [
    "individual",
    "XSOS2024",
    "XSOS2025",
    "XSOS2026",
    "XSOS2027",
    "XSOS2028",
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Auto-generate slug from title
    if (name === "title") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({
        ...prev,
        slug,
      }));
    }

    // Clear errors
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // Clear any previous errors for this field
    setErrors((prev) => ({ ...prev, [field]: "" }));

    try {
      setUploading(true);
      setUploadingField(field);

      console.log(`Uploading ${field}:`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      const result = await uploadImage(file, {
        folder: "events",
      });

      console.log(`Upload successful for ${field}:`, result.url);

      setFormData((prev) => ({
        ...prev,
        [field]: result.url,
      }));
    } catch (error) {
      console.error(`Error uploading ${field}:`, error);
      setErrors((prev) => ({
        ...prev,
        [field]: `Upload failed: ${error.message}`,
      }));
    } finally {
      setUploading(false);
      setUploadingField(null);
    }
  };

  const handleSpeakerImageUpload = async (index, file) => {
    if (!file) return;

    try {
      setUploading(true);
      setUploadingField(`speaker-${index}`);
      const result = await uploadImage(file, {
        folder: "events/speakers",
      });
      updateSpeaker(index, "image", result.url);
    } catch (error) {
      console.error("Error uploading speaker image:", error);
      setErrors((prev) => ({
        ...prev,
        [`speaker-${index}`]: `Upload failed: ${error.message}`,
      }));
    } finally {
      setUploading(false);
      setUploadingField(null);
    }
  };

  const addAgendaItem = () => {
    setFormData((prev) => ({
      ...prev,
      agenda: [
        ...prev.agenda,
        { time: "", title: "", description: "", speaker: "" },
      ],
    }));
  };

  const updateAgendaItem = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      agenda: prev.agenda.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeAgendaItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index),
    }));
  };

  const addSpeaker = () => {
    setFormData((prev) => ({
      ...prev,
      speakers: [
        ...prev.speakers,
        { name: "", title: "", company: "", bio: "", image: "" },
      ],
    }));
  };

  const updateSpeaker = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      speakers: prev.speakers.map((speaker, i) =>
        i === index ? { ...speaker, [field]: value } : speaker
      ),
    }));
  };

  const removeSpeaker = (index) => {
    setFormData((prev) => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.time.trim()) newErrors.time = "Time is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.venue.trim()) newErrors.venue = "Venue is required";
    if (!formData.price.trim()) newErrors.price = "Price is required";
    if (!formData.capacity.trim()) newErrors.capacity = "Capacity is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setErrors((prev) => ({
        ...prev,
        submit: "Please correct the errors in the form before submitting.",
      }));
      return;
    }

    setSaving(true);

    try {
      // Convert date string to Date object if needed
      const eventData = {
        ...formData,
        date: formData.date ? new Date(formData.date) : new Date(),
        registrationDeadline: formData.registrationDeadline
          ? new Date(formData.registrationDeadline)
          : null,
      };

      await eventService.createEvent(eventData);
      router.push("/admin/events");
    } catch (error) {
      console.error("Error creating event:", error);
      setErrors((prev) => ({
        ...prev,
        submit: `Error creating event: ${error.message}`,
      }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <AdminLayout title="Create New Event">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Create New Event
                </h1>
                <p className="text-gray-600 mt-2">
                  Create a new event with all necessary details and information
                </p>
              </div>
              <Button
                text="Back to Events"
                type="secondary"
                link="/admin/events"
                className="text-sm"
              />
            </div>
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:alert-circle" width={20} />
                {errors.submit}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Icon
                  icon="mdi:information"
                  width={24}
                  className="text-primary"
                />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                      errors.title
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter event title"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                      errors.slug
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="event-url-slug"
                  />
                  {errors.slug && (
                    <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Season / Registration Type
                  </label>
                  <select
                    name="season"
                    value={formData.season}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {seasonOptions.map((season) => (
                      <option key={season} value={season}>
                        {season === "individual" ? "Individual Event" : season}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.season === "individual"
                      ? "Individual event registration form will be shown"
                      : "Season registration form will be shown"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                      errors.date
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.date && (
                    <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time *
                  </label>
                  <input
                    type="text"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                      errors.time
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="e.g., 9:00 AM - 6:00 PM"
                  />
                  {errors.time && (
                    <p className="text-red-500 text-sm mt-1">{errors.time}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                      errors.location
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="City, State/Country"
                  />
                  {errors.location && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.location}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Venue *
                  </label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                      errors.venue
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Venue name"
                  />
                  {errors.venue && (
                    <p className="text-red-500 text-sm mt-1">{errors.venue}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price *
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                      errors.price
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="e.g., Free, ₹5,000"
                  />
                  {errors.price && (
                    <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                      errors.capacity
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="100"
                  />
                  {errors.capacity && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.capacity}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="contact@xtrawrkx.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+91 12345 67890"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Icon icon="mdi:text" width={24} className="text-primary" />
                Description
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Short Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-colors ${
                      errors.description
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Brief description that appears in event cards..."
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Detailed Description
                  </label>
                  <textarea
                    name="longDescription"
                    value={formData.longDescription}
                    onChange={handleInputChange}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Detailed description that appears on the event page..."
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Icon icon="mdi:image" width={24} className="text-primary" />
                Event Images
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Thumbnail Image
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "heroImage")}
                      disabled={uploading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {uploadingField === "heroImage" && (
                      <div className="flex items-center gap-2 text-primary">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        Uploading...
                      </div>
                    )}
                    {errors.heroImage && (
                      <p className="text-red-500 text-sm">{errors.heroImage}</p>
                    )}
                    {formData.heroImage && (
                      <div className="relative">
                        <img
                          src={formData.heroImage}
                          alt="Hero preview"
                          className="w-full h-40 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, heroImage: "" }))
                          }
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Background Image
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "background")}
                      disabled={uploading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {uploadingField === "background" && (
                      <div className="flex items-center gap-2 text-primary">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        Uploading...
                      </div>
                    )}
                    {errors.background && (
                      <p className="text-red-500 text-sm">
                        {errors.background}
                      </p>
                    )}
                    {formData.background && (
                      <div className="relative">
                        <img
                          src={formData.background}
                          alt="Background preview"
                          className="w-full h-40 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, background: "" }))
                          }
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Icon
                  icon="mdi:account-plus"
                  width={24}
                  className="text-primary"
                />
                Registration Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="registrationEnabled"
                      checked={formData.registrationEnabled}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Enable Registration
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Registration Deadline
                  </label>
                  <input
                    type="date"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Agenda */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Icon
                    icon="mdi:calendar-clock"
                    width={24}
                    className="text-primary"
                  />
                  Event Agenda
                </h2>
                <button
                  type="button"
                  onClick={addAgendaItem}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Icon icon="mdi:plus" width={16} />
                  Add Item
                </button>
              </div>

              {formData.agenda.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No agenda items yet</p>
                  <p className="text-sm">
                    Click "Add Item" to create your event schedule
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {formData.agenda.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-6 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">
                        Agenda Item {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeAgendaItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Icon icon="mdi:delete" width={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time
                        </label>
                        <input
                          type="text"
                          value={item.time}
                          onChange={(e) =>
                            updateAgendaItem(index, "time", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="e.g., 10:00 AM"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Speaker
                        </label>
                        <input
                          type="text"
                          value={item.speaker}
                          onChange={(e) =>
                            updateAgendaItem(index, "speaker", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Speaker name"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            updateAgendaItem(index, "title", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Session title"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={item.description}
                          onChange={(e) =>
                            updateAgendaItem(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                          placeholder="Session description"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Speakers */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Icon
                    icon="mdi:account-group"
                    width={24}
                    className="text-primary"
                  />
                  Event Speakers
                </h2>
                <button
                  type="button"
                  onClick={addSpeaker}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Icon icon="mdi:plus" width={16} />
                  Add Speaker
                </button>
              </div>

              {formData.speakers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No speakers added yet</p>
                  <p className="text-sm">
                    Click "Add Speaker" to add event speakers
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {formData.speakers.map((speaker, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-6 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">
                        Speaker {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeSpeaker(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Icon icon="mdi:delete" width={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Speaker Photo
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleSpeakerImageUpload(index, e.target.files[0])
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
                        />
                        {uploadingField === `speaker-${index}` && (
                          <div className="flex items-center gap-2 text-primary mt-2">
                            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                            Uploading...
                          </div>
                        )}
                        {speaker.image && (
                          <div className="mt-3 relative inline-block">
                            <img
                              src={speaker.image}
                              alt={speaker.name}
                              className="w-20 h-20 object-cover rounded-full border-2 border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => updateSpeaker(index, "image", "")}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={speaker.name}
                          onChange={(e) =>
                            updateSpeaker(index, "name", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Speaker name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={speaker.title}
                          onChange={(e) =>
                            updateSpeaker(index, "title", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Job title"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company
                        </label>
                        <input
                          type="text"
                          value={speaker.company}
                          onChange={(e) =>
                            updateSpeaker(index, "company", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Company name"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bio
                        </label>
                        <textarea
                          value={speaker.bio}
                          onChange={(e) =>
                            updateSpeaker(index, "bio", e.target.value)
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                          placeholder="Speaker biography"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4 pb-8">
              <Button text="Cancel" type="secondary" link="/admin/events" />
              <button
                type="submit"
                disabled={saving || uploading}
                className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-xl font-semibold hover:from-primary/90 hover:to-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {saving && (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                )}
                {saving ? "Creating..." : "Create Event"}
              </button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
