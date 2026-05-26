"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";

const GalleryItem = ({ item, viewMode = "grid" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDate = (date) => {
    // Handle both Date objects and date strings
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      events: "bg-blue-100 text-blue-800",
      communities: "bg-green-100 text-green-800",
      achievements: "bg-yellow-100 text-yellow-800",
      team: "bg-purple-100 text-purple-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  // Ensure we have a valid image URL
  const imageUrl =
    typeof item.image === "string" && item.image.trim() !== ""
      ? item.image
      : "/images/hero.png";

  return (
    <>
      {/* Gallery Item Card */}
      {viewMode === "grid" ? (
        <div
          className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="relative h-64 overflow-hidden">
            <Image
              src={imageUrl}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <Icon icon="mdi:eye" width={24} className="text-white" />
              </div>
            </div>
            <div className="absolute top-3 left-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm ${getCategoryColor(
                  item.category
                )}`}
              >
                {item.category}
              </span>
            </div>
            {item.featured && (
              <div className="absolute top-3 right-3">
                <div className="bg-yellow-500 text-white p-2 rounded-full">
                  <Icon icon="mdi:star" width={16} />
                </div>
              </div>
            )}
          </div>

          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
              {item.description}
            </p>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Icon icon="mdi:calendar" width={16} />
                <span>{formatDate(item.date)}</span>
              </div>
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
                {item.tags.length > 2 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                    +{item.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div
          className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex">
            <div className="relative w-48 h-32 flex-shrink-0 overflow-hidden">
              <Image
                src={imageUrl}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                        item.category
                      )}`}
                    >
                      {item.category}
                    </span>
                    {item.featured && (
                      <div className="bg-yellow-500 text-white p-1 rounded-full">
                        <Icon icon="mdi:star" width={12} />
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Icon icon="mdi:calendar" width={16} />
                      <span>{formatDate(item.date)}</span>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:tag" width={16} />
                        <span>{item.tags.length} tags</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-primary/10 text-primary p-2 rounded-full">
                    <Icon icon="mdi:arrow-right" width={20} />
                  </div>
                </div>
              </div>

              {/* Tags in list view */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {item.tags.slice(0, 4).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                  {item.tags.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                      +{item.tags.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: show only the image on dark backdrop */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsModalOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-3 z-50 p-2 bg-black/40 hover:bg-black/50 text-white rounded-full transition-colors"
            >
              <Icon icon="solar:close-circle-bold" width={28} />
            </button>

            <img
              src={imageUrl}
              alt={item.title}
              className="rounded-sm shadow-lg"
              style={{
                display: 'block',
                maxWidth: '90vw',
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default GalleryItem;
