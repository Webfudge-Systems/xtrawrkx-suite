import React from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Button from "../common/Button";
import { formatDate } from "../../utils/dateUtils";

const ResourceCard = ({ resource, layout = "grid" }) => {
  // Get the proper thumbnail image or use a default placeholder
  const getResourceImage = () => {
    if (resource.thumbnail) return resource.thumbnail;
    if (resource.image && resource.image !== "/images/hero.jpg")
      return resource.image;
    if (resource.featuredImage) return resource.featuredImage;
    return "/images/hero.jpg"; // Fallback to hero image
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "whitepaper":
        return "solar:document-text-bold";
      case "article":
        return "solar:book-2-bold";
      case "report":
        return "solar:chart-square-bold";
      case "interview":
        return "solar:video-frame-play-vertical-bold";
      case "newsletter":
        return "solar:letter-bold";
      default:
        return "solar:document-bold";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "whitepaper":
        return "bg-blue-100 text-blue-800";
      case "article":
        return "bg-green-100 text-green-800";
      case "report":
        return "bg-purple-100 text-purple-800";
      case "interview":
        return "bg-red-100 text-red-800";
      case "newsletter":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDownload = (e) => {
    if (resource.downloadUrl) {
      e.preventDefault();
      // Force download or open in new tab for PDFs
      const link = document.createElement("a");
      link.href = resource.downloadUrl;
      link.download = resource.fileName || `${resource.title}.pdf`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleYouTubeWatch = (e) => {
    if (resource.youtubeUrl) {
      e.preventDefault();
      window.open(resource.youtubeUrl, "_blank", "noopener,noreferrer");
    }
  };

  const getActionButton = (size = "sm") => {
    // Handle Interview type - YouTube link
    if (resource.type === "interview" && resource.youtubeUrl) {
      return (
        <Button
          text="Watch Interview"
          type="primary"
          size={size}
          onClick={handleYouTubeWatch}
          icon="solar:play-circle-bold"
        />
      );
    }

    // Handle Newsletter and other downloadable types
    if (resource.downloadUrl) {
      return (
        <Button
          text={
            resource.type === "newsletter"
              ? "Download Newsletter"
              : "Download PDF"
          }
          type="primary"
          size={size}
          onClick={handleDownload}
          icon="solar:download-bold"
        />
      );
    }

    // Default - Read More
    return (
      <Button
        text="Read More"
        type="primary"
        size={size}
        link={`/resources/${resource.slug}`}
      />
    );
  };

  if (layout === "featured") {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <div className="relative h-48">
          <Image
            src={getResourceImage()}
            alt={resource.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-4 left-4">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                resource.type
              )}`}
            >
              <Icon
                icon={getTypeIcon(resource.type)}
                className="inline mr-1"
                width={12}
              />
              {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
            </span>
          </div>
          {resource.featured && (
            <div className="absolute top-4 right-4">
              <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-2 py-1 rounded-full text-xs font-medium">
                Featured
              </span>
            </div>
          )}
          {/* YouTube Play Overlay for Interviews */}
          {resource.type === "interview" && resource.youtubeUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="bg-black/50 rounded-full p-4 hover:bg-black/70 transition-colors cursor-pointer"
                onClick={handleYouTubeWatch}
              >
                <Icon
                  icon="solar:play-bold"
                  className="text-white"
                  width={32}
                />
              </div>
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
              {resource.title}
            </h3>
          </div>
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
            {resource.description}
          </p>
          {resource.author && (
            <div className="flex items-center mb-3">
              <Icon
                icon="solar:user-bold"
                className="text-gray-400 mr-2"
                width={16}
              />
              <span className="text-sm text-gray-600 font-medium">
                {resource.author}
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {resource.tags &&
              resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {formatDate(resource.publishedDate || resource.createdAt)}
              </span>
              {getActionButton("xs")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (layout === "list") {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex">
        <div className="relative w-32 h-32 flex-shrink-0">
          <Image
            src={getResourceImage()}
            alt={resource.title}
            fill
            className="object-cover"
            sizes="128px"
          />
          <div className="absolute top-2 left-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                resource.type
              )}`}
            >
              <Icon
                icon={getTypeIcon(resource.type)}
                className="inline mr-1"
                width={12}
              />
              {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
            </span>
          </div>
          {/* YouTube Play Overlay for Interviews */}
          {resource.type === "interview" && resource.youtubeUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors cursor-pointer"
                onClick={handleYouTubeWatch}
              >
                <Icon
                  icon="solar:play-bold"
                  className="text-white"
                  width={20}
                />
              </div>
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
              {resource.title}
            </h3>
          </div>
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
            {resource.description}
          </p>
          {resource.author && (
            <div className="flex items-center mb-3">
              <Icon
                icon="solar:user-bold"
                className="text-gray-400 mr-2"
                width={16}
              />
              <span className="text-sm text-gray-600 font-medium">
                {resource.author}
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {resource.tags &&
              resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {formatDate(resource.publishedDate || resource.createdAt)}
              </span>
              {getActionButton("xs")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-40">
        <Image
          src={getResourceImage()}
          alt={resource.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <div className="absolute top-3 left-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
              resource.type
            )}`}
          >
            <Icon
              icon={getTypeIcon(resource.type)}
              className="inline mr-1"
              width={12}
            />
            {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
          </span>
        </div>
        {resource.featured && (
          <div className="absolute top-3 right-3">
            <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-2 py-1 rounded-full text-xs font-medium">
              Featured
            </span>
          </div>
        )}
        {/* YouTube Play Overlay for Interviews */}
        {resource.type === "interview" && resource.youtubeUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors cursor-pointer"
              onClick={handleYouTubeWatch}
            >
              <Icon icon="solar:play-bold" className="text-white" width={24} />
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-md font-semibold text-gray-900 mb-2 line-clamp-2">
          {resource.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {resource.description}
        </p>
        {resource.author && (
          <div className="flex items-center mb-3">
            <Icon
              icon="solar:user-bold"
              className="text-gray-400 mr-2"
              width={14}
            />
            <span className="text-xs text-gray-600 font-medium">
              {resource.author}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {formatDate(resource.publishedDate || resource.createdAt)}
          </span>
          {getActionButton("xs")}
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;
