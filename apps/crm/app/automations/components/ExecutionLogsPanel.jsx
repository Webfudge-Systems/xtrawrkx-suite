'use client';

/**
 * ExecutionLogsPanel — Future placeholder.
 *
 * Will display per-workflow execution history, per-node status,
 * timestamps, input/output payloads, and error tracebacks.
 */

import { Activity } from 'lucide-react';

export default function ExecutionLogsPanel({ workflowId }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-3">
        <Activity className="w-5 h-5 text-gray-300" />
      </div>
      <p className="text-sm font-medium text-gray-400">Execution Logs</p>
      <p className="text-xs text-gray-300 mt-1 max-w-xs">
        Full execution history, per-node status, timing, and error details will appear here once the automation engine is connected.
      </p>
    </div>
  );
}
