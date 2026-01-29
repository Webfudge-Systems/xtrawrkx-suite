"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Heart,
  Calendar,
  MapPin,
  Users,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
// import ModernButton from "@/components/ui/ModernButton";

// Mock gallery data for past events
const mockGalleryData = {
  3: [
    {
      id: 1,
      url: "/images/events/gallery/meetup-1.jpg",
      title: "Opening Keynote",
      description: "Tech leaders discussing the future of AI",
      date: "2024-01-20",
      photographer: "Event Photography Team",
      likes: 24,
      downloads: 8,
    },
    {
      id: 2,
      url: "/images/events/gallery/meetup-2.jpg",
      title: "Networking Session",
      description: "Attendees connecting and sharing ideas",
      date: "2024-01-20",
      photographer: "Event Photography Team",
      likes: 18,
      downloads: 12,
    },
    {
      id: 3,
      url: "/images/events/gallery/meetup-3.jpg",
      title: "Panel Discussion",
      description: "Industry experts sharing insights",
      date: "2024-01-20",
      photographer: "Event Photography Team",
      likes: 31,
      downloads: 15,
    },
    {
      id: 4,
      url: "/images/events/gallery/meetup-4.jpg",
      title: "Workshop Session",
      description: "Hands-on coding workshop",
      date: "2024-01-20",
      photographer: "Event Photography Team",
      likes: 22,
      downloads: 9,
    },
    {
      id: 5,
      url: "/images/events/gallery/meetup-5.jpg",
      title: "Closing Ceremony",
      description: "Event wrap-up and next steps",
      date: "2024-01-20",
      photographer: "Event Photography Team",
      likes: 16,
      downloads: 6,
    },
    {
      id: 6,
      url: "/images/events/gallery/meetup-6.jpg",
      title: "Group Photo",
      description: "All attendees together",
      date: "2024-01-20",
      photographer: "Event Photography Team",
      likes: 45,
      downloads: 23,
    },
  ],
  5: [
    {
      id: 1,
      url: "/images/events/gallery/crypto-1.jpg",
      title: "Crypto Trading Session",
      description: "Live trading demonstration",
      date: "2023-12-15",
      photographer: "Financial Photography",
      likes: 28,
      downloads: 14,
    },
    {
      id: 2,
      url: "/images/events/gallery/crypto-2.jpg",
      title: "DeFi Workshop",
      description: "Decentralized finance concepts",
      date: "2023-12-15",
      photographer: "Financial Photography",
      likes: 19,
      downloads: 11,
    },
    {
      id: 3,
      url: "/images/events/gallery/crypto-3.jpg",
      title: "Blockchain Discussion",
      description: "Technical deep dive session",
      date: "2023-12-15",
      photographer: "Financial Photography",
      likes: 33,
      downloads: 18,
    },
    {
      id: 4,
      url: "/images/events/gallery/crypto-4.jpg",
      title: "Networking Break",
      description: "Coffee break networking",
      date: "2023-12-15",
      photographer: "Financial Photography",
      likes: 12,
      downloads: 7,
    },
  ],
};

export default function EventGalleryModal({ event, isOpen, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [likedImages, setLikedImages] = useState(new Set());

  const galleryImages = mockGalleryData[event?.id] || [];

  const handlePrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
    setIsFullscreen(true);
  };

  const handleLike = (imageId) => {
    setLikedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const handleDownload = (image) => {
    // Simulate download
  };

  const handleShare = (image) => {
    // Simulate share
  };

  if (!isOpen || !event) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-6xl mx-4 max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {event.title} Gallery
                </h2>
                <p className="text-gray-600">
                  {galleryImages.length} photos from the event
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Gallery Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryImages.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group cursor-pointer"
                    onClick={() => handleImageClick(index)}
                  >
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
                      <div className="relative aspect-video bg-gray-100">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
                            <div className="p-2 bg-white/90 rounded-lg">
                              <Camera className="h-4 w-4 text-gray-700" />
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-white/90 text-gray-700">
                            {image.likes} likes
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {image.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {image.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(image.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {image.downloads} downloads
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(image.id);
                              }}
                              className={`p-1 rounded-lg transition-colors ${
                                likedImages.has(image.id)
                                  ? "text-red-500 bg-red-50"
                                  : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                              }`}
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  likedImages.has(image.id)
                                    ? "fill-current"
                                    : ""
                                }`}
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(image);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(image);
                              }}
                              className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Photos Available
                </h3>
                <p className="text-gray-500">
                  Photos from this event will be available soon.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Fullscreen Image Viewer */}
        <AnimatePresence>
          {isFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center"
              onClick={() => setIsFullscreen(false)}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="relative max-w-4xl max-h-[90vh] mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Navigation */}
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="absolute top-4 right-4 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-white" />
                </button>

                {/* Image */}
                <div className="relative">
                  <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {galleryImages[currentImageIndex]?.title}
                    </h3>
                    <p className="text-gray-200 mb-4">
                      {galleryImages[currentImageIndex]?.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-300">
                        <span>
                          Photo by{" "}
                          {galleryImages[currentImageIndex]?.photographer}
                        </span>
                        <span>
                          {new Date(
                            galleryImages[currentImageIndex]?.date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleLike(galleryImages[currentImageIndex]?.id)
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            likedImages.has(
                              galleryImages[currentImageIndex]?.id
                            )
                              ? "text-red-500 bg-red-500/20"
                              : "text-white hover:bg-white/20"
                          }`}
                        >
                          <Heart
                            className={`h-5 w-5 ${
                              likedImages.has(
                                galleryImages[currentImageIndex]?.id
                              )
                                ? "fill-current"
                                : ""
                            }`}
                          />
                        </button>
                        <button
                          onClick={() =>
                            handleDownload(galleryImages[currentImageIndex])
                          }
                          className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() =>
                            handleShare(galleryImages[currentImageIndex])
                          }
                          className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <Share2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="text-white text-sm font-medium">
                    {currentImageIndex + 1} / {galleryImages.length}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
