'use client'

import { AppShell } from '../../layouts'
import { PwaInstallPrompt } from '../PwaInstallPrompt'
import { AccessDeniedPanel } from '../AccessDeniedPanel'

/**
 * Shared layout shell used by PM, CRM, and Accounts `LayoutContent` files.
 *
 * Each app passes its app-specific sidebar, PWA name/key, and the result of
 * its own RBAC check as `canView`.  App-specific extras (e.g. PM's FAB) can
 * be passed via `extras`.  To fully customise the denied state, pass
 * `deniedContent` — otherwise `AccessDeniedPanel` renders with the given
 * `deniedTitle`/`deniedDescription`/`deniedVariant` props.
 *
 * @param {{
 *   sidebar: React.ComponentType,
 *   appName?: string,
 *   pwaStorageKey?: string,
 *   showPwa?: boolean,
 *   canView: boolean,
 *   deniedTitle?: string,
 *   deniedDescription?: string,
 *   deniedVariant?: 'centered' | 'card',
 *   deniedContent?: React.ReactNode,
 *   extras?: React.ReactNode,
 *   children: React.ReactNode,
 * }} props
 */
export function WorkspaceLayoutContent({
  sidebar,
  appName,
  pwaStorageKey,
  showPwa = true,
  canView,
  deniedTitle,
  deniedDescription,
  deniedVariant = 'centered',
  deniedContent,
  extras,
  children,
}) {
  return (
    <AppShell sidebar={sidebar}>
      {showPwa && appName && pwaStorageKey && (
        <PwaInstallPrompt appName={appName} storageKey={pwaStorageKey} />
      )}
      {canView ? (
        <>
          {children}
          {extras}
        </>
      ) : (
        deniedContent ?? (
          <AccessDeniedPanel
            title={deniedTitle}
            description={deniedDescription}
            variant={deniedVariant}
          />
        )
      )}
    </AppShell>
  )
}

export default WorkspaceLayoutContent
