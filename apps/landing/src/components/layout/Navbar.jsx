"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "../common/Button";
import { navbarLinks } from "../../data/Navlinks";
import { Icon } from "@iconify/react";
import Dropdown from "../common/Dropdown";
import {
  getServicesDropdownData,
  communitiesDropdownData,
  getEventsDropdownData,
} from "../../data/Dropdown";
import { motion, AnimatePresence } from "framer-motion";
import { usePublicAuth } from "../../contexts/PublicAuthContext";
import { communityPortalService } from "@/src/services/communityPortalService";
import { commonToasts } from "@/src/utils/toast";

const profileMenuItems = [
  {
    id: "profile",
    label: "View profile",
    icon: "solar:user-id-bold",
    href: "/profile",
  },
  {
    id: "portal",
    label: "Open company portal",
    icon: "solar:buildings-2-bold",
    external: true,
  },
  {
    id: "logout",
    label: "Log out",
    icon: "solar:logout-2-bold",
    danger: true,
  },
];

const RegisterButton = ({
  onClick,
  text = "Register",
  className = "",
  profileInitials = "XP",
  isAuthenticated = false,
  displayName = "",
  profileEmail = "",
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  if (isAuthenticated) {
    const handleMenuAction = async (itemId) => {
      setMenuOpen(false);
      if (itemId === "portal") {
        communityPortalService.openClientPortalDashboard({
          email: profileEmail?.trim() || "",
          newTab: true,
        });
        return;
      }
      if (itemId === "logout") {
        await onLogout?.();
      }
    };

    return (
      <div
        className={`relative ${className}`}
        onMouseEnter={() => setMenuOpen(true)}
        onMouseLeave={() => setMenuOpen(false)}
      >
        <button
          type="button"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.12)] transition hover:scale-[1.02] hover:shadow-[0_14px_32px_rgba(15,23,42,0.18)]"
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-base font-semibold text-white">
            {profileInitials}
          </span>
        </button>

        <div
          className={`absolute right-0 top-full z-[60] pt-2 transition-all duration-200 ${
            menuOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-1 opacity-0"
          }`}
          role="menu"
        >
          <div className="min-w-[240px] overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
            {displayName ? (
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {displayName}
                </p>
                {profileEmail ? (
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {profileEmail}
                  </p>
                ) : null}
              </div>
            ) : null}
            {profileMenuItems.map((item) =>
              item.href ? (
                <Link
                  key={item.id}
                  href={item.href}
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-brand-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon icon={item.icon} width={20} className="text-slate-400" />
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition hover:bg-slate-50 ${
                    item.danger
                      ? "text-red-600 hover:text-red-700"
                      : "text-slate-700 hover:text-brand-primary"
                  }`}
                  onClick={() => handleMenuAction(item.id)}
                >
                  <Icon
                    icon={item.icon}
                    width={20}
                    className={item.danger ? "text-red-400" : "text-slate-400"}
                  />
                  {item.label}
                  {item.external ? (
                    <Icon
                      icon="solar:arrow-right-up-linear"
                      width={16}
                      className="ml-auto text-slate-400"
                    />
                  ) : null}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      text={text}
      type="primary"
      onClick={onClick}
      className={className}
    />
  );
};

export default function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);
  const dropdownRef = useRef(null);
  const { isAuthenticated, signOut, profile } = usePublicAuth();

  // State for dynamic dropdown data
  const [servicesDropdownData, setServicesDropdownData] = useState(null);
  const [eventsDropdownData, setEventsDropdownData] = useState(null);
  const [dropdownLoading, setDropdownLoading] = useState({
    services: false,
    events: false,
  });
  const [dropdownErrors, setDropdownErrors] = useState({
    services: null,
    events: null,
  });

  // State for dynamic right column in events dropdown
  const [selectedEventMiddle, setSelectedEventMiddle] = useState(0);

  // Fetch dropdown data when needed
  const fetchServicesDropdownData = async () => {
    if (servicesDropdownData) return; // Already loaded

    setDropdownLoading((prev) => ({ ...prev, services: true }));
    try {
      const data = await getServicesDropdownData();
      setServicesDropdownData(data);
      setDropdownErrors((prev) => ({ ...prev, services: null }));
    } catch (error) {
      setDropdownErrors((prev) => ({ ...prev, services: error.message }));
    } finally {
      setDropdownLoading((prev) => ({ ...prev, services: false }));
    }
  };

  const fetchEventsDropdownData = async () => {
    if (eventsDropdownData) return; // Already loaded

    setDropdownLoading((prev) => ({ ...prev, events: true }));
    try {
      const data = await getEventsDropdownData();
      setEventsDropdownData(data);
      setDropdownErrors((prev) => ({ ...prev, events: null }));
    } catch (error) {
      setDropdownErrors((prev) => ({ ...prev, events: error.message }));
    } finally {
      setDropdownLoading((prev) => ({ ...prev, events: false }));
    }
  };

  // Get events by category for dynamic right column
  const getEventsForCategory = (categoryIndex) => {
    if (!eventsDropdownData?.eventsByCategory) return [];
    const categories = Object.keys(eventsDropdownData.eventsByCategory);
    const selectedCategory = categories[categoryIndex];
    return eventsDropdownData.eventsByCategory[selectedCategory] || [];
  };

  // Handle dropdown opening with data fetching
  const handleDropdownOpen = (dropdownName) => {
    setOpenDropdown(dropdownName);

    // Fetch data when dropdown is opened
    if (dropdownName === "Services") {
      fetchServicesDropdownData();
    } else if (dropdownName === "Events") {
      fetchEventsDropdownData();
    }
  };

  // Close dropdown on outside click or scroll
  useEffect(() => {
    if (!openDropdown) return;

    function handleClick(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !e.target.closest('[data-dropdown-trigger="Services"]')
      ) {
        setOpenDropdown(null);
      }
    }
    function handleScroll() {
      setOpenDropdown(null);
    }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openDropdown]);

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
        setIsFooterExpanded(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu and dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("nav")) {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
        setIsFooterExpanded(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  const servicesDropdownContent = (
    <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mt-3 flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 border border-gray-100 w-full max-h-[80vh] overflow-y-auto">
      {/* Left column */}
      <div className="w-full lg:w-1/3 flex flex-col justify-between">
        <div>
          <div className="text-xl font-normal mb-2 font-primary">
            {servicesDropdownData?.leftTitle}
          </div>
          <div className="text-sm text-gray-600 mb-6 font-primary">
            {servicesDropdownData?.description}
          </div>
          <Button
            text="Explore"
            type="primary"
            className="w-fit"
            link="/services"
            onClick={() => setOpenDropdown(null)}
          />
        </div>
      </div>
      {/* Middle column */}
      <div className="w-full lg:w-1/3">
        <div className="text-xl font-normal mb-2 font-primary">
          {servicesDropdownData?.middleTitle || "What we do"}
        </div>
        {dropdownLoading.services ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : dropdownErrors.services ? (
          <div className="text-red-500 text-sm py-4">
            Failed to load services
          </div>
        ) : (
          <ul className="space-y-2">
            {servicesDropdownData?.middleList?.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 group cursor-pointer hover:text-brand-primary transition"
              >
                <Link
                  href={item.slug}
                  className="flex-1 pl-2 transition-all duration-200 border-l-4 border-transparent group-hover:border-brand-primary group-hover:pl-5 hover:no-underline"
                  onClick={() => setOpenDropdown(null)}
                >
                  <div className="block">
                    <span className="block text-sm font-medium">
                      {item.label}
                    </span>
                    <span className="text-xs text-gray-500 group-hover:text-brand-primary/70">
                      {item.category} • {item.subCompany}
                    </span>
                  </div>
                </Link>
                <Icon
                  icon="solar:arrow-right-up-linear"
                  width="22"
                  className="opacity-70 group-hover:text-brand-primary"
                />
              </li>
            )) || []}
          </ul>
        )}
      </div>
      {/* Right column */}
      <div className="w-full lg:w-1/3">
        <div className="text-xl font-normal mb-2 font-primary">
          {servicesDropdownData?.rightTitle}
        </div>
        <ul className="space-y-2 mb-6">
          {servicesDropdownData?.rightList.map((item, idx) => (
            <li
              key={item.label + idx}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 group cursor-pointer hover:text-brand-primary transition"
            >
              <Link
                href={item.slug}
                className="flex-1 pl-2 transition-all duration-200 border-l-4 border-transparent group-hover:border-brand-primary group-hover:pl-5 hover:no-underline"
                onClick={() => setOpenDropdown(null)}
              >
                <div className="block">
                  <span className="block text-sm font-medium">
                    {item.label}
                  </span>
                  <span className="text-xs text-gray-500 group-hover:text-brand-primary/70">
                    {item.subtitle}
                  </span>
                  <span className="text-sm font-bold text-brand-primary block">
                    {item.price}
                  </span>
                </div>
              </Link>
              <Icon
                icon="solar:arrow-right-up-linear"
                width="22"
                className="opacity-70 group-hover:text-brand-primary"
              />
            </li>
          ))}
        </ul>
        {/* Explore Modals Button */}
        {servicesDropdownData?.exploreModalsButton && (
          <Button
            text={servicesDropdownData.exploreModalsButton.text}
            type="secondary"
            className="w-full"
            link={servicesDropdownData.exploreModalsButton.link}
            onClick={() => setOpenDropdown(null)}
          />
        )}
      </div>
    </div>
  );

  const communitiesDropdownContent = (
    <div className="bg-white rounded-2xl shadow-2xl mt-3 p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 border border-gray-100 w-full max-h-[80vh] overflow-y-auto">
      {/* Left column */}
      <div className="w-full lg:w-1/4 flex flex-col">
        <div>
          <div className="text-xl font-normal mb-2 font-primary">
            {communitiesDropdownData.leftTitle}
          </div>
          <div className="text-sm text-gray-600 mb-6 font-primary">
            {communitiesDropdownData.description}
          </div>
        </div>
        <Button
          text="Explore"
          type="primary"
          className="w-fit"
          link="/communities"
          onClick={() => setOpenDropdown(null)}
        />
      </div>
      {/* Middle column - Enhanced community display */}
      <div className="w-full lg:w-1/2">
        <div className="text-xl font-normal mb-4 font-primary">
          {communitiesDropdownData.middleTitle}
        </div>
        <div className="space-y-3">
          {communitiesDropdownData.middleList.map((item) => {
            const isXEN = item.shortName === "XEN";
            const isXEVFIN = item.shortName === "XEV.FiN";
            const isXEVTG = item.shortName === "XEVTG";
            const isXDD = item.shortName === "xD&D";
            const borderColor = isXEN
              ? "group-hover:border-[#377ecc]"
              : isXEVFIN
              ? "group-hover:border-[#2d5a9e]"
              : isXEVTG
              ? "group-hover:border-green-500"
              : isXDD
              ? "group-hover:border-[#f5f37f]"
              : "group-hover:border-brand-primary";
            const textColor = isXEN
              ? "group-hover:text-[#377ecc]"
              : isXEVFIN
              ? "group-hover:text-[#2d5a9e]"
              : isXEVTG
              ? "group-hover:text-green-600"
              : isXDD
              ? "group-hover:text-[#d4d054]"
              : "group-hover:text-brand-primary";

            return (
              <div
                key={item.label}
                className="group cursor-pointer transition-all duration-200 hover:bg-gray-50 rounded-lg p-3 border border-transparent hover:border-gray-200"
              >
                <Link
                  href={item.slug}
                  className={`block hover:no-underline transition-all duration-200 border-l-4 border-transparent ${borderColor} pl-4 ${textColor}`}
                  onClick={() => setOpenDropdown(null)}
                >
                  <div className="flex items-start gap-3">
                    {/* Community Logo/Icon */}
                    <div
                      className={`flex-shrink-0 p-2 rounded-lg ${
                        isXEN
                          ? "bg-[#377ecc]/10"
                          : isXEVFIN
                          ? "bg-[#2d5a9e]/10"
                          : isXEVTG
                          ? "bg-green-500/10"
                          : isXDD
                          ? "bg-[#f5f37f]/20"
                          : "bg-gray-100"
                      } transition-colors group-hover:scale-105`}
                    >
                      {/* Community Logos */}
                      {isXEN ? (
                        <Image
                          src="/images/xen.png"
                          alt="XEN Logo"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      ) : isXEVFIN ? (
                        <Image
                          src="/images/xevfin.png"
                          alt="XEV.FiN Logo"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      ) : isXDD ? (
                        <Image
                          src="/images/xd&d.png"
                          alt="xD&D Logo"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      ) : (
                        <Icon
                          icon={item.icon}
                          width="20"
                          className={`${
                            isXEVTG ? "text-green-600" : "text-gray-600"
                          } transition-colors`}
                        />
                      )}
                    </div>

                    {/* Community Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm group-hover:text-inherit">
                          {item.shortName}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            isXEN
                              ? "bg-[#377ecc]/10 text-[#377ecc]"
                              : isXEVFIN
                              ? "bg-[#2d5a9e]/10 text-[#2d5a9e]"
                              : isXEVTG
                              ? "bg-green-500/10 text-green-600"
                              : isXDD
                              ? "bg-[#f5f37f]/20 text-[#d4d054]"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.members}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-1 group-hover:text-inherit">
                        {item.category}
                      </div>
                      <div className="text-xs text-gray-600 group-hover:text-inherit truncate">
                        {item.primaryFeature}
                      </div>
                    </div>

                    {/* Arrow */}
                    <Icon
                      icon="solar:arrow-right-up-linear"
                      width="16"
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right column - Community Stats */}
      <div className="w-full lg:w-1/4">
        <div className="text-xl font-normal mb-4 font-primary">
          {communitiesDropdownData.rightTitle}
        </div>
        <div className="space-y-4">
          {communitiesDropdownData.rightList.map((stat, idx) => (
            <div key={stat.label} className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-gray-800 mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-gray-600">{stat.subtitle}</div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button
            text="Join XEN (Free)"
            type="secondary"
            className="w-full text-sm border-[#377ecc] text-[#377ecc] hover:bg-[#377ecc] hover:text-white"
            link="/communities/xen"
            onClick={() => setOpenDropdown(null)}
          />
        </div>
      </div>
    </div>
  );

  const eventsDropdownContent = (
    <div className="bg-white rounded-2xl shadow-2xl mt-3 p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 border border-gray-100 w-full max-h-[80vh] overflow-y-auto">
      {/* Left column */}
      <div className="w-full lg:w-1/3 flex flex-col justify-between">
        <div>
          <div className="text-xl font-normal mb-2 font-primary">
            {eventsDropdownData?.leftTitle}
          </div>
          <div className="text-sm text-gray-600 mb-6 font-primary">
            {eventsDropdownData?.description}
          </div>
          <Button
            text="Explore"
            type="primary"
            className="w-fit"
            link="/events"
            onClick={() => setOpenDropdown(null)}
          />
        </div>
      </div>
      {/* Middle column */}
      <div className="w-full lg:w-1/3">
        <div className="text-xl font-normal mb-2 font-primary">
          {eventsDropdownData?.middleTitle || "Event Categories"}
        </div>
        {dropdownLoading.events ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : dropdownErrors.events ? (
          <div className="text-red-500 text-sm py-4">Failed to load events</div>
        ) : (
          <ul className="space-y-2">
            {eventsDropdownData?.middleList?.map((item, idx) => (
              <li
                key={item.label}
                className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 group cursor-pointer hover:text-brand-primary transition ${
                  selectedEventMiddle === idx
                    ? "text-brand-primary font-semibold"
                    : ""
                }`}
                onMouseEnter={() => setSelectedEventMiddle(idx)}
                onClick={() => setSelectedEventMiddle(idx)}
              >
                <div className="flex-1 pl-2 transition-all duration-200 border-l-4 border-transparent group-hover:border-brand-primary group-hover:pl-5">
                  <span className="block">{item.label}</span>
                  <span className="text-xs text-gray-500 group-hover:text-brand-primary/70">
                    {item.count} event{item.count !== 1 ? "s" : ""}
                  </span>
                </div>
                <Icon
                  icon="solar:arrow-right-up-linear"
                  width="22"
                  className="opacity-70 group-hover:text-brand-primary"
                />
              </li>
            )) || []}
          </ul>
        )}
      </div>
      {/* Right column */}
      <div className="w-full lg:w-1/3">
        <div className="text-xl font-normal mb-2 font-primary">
          {eventsDropdownData?.rightTitle || "Upcoming Events"}
        </div>
        {dropdownLoading.events ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : dropdownErrors.events ? (
          <div className="text-red-500 text-sm py-4">Failed to load events</div>
        ) : (
          <ul className="space-y-2">
            {getEventsForCategory(selectedEventMiddle).length > 0 ? (
              getEventsForCategory(selectedEventMiddle).map((item, idx) => (
                <li
                  key={item.label + idx}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 group cursor-pointer hover:text-brand-primary transition"
                >
                  <Link
                    href={item.slug}
                    className="flex-1 pl-2 transition-all duration-200 border-l-4 border-transparent group-hover:border-brand-primary group-hover:pl-5 hover:no-underline"
                    onClick={() => setOpenDropdown(null)}
                  >
                    <div className="block">
                      <span className="block text-sm font-medium">
                        {item.label}
                      </span>
                      <span className="text-xs text-gray-500 group-hover:text-brand-primary/70">
                        {item.date instanceof Date
                          ? item.date.toLocaleDateString()
                          : item.date}{" "}
                        • {item.location}
                      </span>
                    </div>
                  </Link>
                  <Icon
                    icon="solar:arrow-right-up-linear"
                    width="22"
                    className="opacity-70 group-hover:text-brand-primary"
                  />
                </li>
              ))
            ) : (
              <li className="py-2 text-sm text-gray-500 italic">
                {eventsDropdownData
                  ? "No events available in this category"
                  : "Loading events..."}
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );

  const handleRegisterClick = () => {
    window.location.href = "/auth?mode=signup&redirect=%2Fprofile";
  };

  const handleLogout = async () => {
    try {
      await signOut();
      commonToasts.logoutSuccess();
      window.location.href = "/";
    } catch {
      commonToasts.somethingWentWrong();
    }
  };

  const profileDisplayName =
    profile?.displayName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "";

  const profileInitials =
    profile?.displayName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ||
    profile?.firstName?.[0]?.toUpperCase() ||
    "XP";

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 hidden lg:flex items-center justify-between px-4 py-2 bg-white backdrop-blur-md rounded-full shadow-[0_4px_24px_0_rgba(0,0,0,0.12)] mx-auto w-6xl max-w-[1400px] gap-4">
        {/* Logo */}
        <div className="flex items-center">
          <div className="w-12 h-12 relative mr-4">
            <Image
              src="/logo_full.png"
              alt="xtrawrkx"
              fill
              className="rounded-full object-cover"
              priority
            />
          </div>
        </div>
        {/* Nav Links */}
        <ul className="flex items-center gap-6 flex-1 justify-center">
          {navbarLinks.map((link) => (
            <li key={link.label} className="static">
              <a
                href={link.href}
                data-dropdown-trigger={
                  link.label === "Services"
                    ? "Services"
                    : link.label === "Communities"
                    ? "Communities"
                    : link.label === "Events"
                    ? "Events"
                    : undefined
                }
                className={
                  "text-base font-primary font-medium text-brand-dark hover:text-brand-primary transition" +
                  (link.hasDropdown ? " flex items-center gap-1" : "")
                }
                onClick={(e) => {
                  if (
                    link.label === "Services" ||
                    link.label === "Communities" ||
                    link.label === "Events"
                  ) {
                    e.preventDefault();
                    handleDropdownOpen(
                      openDropdown === link.label ? null : link.label
                    );
                  }
                }}
              >
                {link.label}
                {link.hasDropdown && (
                  <Icon
                    icon="solar:alt-arrow-down-linear"
                    className={`transition-transform duration-200 ${
                      openDropdown === link.label ? "rotate-180" : ""
                    }`}
                    width="20"
                  />
                )}
              </a>
              {/* Dropdown for Services */}
              {link.label === "Services" && (
                <Dropdown
                  open={openDropdown === "Services"}
                  onClose={() => setOpenDropdown(null)}
                  className="absolute left-0 top-full z-50 w-full"
                >
                  {servicesDropdownContent}
                </Dropdown>
              )}
              {/* Dropdown for Communities */}
              {link.label === "Communities" && (
                <Dropdown
                  open={openDropdown === "Communities"}
                  onClose={() => setOpenDropdown(null)}
                  className="absolute left-0 top-full z-50 w-full"
                >
                  {communitiesDropdownContent}
                </Dropdown>
              )}
              {/* Dropdown for Events */}
              {link.label === "Events" && (
                <Dropdown
                  open={openDropdown === "Events"}
                  onClose={() => setOpenDropdown(null)}
                  className="absolute left-0 top-full z-50 w-full"
                >
                  {eventsDropdownContent}
                </Dropdown>
              )}
            </li>
          ))}
        </ul>
        {/* CTA Button */}
        <div className="ml-4 flex items-center gap-3">
          <RegisterButton
            text="Register"
            onClick={handleRegisterClick}
            isAuthenticated={isAuthenticated}
            profileInitials={profileInitials}
            displayName={profileDisplayName}
            profileEmail={profile?.email || ""}
            onLogout={handleLogout}
          />
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-white shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <motion.div
              className="w-10 h-10 relative mr-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src="/logo/xtrawrkx_logo_full.png"
                alt="xtrawrkx"
                fill
                className="rounded-none object-cover"
                priority
              />
            </motion.div>
          </Link>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            aria-label="Toggle mobile menu"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{
                rotate: isMobileMenuOpen ? 180 : 0,
                scale: isMobileMenuOpen ? 1.1 : 1,
              }}
              transition={{
                duration: 0.3,
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
            >
              <Icon
                icon={
                  isMobileMenuOpen
                    ? "solar:close-square-linear"
                    : "solar:hamburger-menu-linear"
                }
                width="24"
                className="text-gray-700"
              />
            </motion.div>
          </motion.button>
        </div>

        {/* Full Page Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{
                duration: 0.4,
                ease: [0.4, 0.0, 0.2, 1],
                x: { type: "spring", stiffness: 300, damping: 30 },
              }}
              className="fixed inset-0 bg-white z-50 lg:hidden flex flex-col"
              style={{ height: "100vh", height: "100dvh" }}
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <Link
                  href="/"
                  className="flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <motion.div
                    className="w-10 h-10 relative mr-3"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Image
                      src="/logo/xtrawrkx_logo_full.png"
                      alt="xtrawrkx"
                      fill
                      className="rounded-none object-cover"
                      priority
                    />
                  </motion.div>
                  <span className="font-semibold text-xl text-gray-900">
                    xtrawrkx
                  </span>
                </Link>

                <motion.button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon
                    icon="solar:close-square-linear"
                    width="24"
                    className="text-gray-700"
                  />
                </motion.button>
              </div>

              {/* Mobile Menu Content */}
              <div className="flex-1 overflow-y-auto bg-white min-h-0">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="px-4 py-6 space-y-8 pb-24"
                >
                  {/* Navigation Links */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      Navigation
                    </h3>
                    {navbarLinks.map((link, index) => (
                      <motion.div
                        key={link.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.02, x: 8 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 17,
                          }}
                        >
                          <Link
                            href={link.href}
                            className="flex items-center justify-between py-4 px-4 rounded-xl text-gray-900 hover:bg-gray-50 hover:text-brand-primary transition-all duration-200 group"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <span className="text-lg font-medium">
                              {link.label}
                            </span>
                            <motion.div
                              whileHover={{ x: 4 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 17,
                              }}
                            >
                              <Icon
                                icon="solar:arrow-right-linear"
                                width="20"
                                className="text-gray-400 group-hover:text-brand-primary transition-colors"
                              />
                            </motion.div>
                          </Link>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Quick Links Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="space-y-4"
                  >
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Quick Access
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.div
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                      >
                        <Link
                          href="/communities"
                          className="block p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon
                            icon="solar:users-group-two-rounded-bold"
                            width="24"
                            className="text-blue-600 mb-2"
                          />
                          <div className="text-sm font-medium text-blue-900">
                            Communities
                          </div>
                          <div className="text-xs text-blue-600">
                            Join our network
                          </div>
                        </Link>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                      >
                        <Link
                          href="/events"
                          className="block p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-md transition-all duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon
                            icon="solar:calendar-mark-bold"
                            width="24"
                            className="text-purple-600 mb-2"
                          />
                          <div className="text-sm font-medium text-purple-900">
                            Events
                          </div>
                          <div className="text-xs text-purple-600">
                            Upcoming events
                          </div>
                        </Link>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                      >
                        <Link
                          href="/services"
                          className="block p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-md transition-all duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon
                            icon="solar:case-minimalistic-bold"
                            width="24"
                            className="text-green-600 mb-2"
                          />
                          <div className="text-sm font-medium text-green-900">
                            Services
                          </div>
                          <div className="text-xs text-green-600">
                            Our solutions
                          </div>
                        </Link>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                      >
                        <Link
                          href="/resources"
                          className="block p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 hover:shadow-md transition-all duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon
                            icon="solar:document-text-bold"
                            width="24"
                            className="text-orange-600 mb-2"
                          />
                          <div className="text-sm font-medium text-orange-900">
                            Resources
                          </div>
                          <div className="text-xs text-orange-600">
                            Downloads & more
                          </div>
                        </Link>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* CTA Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                    className="pt-6 border-t border-gray-200"
                  >
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Account & Access
                      </h3>
                      <div className="space-y-3">
                        {!isAuthenticated ? (
                          <>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 17,
                              }}
                            >
                              <RegisterButton
                                text="Register"
                                className="w-full justify-center"
                                onClick={() => {
                                  setIsMobileMenuOpen(false);
                                  handleRegisterClick();
                                }}
                                isAuthenticated={false}
                              />
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 17,
                              }}
                            >
                              <button
                                type="button"
                                className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                onClick={() => {
                                  setIsMobileMenuOpen(false);
                                  window.location.href =
                                    "/auth?mode=login&redirect=%2Fprofile";
                                }}
                              >
                                Login
                              </button>
                            </motion.div>
                          </>
                        ) : (
                          <>
                            <Link
                              href="/profile"
                              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <Icon
                                icon="solar:user-id-bold"
                                width={20}
                                className="text-gray-500"
                              />
                              View profile
                            </Link>
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                communityPortalService.openClientPortalDashboard({
                                  email: profile?.email?.trim() || "",
                                  newTab: true,
                                });
                              }}
                            >
                              <Icon
                                icon="solar:buildings-2-bold"
                                width={20}
                                className="text-gray-500"
                              />
                              Open company portal
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 rounded-lg border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                              onClick={async () => {
                                setIsMobileMenuOpen(false);
                                await handleLogout();
                              }}
                            >
                              <Icon
                                icon="solar:logout-2-bold"
                                width={20}
                                className="text-red-400"
                              />
                              Log out
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
                className="border-t border-gray-200 bg-gray-50"
              >
                {/* Footer Toggle Button */}
                <motion.button
                  onClick={() => setIsFooterExpanded(!isFooterExpanded)}
                  className="w-full px-4 py-3 flex items-center justify-between text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-medium">Quick Links</span>
                  <motion.div
                    animate={{ rotate: isFooterExpanded ? 180 : 0 }}
                    transition={{
                      duration: 0.2,
                      type: "spring",
                      stiffness: 200,
                    }}
                  >
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      width="16"
                      className="text-gray-500"
                    />
                  </motion.div>
                </motion.button>

                {/* Collapsible Footer Content */}
                <AnimatePresence>
                  {isFooterExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4">
                        {/* Main Footer Links */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <Link
                              href="/privacy-policy"
                              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/80 transition-colors text-gray-600 hover:text-gray-800"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                setIsFooterExpanded(false);
                              }}
                            >
                              <Icon
                                icon="solar:shield-check-linear"
                                width="16"
                              />
                              <span>Privacy Policy</span>
                            </Link>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                          >
                            <Link
                              href="/terms-of-service"
                              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/80 transition-colors text-gray-600 hover:text-gray-800"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                setIsFooterExpanded(false);
                              }}
                            >
                              <Icon
                                icon="solar:document-text-linear"
                                width="16"
                              />
                              <span>Terms of Service</span>
                            </Link>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Link
                              href="/sitemap"
                              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/80 transition-colors text-gray-600 hover:text-gray-800"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                setIsFooterExpanded(false);
                              }}
                            >
                              <Icon icon="solar:map-linear" width="16" />
                              <span>Sitemap</span>
                            </Link>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                          >
                            <Link
                              href="/support"
                              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/80 transition-colors text-gray-600 hover:text-gray-800"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                setIsFooterExpanded(false);
                              }}
                            >
                              <Icon
                                icon="solar:question-circle-linear"
                                width="16"
                              />
                              <span>Support</span>
                            </Link>
                          </motion.div>
                        </div>

                        {/* Social Links */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="pt-3 border-t border-gray-200"
                        >
                          <div className="text-xs text-gray-500 mb-2 font-medium">
                            Follow Us
                          </div>
                          <div className="flex space-x-3">
                            <motion.a
                              href="https://twitter.com/xtrawrkx"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Icon
                                icon="solar:twitter-linear"
                                width="16"
                                className="text-blue-600"
                              />
                            </motion.a>
                            <motion.a
                              href="https://linkedin.com/company/xtrawrkx"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Icon
                                icon="solar:linkedin-linear"
                                width="16"
                                className="text-blue-600"
                              />
                            </motion.a>
                            <motion.a
                              href="https://github.com/xtrawrkx"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Icon
                                icon="solar:github-linear"
                                width="16"
                                className="text-gray-600"
                              />
                            </motion.a>
                          </div>
                        </motion.div>

                        {/* Copyright */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 }}
                          className="pt-2 text-center"
                        >
                          <div className="text-xs text-gray-500">
                            © {new Date().getFullYear()} xtrawrkx. All rights
                            reserved.
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Always Visible Essential Links */}
                <div className="px-4 py-2 border-t border-gray-200/50">
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <Link
                      href="/privacy-policy"
                      className="hover:text-gray-700 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Privacy
                    </Link>
                    <span>•</span>
                    <Link
                      href="/terms-of-service"
                      className="hover:text-gray-700 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Terms
                    </Link>
                    <span>•</span>
                    <span>© {new Date().getFullYear()} xtrawrkx</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
