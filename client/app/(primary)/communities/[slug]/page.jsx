"use client";
import React from "react";
import { notFound } from "next/navigation";
import { getCommunityBySlug } from "@/src/data/CommunityData";
import XevFinPage from "@/src/components/communities/XevFinPage";
import XenPage from "@/src/components/communities/XenPage";
import XevtgPage from "@/src/components/communities/XevtgPage";
import XdDPage from "@/src/components/communities/XdDPage";

export default function CommunityPage({ params }) {
  const { slug } = React.use(params);
  const community = getCommunityBySlug(slug);

  if (!community) {
    notFound();
  }

  // Route to specialized community layouts based on slug
  switch (slug) {
    case "xev-fin":
      return <XevFinPage community={community} />;
    case "xen":
      return <XenPage community={community} />;
    case "xevtg":
      return <XevtgPage community={community} />;
    case "xd-d":
      return <XdDPage community={community} />;
    default:
      // Fallback to generic layout if needed
      return <XevFinPage community={community} />;
  }
}
