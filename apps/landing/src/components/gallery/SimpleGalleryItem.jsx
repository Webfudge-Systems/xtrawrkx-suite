"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";

const SimpleGalleryItem = ({ item }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Ensure we have a valid image URL
  const imageUrl =
    typeof item.image === "string" && item.image.trim() !== ""
      ? item.image
      : "/images/hero.png";

  return (
    <>
      {/* Simple Image Card */}
      <div
        className="relative group cursor-pointer overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}

        <div className="relative aspect-square">
          <Image
            src={imageUrl}
            alt={item.title || "Gallery image"}
            fill
            className={`object-cover group-hover:scale-110 transition-transform duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />

          {/* Hover icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Icon icon="mdi:eye" width={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <Icon icon="mdi:close" width={24} className="text-white" />
            </button>

            {/* Modal Image */}
            <div className="relative h-full w-full max-h-[90vh]">
              <Image
                src={imageUrl}
                alt={item.title || "Gallery image"}
                width={1200}
                height={800}
                className="object-contain w-full h-full rounded-lg"
              />
            </div>

            {/* Image info overlay */}
            {item.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 rounded-b-lg">
                <h3 className="text-white text-lg font-semibold mb-1">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-white/80 text-sm">{item.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SimpleGalleryItem;
