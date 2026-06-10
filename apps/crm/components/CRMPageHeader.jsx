'use client';

import { usePathname } from 'next/navigation';
import { AppPageHeader } from '@webfudge/ui';
import GlobalSearchModal from './GlobalSearchModal';
import notificationService from '../lib/api/notificationService';

export default function CRMPageHeader({ showBack, ...props }) {
  const pathname = usePathname();
  const defaultShowBack = pathname !== '/';

  return (
    <AppPageHeader
      {...props}
      showBack={showBack ?? defaultShowBack}
      notificationService={notificationService}
      renderGlobalSearchModal={({ isOpen, onClose, initialQuery }) => (
        <GlobalSearchModal isOpen={isOpen} onClose={onClose} initialQuery={initialQuery} />
      )}
    />
  );
}
