'use client';

import { AppPageHeader } from '@webfudge/ui';
import GlobalSearchModal from './GlobalSearchModal';
import notificationService from '../lib/api/notificationService';

export default function PMPageHeader(props) {
  return (
    <AppPageHeader
      {...props}
      notificationService={notificationService}
      renderGlobalSearchModal={({ isOpen, onClose, initialQuery }) => (
        <GlobalSearchModal isOpen={isOpen} onClose={onClose} initialQuery={initialQuery} />
      )}
    />
  );
}
