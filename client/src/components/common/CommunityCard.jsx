import React from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Button from "./Button";

const CommunityCard = ({ community, onJoin }) => {
  // Use specific brand colors for each community
  const getGradientColor = () => {
    return community.color || "from-blue-500 to-blue-700";
  };

  const getBorderColor = () => {
    const colorMap = {
      xen: "border-[#377ecc]/20 hover:border-[#377ecc]/40",
      "xev-fin": "border-[#2d5a9e]/20 hover:border-[#2d5a9e]/40",
      xevtg: "border-green-500/20 hover:border-green-500/40",
      "xd-d": "border-[#f5f37f]/40 hover:border-[#f5f37f]/60",
    };
    return colorMap[community.slug] || "border-gray-100 hover:border-gray-200";
  };

  const getIconBgColor = () => {
    const colorMap = {
      xen: "bg-[#377ecc]/10",
      "xev-fin": "bg-[#2d5a9e]/10",
      xevtg: "bg-green-500/10",
      "xd-d": "bg-[#f5f37f]/20",
    };
    return colorMap[community.slug] || "bg-gray-100";
  };

  const getIconColor = () => {
    const colorMap = {
      xen: "text-[#377ecc]",
      "xev-fin": "text-[#2d5a9e]",
      xevtg: "text-green-600",
      "xd-d": "text-[#d4d054]",
    };
    return colorMap[community.slug] || "text-gray-600";
  };

  const getPrimaryButtonStyle = () => {
    const styleMap = {
      xen: "bg-gradient-to-r from-[#377ecc] to-[#2c63a3] hover:from-[#2c63a3] hover:to-[#224f85]",
      "xev-fin":
        "bg-gradient-to-r from-[#2d5a9e] to-[#24487a] hover:from-[#24487a] hover:to-[#1d3561]",
      xevtg:
        "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
      "xd-d":
        "bg-gradient-to-r from-[#f5f37f] to-[#e6e06b] hover:from-[#e6e06b] hover:to-[#d4d054] text-gray-900",
    };
    return styleMap[community.slug] || "";
  };

  const getSecondaryButtonStyle = () => {
    const styleMap = {
      xen: "border-[#377ecc] text-[#377ecc] hover:bg-[#377ecc] hover:text-white",
      "xev-fin":
        "border-[#2d5a9e] text-[#2d5a9e] hover:bg-[#2d5a9e] hover:text-white",
      xevtg:
        "border-green-500 text-green-600 hover:bg-green-500 hover:text-white",
      "xd-d":
        "border-[#f5f37f] text-[#d4d054] hover:bg-[#f5f37f] hover:text-gray-900",
    };
    return styleMap[community.slug] || "";
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 h-full border ${getBorderColor()}`}
    >
      {/* Header with gradient background */}
      <div
        className={`bg-gradient-to-r ${getGradientColor()} p-6 text-white relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div
              className={`${getIconBgColor()} rounded-lg p-3 ${
                ["xen", "xev-fin", "xevtg", "xd-d"].includes(community.slug)
                  ? ""
                  : "bg-white/20"
              }`}
            >
              {community.logo ? (
                <Image
                  src={community.logo}
                  alt={`${community.name} Logo`}
                  width={45}
                  height={45}
                  className="object-contain shadow-lg "
                />
              ) : (
                <Icon
                  icon={community.icon}
                  className={`text-2xl ${
                    ["xen", "xev-fin", "xevtg", "xd-d"].includes(community.slug)
                      ? getIconColor()
                      : "text-white"
                  }`}
                />
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{community.members}</div>
              <div className="text-white/80 text-sm">Members</div>
            </div>
          </div>

          <h3 className="text-2xl font-bold mb-2">{community.name}</h3>
          <p className="text-lg text-white/90 mb-1">{community.fullName}</p>
          <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm">
            {community.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-gray-600 mb-6 leading-relaxed">
          {community.description}
        </p>

        {/* Key Features */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Key Features</h4>
          <div className="space-y-2">
            {community.features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <Icon
                  icon="mdi:check-circle"
                  className={`${getIconColor()} mt-0.5 flex-shrink-0`}
                  width={16}
                />
                <span className="text-sm text-gray-600">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Meeting Schedule */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Icon icon="mdi:calendar-clock" className={getIconColor()} />
            <span className="font-medium">Meeting Schedule</span>
          </div>
          <p className="text-sm text-gray-600">{community.meetingFrequency}</p>
        </div>

        {/* Join Process */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Icon icon="mdi:account-plus" className={getIconColor()} />
            <span className="font-medium">Join Process</span>
          </div>
          <p className="text-sm text-gray-600">{community.joinProcess}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <Button
            text="Join Community"
            type="primary"
            className={`flex-1 ${getPrimaryButtonStyle()}`}
            onClick={() => onJoin && onJoin(community)}
          />
          <Button
            text="Learn More"
            type="secondary"
            link={`/communities/${community.slug}`}
            className={`flex-1 ${getSecondaryButtonStyle()}`}
          />
        </div>
      </div>
    </div>
  );
};

export default CommunityCard;
