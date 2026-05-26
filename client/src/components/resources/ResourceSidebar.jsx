import React from "react";
import { Icon } from "@iconify/react";
import Button from "../common/Button";
import { formatDate } from "../../utils/dateUtils";

const ResourceSidebar = ({ resource }) => {
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

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(resource.title);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      email: `mailto:?subject=${title}&body=Check out this resource: ${url}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <div className="space-y-6">
      {/* Download/Read Button */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Access Resource</h3>
        {resource.downloadUrl ? (
          <Button
            text="Download PDF"
            type="primary"
            className="w-full mb-4"
            onClick={handleDownload}
            icon="solar:download-bold"
          />
        ) : (
          <Button
            text="Read Online"
            type="primary"
            className="w-full mb-4"
            link="#"
          />
        )}
        <div className="text-sm text-gray-600 space-y-2">
          <p className="flex items-center">
            <Icon icon="solar:file-text-bold" className="mr-2" width={14} />
            Format: {resource.downloadUrl ? "PDF" : "Online Article"}
          </p>
          <p className="flex items-center">
            <Icon icon="solar:clock-circle-bold" className="mr-2" width={14} />
            Reading time: {resource.readTime || "5-10 min"}
          </p>
          {resource.downloadUrl && (
            <p className="flex items-center">
              <Icon icon="solar:download-bold" className="mr-2" width={14} />
              Free download available
            </p>
          )}
        </div>
      </div>

      {/* Resource Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Resource Details</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-medium capitalize">{resource.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Category:</span>
            <span className="font-medium">{resource.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Published:</span>
            <span className="font-medium">
              {formatDate(resource.publishedDate || resource.createdAt)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Author:</span>
            <span className="font-medium">{resource.author}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Views:</span>
            <span className="font-medium">
              {resource.views.toLocaleString()}
            </span>
          </div>
          {resource.downloads > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Downloads:</span>
              <span className="font-medium">
                {resource.downloads.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {resource.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Share */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Share Resource</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleShare("twitter")}
            className="flex items-center justify-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
          >
            <Icon icon="solar:twitter-bold" width={16} className="mr-1" />
            Twitter
          </button>
          <button
            onClick={() => handleShare("linkedin")}
            className="flex items-center justify-center px-3 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors text-sm"
          >
            <Icon icon="solar:linkedin-bold" width={16} className="mr-1" />
            LinkedIn
          </button>
          <button
            onClick={() => handleShare("facebook")}
            className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Icon icon="solar:facebook-bold" width={16} className="mr-1" />
            Facebook
          </button>
          <button
            onClick={() => handleShare("email")}
            className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            <Icon icon="solar:letter-bold" width={16} className="mr-1" />
            Email
          </button>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
        <p className="text-sm mb-4 text-white/90">
          Get notified when we publish new resources
        </p>
        <Button
          text="Subscribe to Newsletter"
          type="secondary"
          className="w-full bg-white text-brand-primary hover:bg-gray-100"
          link="/newsletter"
        />
      </div>
    </div>
  );
};

export default ResourceSidebar;
