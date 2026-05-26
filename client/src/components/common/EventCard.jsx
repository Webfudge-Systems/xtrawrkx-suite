import React from "react";
import Image from "next/image";
import Button from "./Button";
import { Icon } from "@iconify/react";

export default function EventCard({
  background = "/images/hero.png",
  title,
  location,
  date,
  slug,
  season,
}) {
  // Ensure we have a valid image source
  const imageSrc =
    background && background.trim() !== "" ? background : "/images/hero.png";
  return (
    <div
      className="relative rounded-2xl shadow-xl overflow-hidden w-full bg-gray-900"
      style={{ aspectRatio: "1/1" }}
    >
      {/* Full background image */}
      <Image
        src={imageSrc}
        alt={`${title} event background`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-black/10 to-black" />

      {/* Season badge (top right) */}
      {season && (
        <div className="absolute top-12 left-4 z-20 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-semibold border border-white/20 shadow-lg">
          {season}
        </div>
      )}

      {/* Info (title, date, location) directly over image */}
      <div className="absolute left-0 right-0 bottom-20 flex flex-col items-center px-6">
        {/* Title */}
        <div className="w-full text-xl font-normal text-white mb-2 leading-tight drop-shadow-md">
          {title}
        </div>
        {/* Date and location row */}
        <div className="w-full flex justify-start gap-6">
          <div className="flex items-center gap-2 text-white drop-shadow">
            <span className="text-lg text-primary">
              <Icon icon="mdi:calendar-month-outline" width={24} height={24} />
            </span>
            <span className="font-medium text-base">{date}</span>
          </div>
          <div className="flex items-center gap-2 text-white drop-shadow">
            <span className="text-lg text-primary">
              <Icon icon="mdi:map-marker-outline" width={24} height={24} />
            </span>
            <span className="font-medium text-base">{location}</span>
          </div>
        </div>
      </div>

      {/* Bottom section with button */}
      <div className="absolute bottom-4 left-4 right-4">
        <Button
          text="Learn More"
          type="secondary"
          size="sm"
          className="w-full"
          link={slug ? `/events/${slug}` : "#"}
        />
      </div>
    </div>
  );
}
