'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Select,
  Textarea,
  TaskStatusStepper,
  Badge,
  PM_TASK_STATUS_OPTIONS,
} from '@webfudge/ui';
import { getTaskStatusLabel } from '@webfudge/utils';
import taskService from '../lib/api/taskService';

const ACTION_TYPE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'quote', label: 'Additional quote' },
  { value: 'financial_decision', label: 'Financial decision' },
  { value: 'approval', label: 'Approval required' },
  { value: 'info', label: 'Information needed' },
];

export default function ClientTaskWorkflowPanel({ task, taskId, onUpdated }) {
  const [status, setStatus] = useState(task?.strapiStatus || 'ASSIGNED');
  const [actionNotes, setActionNotes] = useState('');
  const [actionType, setActionType] = useState(task?.clientActionType || 'none');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStatus(task?.strapiStatus || 'ASSIGNED');
  }, [task?.strapiStatus]);

  useEffect(() => {
    setActionType(task?.clientActionType || 'none');
  }, [task?.clientActionType]);

  if (!task) return null;

  const isShared = !!task.isSharedWithClient;
  const statusLabel = getTaskStatusLabel(task.strapiStatus, { variant: 'internal', task });

  const patchShare = async (payload) => {
    setBusy(true);
    try {
      await taskService.shareWithClient(taskId, payload);
      onUpdated?.();
    } catch (e) {
      alert(e.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async () => {
    if (!status || status === task.strapiStatus) return;
    setBusy(true);
    try {
      await taskService.updateTask(taskId, {
        status,
        workflowNote: actionNotes.trim() || undefined,
      });
      setActionNotes('');
      onUpdated?.();
    } catch (e) {
      alert(e.message || 'Status update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card variant="elevated" className="rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Client workflow</h3>
          <p className="text-sm text-gray-500">
            Share tasks with the client portal and manage status through the client-visible pipeline.
          </p>
        </div>
        <Badge className={isShared ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>
          {isShared ? 'Shared with client' : 'Internal only'}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={isShared ? 'outline' : 'primary'}
          disabled={busy}
          onClick={() =>
            patchShare({
              isSharedWithClient: !isShared,
              note: isShared ? 'Unshared from client portal' : 'Shared with client portal',
            })
          }
        >
          {isShared ? 'Stop sharing with client' : 'Share with client'}
        </Button>
        {isShared && task.createdBySource === 'client' ? (
          <Badge className="bg-blue-100 text-blue-800">Client-created task</Badge>
        ) : null}
      </div>

      {isShared ? (
        <>
          <TaskStatusStepper status={task.strapiStatus} variant="internal" task={task} />
          <p className="text-sm text-gray-600">
            Status: <strong>{statusLabel}</strong>
          </p>

          <Select
            label="Update status"
            value={status}
            onChange={setStatus}
            options={PM_TASK_STATUS_OPTIONS}
            placeholder="Select status"
          />
          <Textarea
            label="Note (visible in client portal history)"
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            rows={2}
            placeholder="Optional note when changing status…"
          />
          <Button
            onClick={updateStatus}
            disabled={busy || !status || status === task.strapiStatus}
          >
            Update status
          </Button>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-800">Request client action</h4>
            <p className="text-xs text-gray-500">
              Sends the task to the client for review or approval. Sets status to Client review.
            </p>
            <Select
              label="Action type"
              value={actionType}
              onChange={setActionType}
              options={ACTION_TYPE_OPTIONS}
            />
            <Button
              variant="outline"
              disabled={busy || actionType === 'none'}
              onClick={() =>
                patchShare({
                  isSharedWithClient: true,
                  clientActionRequired: true,
                  clientActionType: actionType,
                  clientActionNotes: actionNotes.trim() || undefined,
                })
              }
            >
              Send to client for review
            </Button>
          </div>
        </>
      ) : null}
    </Card>
  );
}
