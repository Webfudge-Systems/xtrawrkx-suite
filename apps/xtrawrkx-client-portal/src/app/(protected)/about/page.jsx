"use client";

import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { aboutContent } from "@/data/legalContent";

export default function AboutPage() {
  return (
    <LegalDocumentPage
      currentPageId="about"
      title={aboutContent.title}
      description={aboutContent.description}
      lastUpdated={aboutContent.lastUpdated}
      sections={aboutContent.sections}
    />
  );
}
