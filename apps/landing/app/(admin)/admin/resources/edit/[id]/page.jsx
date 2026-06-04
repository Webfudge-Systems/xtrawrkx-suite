"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Icon } from "@iconify/react";
import AdminLayout from "@/src/components/admin/AdminLayout";
import ProtectedRoute from "@/src/components/admin/ProtectedRoute";
import { resourceService } from "@/src/services/databaseService";
import { uploadImage, uploadFile } from "@/src/services/cloudinaryService";
import Button from "@/src/components/common/Button";
import { formatDateForInput } from "@/src/utils/dateUtils";

export default function EditResource({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    type: "whitepaper",
    category: "Technology",
    description: "",
    excerpt: "",
    author: "",
    publishedDate: "",
    readTime: "",
    downloadUrl: "",
    youtubeUrl: "",
    image: "",
    tags: [],
    featured: false,
    views: 0,
    downloads: 0,
    status: "published",
    content: "",
  });

  const [uploading, setUploading] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [currentTag, setCurrentTag] = useState("");

  const resourceTypes = [
    "whitepaper",
    "article",
    "report",
    "interview",
    "newsletter",
  ];

  const resourceCategories = [
    "Finance",
    "Technology",
    "Manufacturing",
    "Market Analysis",
    "Sustainability",
    "Regulatory",
    "Investment",
  ];

  const statusOptions = ["published", "draft", "archived"];

  // Load existing resource
  useEffect(() => {
    const loadResource = async () => {
      try {
        setLoading(true);
        const resource = await resourceService.getById(id);

        if (!resource) {
          router.push("/admin/resources");
          return;
        }

        setFormData({
          title: resource.title || "",
          slug: resource.slug || "",
          type: resource.type || "whitepaper",
          category: resource.category || "Technology",
          description: resource.description || "",
          excerpt: resource.excerpt || "",
          author: resource.author || "",
          publishedDate: formatDateForInput(resource.publishedDate),
          readTime: resource.readTime || "",
          downloadUrl: resource.downloadUrl || "",
          youtubeUrl: resource.youtubeUrl || "",
          image: resource.image || "",
          tags: resource.tags || [],
          featured: resource.featured || false,
          views: resource.views || 0,
          downloads: resource.downloads || 0,
          status: resource.status || "published",
          content: resource.content || "",
        });
      } catch (error) {
        console.error("Error loading resource:", error);
        setErrors({ submit: "Failed to load resource" });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadResource();
    }
  }, [id, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Auto-generate slug from title only if we're editing the title
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

    try {
      setUploading(true);
      setUploadingField(field);
      const result = await uploadImage(file, {
        folder: "resources",
      });
      setFormData((prev) => ({
        ...prev,
        [field]: result.url,
      }));
    } catch (error) {
      console.error("Error uploading file:", error);
      setErrors((prev) => ({
        ...prev,
        [field]: `Upload failed: ${error.message}`,
      }));
    } finally {
      setUploading(false);
      setUploadingField(null);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setErrors((prev) => ({
        ...prev,
        downloadUrl: "Please upload a PDF file only",
      }));
      return;
    }

    try {
      setUploading(true);
      setUploadingField("downloadUrl");
      const result = await uploadFile(file, {
        folder: "resources/documents",
      });
      setFormData((prev) => ({
        ...prev,
        downloadUrl: result.url,
      }));
    } catch (error) {
      console.error("Error uploading PDF:", error);
      setErrors((prev) => ({
        ...prev,
        downloadUrl: `Upload failed: ${error.message}`,
      }));
    } finally {
      setUploading(false);
      setUploadingField(null);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.author.trim()) newErrors.author = "Author is required";
    if (!formData.readTime.trim()) newErrors.readTime = "Read time is required";

    // Excerpt is only required for articles
    if (formData.type === "article" && !formData.excerpt.trim()) {
      newErrors.excerpt = "Excerpt is required";
    }

    // Content is only required for articles
    if (formData.type === "article" && !formData.content.trim()) {
      newErrors.content = "Content is required";
    }

    // YouTube URL is required for interviews
    if (formData.type === "interview" && !formData.youtubeUrl.trim()) {
      newErrors.youtubeUrl = "YouTube URL is required for interviews";
    }

    // Validate YouTube URL format if provided
    if (formData.youtubeUrl.trim() && formData.type === "interview") {
      const youtubeRegex =
        /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/;
      if (!youtubeRegex.test(formData.youtubeUrl)) {
        newErrors.youtubeUrl = "Please enter a valid YouTube URL";
      }
    }

    // PDF is required for whitepapers, reports, and newsletters only
    if (
      (formData.type === "whitepaper" ||
        formData.type === "report" ||
        formData.type === "newsletter") &&
      !formData.downloadUrl
    ) {
      newErrors.downloadUrl =
        "PDF file is required for whitepapers, reports, and newsletters";
    }

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
      const resourceData = {
        ...formData,
        publishedDate: formData.publishedDate
          ? new Date(formData.publishedDate)
          : new Date(),
      };

      await resourceService.update(id, resourceData);
      router.push("/admin/resources");
    } catch (error) {
      console.error("Error updating resource:", error);
      setErrors((prev) => ({
        ...prev,
        submit: `Error updating resource: ${error.message}`,
      }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout title="Edit Resource">
          <div className="max-w-5xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
              <div className="space-y-8">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
                  >
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AdminLayout title="Edit Resource">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Edit Resource
                </h1>
                <p className="text-gray-600 mt-2">
                  Update the resource information
                </p>
              </div>
              <Button
                text="Back to Resources"
                type="secondary"
                link="/admin/resources"
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
                    Resource Title *
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
                    placeholder="Enter resource title"
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
                    placeholder="resource-url-slug"
                  />
                  {errors.slug && (
                    <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Resource Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {resourceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
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
                    {resourceCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Author *
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                      errors.author
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Author name"
                  />
                  {errors.author && (
                    <p className="text-red-500 text-sm mt-1">{errors.author}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Read Time *
                  </label>
                  <input
                    type="text"
                    name="readTime"
                    value={formData.readTime}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                      errors.readTime
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="e.g., 12 min read"
                  />
                  {errors.readTime && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.readTime}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Published Date
                  </label>
                  <input
                    type="date"
                    name="publishedDate"
                    value={formData.publishedDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
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

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Featured Resource
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Content - Only show for articles */}
            {formData.type === "article" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Icon icon="mdi:text" width={24} className="text-primary" />
                  Content
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
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-colors ${
                        errors.description
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Brief description that appears in resource cards..."
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Excerpt - Only show for articles and interviews */}
                  {(formData.type === "article" ||
                    formData.type === "interview") && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Excerpt *
                      </label>
                      <textarea
                        name="excerpt"
                        value={formData.excerpt}
                        onChange={handleInputChange}
                        rows={4}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-colors ${
                          errors.excerpt
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300"
                        }`}
                        placeholder="Longer excerpt that appears on resource detail pages..."
                      />
                      {errors.excerpt && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.excerpt}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Content *
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows={12}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-colors ${
                        errors.content
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Full content of the resource (HTML allowed)..."
                    />
                    {errors.content && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.content}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      You can use HTML tags for formatting. This content will be
                      displayed on the resource detail page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Description & Excerpt for all types except articles */}
            {(formData.type === "whitepaper" ||
              formData.type === "report" ||
              formData.type === "interview" ||
              formData.type === "newsletter") && (
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
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-colors ${
                        errors.description
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Brief description that appears in resource cards..."
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Media & Files */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Icon icon="mdi:image" width={24} className="text-primary" />
                Media & Files
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Resource Image
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "image")}
                      disabled={uploading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {uploadingField === "image" && (
                      <div className="flex items-center gap-2 text-primary">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        Uploading...
                      </div>
                    )}
                    {errors.image && (
                      <p className="text-red-500 text-sm">{errors.image}</p>
                    )}
                    {formData.image && (
                      <div className="relative">
                        <img
                          src={formData.image}
                          alt="Resource preview"
                          className="w-full h-40 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, image: "" }))
                          }
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF Upload - Hide for interviews */}
                {formData.type !== "interview" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {formData.type === "whitepaper" ||
                      formData.type === "report" ||
                      formData.type === "newsletter"
                        ? "PDF File *"
                        : "PDF Download (Optional)"}
                    </label>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        disabled={uploading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {uploadingField === "downloadUrl" && (
                        <div className="flex items-center gap-2 text-primary">
                          <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                          Uploading...
                        </div>
                      )}
                      {errors.downloadUrl && (
                        <p className="text-red-500 text-sm">
                          {errors.downloadUrl}
                        </p>
                      )}
                      {formData.downloadUrl && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Icon icon="mdi:file-pdf" width={20} />
                          <span className="text-sm">
                            PDF uploaded successfully
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                downloadUrl: "",
                              }))
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <Icon icon="mdi:close" width={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* YouTube URL - Only show for interviews */}
            {formData.type === "interview" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Icon
                    icon="solar:video-frame-play-vertical-bold"
                    width={24}
                    className="text-red-500"
                  />
                  Interview Video
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      YouTube URL *
                    </label>
                    <input
                      type="url"
                      name="youtubeUrl"
                      value={formData.youtubeUrl}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                        errors.youtubeUrl
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    {errors.youtubeUrl && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.youtubeUrl}
                      </p>
                    )}
                    {formData.youtubeUrl && !errors.youtubeUrl && (
                      <div className="flex items-center gap-2 text-green-600 mt-2">
                        <Icon icon="mdi:check-circle" width={16} />
                        <span className="text-sm">Valid YouTube URL</span>
                      </div>
                    )}
                    <p className="text-gray-500 text-sm mt-1">
                      Enter a valid YouTube URL for the interview video. This
                      will be used for the "Watch Interview" button.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Icon icon="mdi:tag" width={24} className="text-primary" />
                Tags
              </h2>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Add a tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <Icon icon="mdi:close" width={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stats (Read Only) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Icon
                  icon="mdi:chart-box"
                  width={24}
                  className="text-primary"
                />
                Resource Statistics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Views
                  </label>
                  <input
                    type="number"
                    value={formData.views}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Downloads
                  </label>
                  <input
                    type="number"
                    value={formData.downloads}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4 pb-8">
              <Button text="Cancel" type="secondary" link="/admin/resources" />
              <button
                type="submit"
                disabled={saving || uploading}
                className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-xl font-semibold hover:from-primary/90 hover:to-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {saving && (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                )}
                {saving ? "Updating..." : "Update Resource"}
              </button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
