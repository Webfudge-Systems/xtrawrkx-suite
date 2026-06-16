"use client";

import { Select as UiSelect } from "@webfudge/ui";

/**
 * Client portal select — wraps @webfudge/ui Select with searchable dropdown
 * and portaled menu defaults (works inside modals and scrollable panels).
 */
export function Select({
  searchable = true,
  menuPortal = true,
  ...props
}) {
  return (
    <UiSelect
      searchable={searchable}
      menuPortal={menuPortal}
      {...props}
    />
  );
}

export default Select;
