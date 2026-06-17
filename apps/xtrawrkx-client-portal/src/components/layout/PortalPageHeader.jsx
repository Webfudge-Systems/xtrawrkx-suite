"use client";

import { usePathname } from "next/navigation";
import GlobalSearchModal from "@/components/search/GlobalSearchModal";
import { PortalPageHeaderShell } from "./PortalPageHeaderShell";

/**
 * Client portal page header — mirrors PM/CRM AppPageHeader wiring:
 * shell UI + app-specific global search modal.
 */
export default function PortalPageHeader({
  showBack,
  renderGlobalSearchModal,
  ...props
}) {
  const pathname = usePathname();
  const defaultShowBack = pathname !== "/dashboard";

  return (
    <PortalPageHeaderShell
      {...props}
      showBack={showBack ?? defaultShowBack}
      renderGlobalSearchModal={
        renderGlobalSearchModal ||
        ((modalProps) => <GlobalSearchModal {...modalProps} />)
      }
    />
  );
}

export { PortalPageHeader as PageHeader };
