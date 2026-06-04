"use client";

import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { privacyContent } from "@/data/legalContent";

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      currentPageId="privacy"
      title={privacyContent.title}
      description={privacyContent.description}
      lastUpdated={privacyContent.lastUpdated}
      sections={privacyContent.sections}
    />
  );
}
