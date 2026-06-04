'use client';

import { Modal, Button } from '@webfudge/ui';

export default function WonDealProjectModal({
  open,
  dealName,
  busy = false,
  onClose,
  onSkipProject,
  onCreateProject,
}) {
  return (
    <Modal
      isOpen={open}
      onClose={busy ? () => {} : onClose}
      title="Deal marked as won"
      showCloseButton={!busy}
      closeOnBackdrop={!busy}
    >
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-gray-900">{dealName || 'This deal'}</span> is set to{' '}
        <span className="font-semibold text-emerald-800">Won</span>. Create a delivery project linked to this
        deal? You can add tasks and track work under Clients → Projects.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={onSkipProject}>
          {busy ? 'Saving…' : 'Skip project'}
        </Button>
        <Button type="button" variant="primary" disabled={busy} onClick={onCreateProject}>
          {busy ? 'Working…' : 'Create project'}
        </Button>
      </div>
    </Modal>
  );
}
