"use client";

import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { termsContent } from "@/data/legalContent";

export default function TermsPage() {
  return (
    <LegalDocumentPage
      currentPageId="terms"
      title={termsContent.title}
      description={termsContent.description}
      lastUpdated={termsContent.lastUpdated}
      sections={termsContent.sections}
    />
  );
}
