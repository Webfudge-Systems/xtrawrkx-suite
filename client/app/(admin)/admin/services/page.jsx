"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import AdminLayout from "@/src/components/admin/AdminLayout";
import ProtectedRoute from "@/src/components/admin/ProtectedRoute";
import { serviceService } from "@/src/services/databaseService";
import { uploadImage } from "@/src/services/cloudinaryService";
import Button from "@/src/components/common/Button";

export default function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubCompany, setSelectedSubCompany] = useState("All");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [bulkSelection, setBulkSelection] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("grid");

  const categories = [
    "All",
    "Sales",
    "Finance",
    "Technology",
    "Manufacturing",
    "Consulting",
  ];
  const subCompanies = ["All", "XMC", "XGV", "XEV", "XEN"];

  // Load services
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const servicesData = await serviceService.getServices();
      setServices(servicesData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort services
  const filteredServices = services
    .filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.tags &&
          service.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ));
      const matchesCategory =
        selectedCategory === "All" || service.category === selectedCategory;
      const matchesSubCompany =
        selectedSubCompany === "All" ||
        service.subCompany === selectedSubCompany;
      return matchesSearch && matchesCategory && matchesSubCompany;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "category":
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case "subCompany":
          aValue = a.subCompany.toLowerCase();
          bValue = b.subCompany.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Get service statistics
  const getServiceStats = () => {
    const total = services.length;
    const featured = services.filter((s) => s.featured).length;
    const byCategory = categories.slice(1).reduce((acc, cat) => {
      acc[cat] = services.filter((s) => s.category === cat).length;
      return acc;
    }, {});
    const bySubCompany = subCompanies.slice(1).reduce((acc, sub) => {
      acc[sub] = services.filter((s) => s.subCompany === sub).length;
      return acc;
    }, {});

    return { total, featured, byCategory, bySubCompany };
  };

  const stats = getServiceStats();

  // Handle bulk selection
  const handleBulkSelect = (serviceId) => {
    setBulkSelection((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAll = () => {
    if (bulkSelection.length === filteredServices.length) {
      setBulkSelection([]);
    } else {
      setBulkSelection(filteredServices.map((s) => s.id));
    }
  };

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (
      confirm(
        `Are you sure you want to delete ${bulkSelection.length} services?`
      )
    ) {
      try {
        await Promise.all(bulkSelection.map((id) => serviceService.delete(id)));
        setBulkSelection([]);
        loadServices();
      } catch (error) {
      }
    }
  };

  const handleBulkFeaturedUpdate = async (featured) => {
    try {
      await Promise.all(
        bulkSelection.map((id) => {
          const service = services.find((s) => s.id === id);
          return serviceService.update(id, {
            ...service,
            featured,
          });
        })
      );
      setBulkSelection([]);
      loadServices();
    } catch (error) {
    }
  };

  // Handle individual service actions
  const handleDelete = async (serviceId) => {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
        await serviceService.delete(serviceId);
        await loadServices();
      } catch (error) {
      }
    }
  };

  const handleEdit = (service) => {
    setCurrentService(service);
    setIsEditModalOpen(true);
  };

  const handleDuplicate = async (service) => {
    try {
      const duplicatedService = {
        ...service,
        name: `${service.name} (Copy)`,
        slug: `${service.slug}-copy`,
        id: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await serviceService.createService(duplicatedService);
      loadServices();
    } catch (error) {
    }
  };

  const handleToggleFeatured = async (service) => {
    try {
      await serviceService.update(service.id, {
        ...service,
        featured: !service.featured,
      });
      loadServices();
    } catch (error) {
    }
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Service Management
              </h1>
              <p className="text-gray-600">
                Manage your business services and offerings
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Button
                text="Add Service"
                type="primary"
                link="/admin/services/new"
                icon="mdi:plus"
                className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg"
              />
            </div>
          </div>

          {/* Modern Statistics Dashboard */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Service Overview
              </h3>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              {/* Total Services */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Icon
                        icon="mdi:briefcase"
                        width={20}
                        className="text-primary"
                      />
                    </div>
                    <div className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">
                      Total
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {stats.total}
                    </p>
                    <p className="text-sm text-gray-600">Services</p>
                  </div>
                </div>
              </div>

              {/* Featured Services */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-yellow-100 rounded-xl">
                      <Icon
                        icon="mdi:star"
                        width={20}
                        className="text-yellow-600"
                      />
                    </div>
                    <div className="text-xs text-yellow-600 font-medium bg-yellow-100 px-2 py-1 rounded-full">
                      Featured
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-700 mb-1">
                      {stats.featured}
                    </p>
                    <p className="text-sm text-yellow-600">Highlighted</p>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-green-100 rounded-xl">
                      <Icon
                        icon="mdi:tag-multiple"
                        width={20}
                        className="text-green-600"
                      />
                    </div>
                    <div className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                      Categories
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700 mb-1">
                      {Object.keys(stats.byCategory).length}
                    </p>
                    <p className="text-sm text-green-600">Types</p>
                  </div>
                </div>
              </div>

              {/* Sub-Companies */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Icon
                        icon="mdi:domain"
                        width={20}
                        className="text-purple-600"
                      />
                    </div>
                    <div className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded-full">
                      Companies
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-700 mb-1">
                      {Object.keys(stats.bySubCompany).length}
                    </p>
                    <p className="text-sm text-purple-600">Sub-Units</p>
                  </div>
                </div>
              </div>

              {/* Sales Services */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Icon
                        icon="mdi:chart-line"
                        width={20}
                        className="text-blue-600"
                      />
                    </div>
                    <div className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">
                      Sales
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700 mb-1">
                      {stats.byCategory.Sales || 0}
                    </p>
                    <p className="text-sm text-blue-600">Services</p>
                  </div>
                </div>
              </div>

              {/* Technology Services */}
              <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-100/50 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-red-100 rounded-xl">
                      <Icon
                        icon="mdi:laptop"
                        width={20}
                        className="text-red-600"
                      />
                    </div>
                    <div className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full">
                      Tech
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-700 mb-1">
                      {stats.byCategory.Technology || 0}
                    </p>
                    <p className="text-sm text-red-600">Solutions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Icon
                      icon="mdi:chart-donut"
                      width={24}
                      className="text-primary"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Quick Insights
                    </h4>
                    <p className="text-sm text-gray-600">
                      {stats.featured > 0
                        ? `${stats.featured} featured services promoting your business`
                        : stats.total > 0
                        ? `${stats.total} services available across ${
                            Object.keys(stats.bySubCompany).length
                          } companies`
                        : "No services configured yet"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {stats.total > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">
                        {Math.round((stats.featured / stats.total) * 100)}%
                      </p>
                      <p className="text-xs text-gray-600">Featured Rate</p>
                    </div>
                  )}

                  {stats.featured > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-yellow-600">
                        {stats.featured}
                      </p>
                      <p className="text-xs text-gray-600">Promoted</p>
                    </div>
                  )}

                  {Object.keys(stats.byCategory).length > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {Object.keys(stats.byCategory).length}
                      </p>
                      <p className="text-xs text-gray-600">Categories</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Icon
                  icon="mdi:magnify"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  width={20}
                />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              {/* Sub-Company Filter */}
              <select
                value={selectedSubCompany}
                onChange={(e) => setSelectedSubCompany(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {subCompanies.map((subCompany) => (
                  <option key={subCompany} value={subCompany}>
                    {subCompany}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="category-asc">Category (A-Z)</option>
                <option value="createdAt-desc">Date (Newest)</option>
                <option value="createdAt-asc">Date (Oldest)</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 ${
                    viewMode === "grid"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  <Icon icon="mdi:view-grid" width={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 ${
                    viewMode === "list"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  <Icon icon="mdi:view-list" width={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Filtered Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {filteredServices.length}
                </span>{" "}
                {filteredServices.length === 1 ? "service" : "services"}
                {(() => {
                  const hasActiveFilters =
                    searchTerm ||
                    selectedCategory !== "All" ||
                    selectedSubCompany !== "All";
                  
                  if (hasActiveFilters) {
                    return (
                      <>
                        {" "}
                        (filtered from{" "}
                        <span className="font-semibold text-gray-900">
                          {services.length}
                        </span>{" "}
                        total)
                      </>
                    );
                  }
                  return null;
                })()}
              </div>
              {(() => {
                const hasActiveFilters =
                  searchTerm ||
                  selectedCategory !== "All" ||
                  selectedSubCompany !== "All";
                
                if (hasActiveFilters) {
                  return (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("All");
                        setSelectedSubCompany("All");
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                      title="Clear all filters"
                    >
                      <Icon icon="mdi:close-circle" width={16} />
                      Clear filters
                    </button>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Bulk Actions */}
          {bulkSelection.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">
                  {bulkSelection.length} service
                  {bulkSelection.length > 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkFeaturedUpdate(true)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                  >
                    Mark Featured
                  </button>
                  <button
                    onClick={() => handleBulkFeaturedUpdate(false)}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    Remove Featured
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setBulkSelection([])}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Services Display */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Icon
                icon="mdi:briefcase-remove"
                width={64}
                className="text-gray-400 mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No services found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onToggleFeatured={handleToggleFeatured}
                  onSelect={handleBulkSelect}
                  selected={bulkSelection.includes(service.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            bulkSelection.length === filteredServices.length
                          }
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sub-Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Featured
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredServices.map((service) => (
                      <ServiceRow
                        key={service.id}
                        service={service}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onToggleFeatured={handleToggleFeatured}
                        onSelect={handleBulkSelect}
                        selected={bulkSelection.includes(service.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {(isCreateModalOpen || isEditModalOpen) && (
          <ServiceModal
            isOpen={isCreateModalOpen || isEditModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setIsEditModalOpen(false);
              setCurrentService(null);
            }}
            service={currentService}
            onSave={loadServices}
          />
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}

// Service Card Component
function ServiceCard({
  service,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFeatured,
  onSelect,
  selected,
}) {
  const getCategoryColor = (category) => {
    switch (category) {
      case "Sales":
        return "bg-blue-100 text-blue-800";
      case "Finance":
        return "bg-green-100 text-green-800";
      case "Technology":
        return "bg-purple-100 text-purple-800";
      case "Manufacturing":
        return "bg-orange-100 text-orange-800";
      case "Consulting":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSubCompanyColor = (subCompany) => {
    switch (subCompany) {
      case "XMC":
        return "bg-red-100 text-red-800";
      case "XGV":
        return "bg-indigo-100 text-indigo-800";
      case "XEV":
        return "bg-teal-100 text-teal-800";
      case "XEN":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(service.id)}
          className="absolute top-4 left-4 z-10 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <img
          src={service.image || "/images/services/default.png"}
          alt={service.name}
          className="w-full h-48 object-cover rounded-t-xl"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
              service.category
            )}`}
          >
            {service.category}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getSubCompanyColor(
              service.subCompany
            )}`}
          >
            {service.subCompany}
          </span>
          {service.featured && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <Icon icon="mdi:star" width={12} className="inline mr-1" />
              Featured
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {service.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {service.description}
        </p>

        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {service.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {service.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                +{service.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(service)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Icon icon="mdi:pencil" width={16} />
            Edit
          </button>
          <button
            onClick={() => onToggleFeatured(service)}
            className={`px-3 py-2 rounded-lg transition-colors ${
              service.featured
                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <Icon icon="mdi:star" width={16} />
          </button>
          <button
            onClick={() => onDuplicate(service)}
            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Icon icon="mdi:content-copy" width={16} />
          </button>
          <button
            onClick={() => onDelete(service.id)}
            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Icon icon="mdi:delete" width={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Service Row Component for List View
function ServiceRow({
  service,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFeatured,
  onSelect,
  selected,
}) {
  const getCategoryColor = (category) => {
    switch (category) {
      case "Sales":
        return "bg-blue-100 text-blue-800";
      case "Finance":
        return "bg-green-100 text-green-800";
      case "Technology":
        return "bg-purple-100 text-purple-800";
      case "Manufacturing":
        return "bg-orange-100 text-orange-800";
      case "Consulting":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSubCompanyColor = (subCompany) => {
    switch (subCompany) {
      case "XMC":
        return "bg-red-100 text-red-800";
      case "XGV":
        return "bg-indigo-100 text-indigo-800";
      case "XEV":
        return "bg-teal-100 text-teal-800";
      case "XEN":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <tr className={selected ? "bg-blue-50" : "hover:bg-gray-50"}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(service.id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img
            src={service.image || "/images/services/default.png"}
            alt={service.name}
            className="w-12 h-12 rounded-lg object-cover mr-4"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {service.name}
            </div>
            <div className="text-sm text-gray-500 line-clamp-1">
              {service.description}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
            service.category
          )}`}
        >
          {service.category}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getSubCompanyColor(
            service.subCompany
          )}`}
        >
          {service.subCompany}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {service.featured ? (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Icon icon="mdi:star" width={12} className="inline mr-1" />
            Featured
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(service)}
            className="text-blue-600 hover:text-blue-900"
          >
            <Icon icon="mdi:pencil" width={16} />
          </button>
          <button
            onClick={() => onToggleFeatured(service)}
            className={
              service.featured
                ? "text-yellow-600 hover:text-yellow-900"
                : "text-gray-400 hover:text-gray-600"
            }
          >
            <Icon icon="mdi:star" width={16} />
          </button>
          <button
            onClick={() => onDuplicate(service)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Icon icon="mdi:content-copy" width={16} />
          </button>
          <button
            onClick={() => onDelete(service.id)}
            className="text-red-600 hover:text-red-900"
          >
            <Icon icon="mdi:delete" width={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Service Modal Component
function ServiceModal({ isOpen, onClose, service, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category: "Sales",
    subCompany: "XMC",
    description: "",
    image: "",
    tags: [],
    featured: false,
    highlights: [],
  });

  const [tagInput, setTagInput] = useState("");
  const [highlightInput, setHighlightInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        slug: service.slug || "",
        category: service.category || "Sales",
        subCompany: service.subCompany || "XMC",
        description: service.description || "",
        image: service.image || "",
        tags: service.tags || [],
        featured: service.featured || false,
        highlights: service.highlights || [],
      });
    } else {
      setFormData({
        name: "",
        slug: "",
        category: "Sales",
        subCompany: "XMC",
        description: "",
        image: "",
        tags: [],
        featured: false,
        highlights: [],
      });
    }
    setErrors({});
  }, [service]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Service name is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Auto-generate slug from name
    if (name === "name") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({
        ...prev,
        slug,
      }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadImage(file, {
        folder: "services",
      });
      setFormData((prev) => ({
        ...prev,
        image: result.url,
      }));
      setErrors((prev) => ({
        ...prev,
        image: undefined,
      }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        image: `Upload failed: ${error.message}`,
      }));
    } finally {
      setUploading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleAddHighlight = () => {
    if (
      highlightInput.trim() &&
      !formData.highlights.includes(highlightInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        highlights: [...prev.highlights, highlightInput.trim()],
      }));
      setHighlightInput("");
    }
  };

  const handleRemoveHighlight = (highlightToRemove) => {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter(
        (highlight) => highlight !== highlightToRemove
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      // Set default image if none provided
      const serviceData = {
        ...formData,
        image: formData.image || "/images/hero_services.png",
      };

      if (service) {
        await serviceService.update(service.id, serviceData);
      } else {
        await serviceService.createService(serviceData);
      }
      onSave();
      onClose();
    } catch (error) {
      setErrors({ submit: `Failed to save service: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary px-6 py-4 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white text-2xl"
          >
            ×
          </button>
          <h2 className="text-2xl font-bold">
            {service ? "Edit Service" : "Create New Service"}
          </h2>
          <p className="text-blue-100 mt-1">
            {service
              ? "Update service information"
              : "Fill in the details to create a new service"}
          </p>
        </div>

        {/* Content */}
        <div className="max-h-[calc(95vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Error Display */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <div className="flex items-center gap-2">
                  <span>❌</span>
                  {errors.submit}
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:information"
                  width={20}
                  className="text-primary"
                />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                      errors.name
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter service name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                      errors.slug
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="service-url-slug"
                  />
                  {errors.slug && (
                    <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Finance">Finance</option>
                    <option value="Technology">Technology</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Consulting">Consulting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sub-Company *
                  </label>
                  <select
                    name="subCompany"
                    value={formData.subCompany}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="XMC">XMC</option>
                    <option value="XGV">XGV</option>
                    <option value="XEV">XEV</option>
                    <option value="XEN">XEN</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="mdi:text" width={20} className="text-primary" />
                Description
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                    errors.description
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter detailed service description"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="mdi:image" width={20} className="text-primary" />
                Service Image
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                <p className="text-sm text-gray-500 mt-2">
                  If no image is uploaded, the default services hero image will
                  be used.
                </p>
                {uploading && (
                  <div className="flex items-center gap-2 mt-2 text-primary">
                    <Icon
                      icon="mdi:loading"
                      className="animate-spin"
                      width={16}
                    />
                    <span className="text-sm">Uploading...</span>
                  </div>
                )}
                {errors.image && (
                  <p className="text-red-500 text-sm mt-1">{errors.image}</p>
                )}
                {formData.image && (
                  <div className="mt-3 relative">
                    <img
                      src={formData.image}
                      alt="Service preview"
                      className="w-full h-40 object-cover rounded-lg border border-gray-200"
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

            {/* Tags & Highlights */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:tag-multiple"
                  width={20}
                  className="text-primary"
                />
                Tags & Highlights
              </h3>

              {/* Tags */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleAddTag())
                    }
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Icon icon="mdi:close" width={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Highlights
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={highlightInput}
                    onChange={(e) => setHighlightInput(e.target.value)}
                    placeholder="Add a highlight..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleAddHighlight())
                    }
                  />
                  <button
                    type="button"
                    onClick={handleAddHighlight}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.highlights.map((highlight, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg"
                    >
                      <span className="flex-1">{highlight}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(highlight)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Icon icon="mdi:delete" width={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="featured"
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  Mark as featured service
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:loading"
                      className="animate-spin"
                      width={16}
                    />
                    Saving...
                  </div>
                ) : service ? (
                  "Update Service"
                ) : (
                  "Create Service"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
