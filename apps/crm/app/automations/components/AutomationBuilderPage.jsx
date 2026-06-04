'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Upload, Save, ChevronLeft, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button, Modal, LoadingSpinner, WorkflowStatusBadge } from '@webfudge/ui';
import CRMPageHeader from '../../../components/CRMPageHeader';
import NodeLibrary from './NodeLibrary';
import AutomationCanvas from './AutomationCanvas';
import NodeConfigPanel from './NodeConfigPanel';
import { useAutomationBuilder } from '../hooks/useAutomationBuilder';
import { getWorkflow, saveWorkflow, runTestWorkflow, publishWorkflow } from '../services/automationService';

// ─── Toast notification ───────────────────────────────────────────────────────

function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />,
    error: <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />,
    info: <Loader2 className="w-4 h-4 text-blue-500 flex-shrink-0 animate-spin" />,
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium animate-in slide-in-from-top-2 duration-200 ${styles[type]}`}>
      {icons[type]}
      {message}
    </div>
  );
}

// ─── Test run modal ───────────────────────────────────────────────────────────

function TestRunModal({ isOpen, onClose, result, isRunning }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Test Run Results" size="lg">
      {isRunning ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <LoadingSpinner />
          <p className="text-sm text-gray-500">Running test workflow…</p>
        </div>
      ) : result ? (
        <div className="space-y-4">
          <div className={`flex items-center gap-2 p-3 rounded-xl border ${result.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {result.status === 'success'
              ? <CheckCircle2 className="w-5 h-5 text-green-600" />
              : <AlertTriangle className="w-5 h-5 text-red-600" />
            }
            <span className={`text-sm font-semibold ${result.status === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {result.status === 'success' ? 'Test passed — all nodes executed successfully' : 'Test failed'}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Node Results</p>
            {(result.nodes || []).map((n) => (
              <div key={n.nodeId} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-sm text-gray-700">{n.nodeLabel}</span>
                </div>
                <span className="text-xs text-gray-400">{n.durationMs}ms</span>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">Logs</p>
            <div className="space-y-1 font-mono text-xs text-green-400">
              {(result.logs || []).map((log, i) => (
                <p key={i}>{log}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

// ─── AutomationBuilderPage ────────────────────────────────────────────────────

export default function AutomationBuilderPage({ workflowId }) {
  const router = useRouter();
  const isNew = !workflowId;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [testModal, setTestModal] = useState({ open: false, result: null, running: false });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const {
    workflow,
    nodes,
    edges,
    selectedNodeId,
    selectedNode,
    isDirty,
    workflowPayload,
    setWorkflowMeta,
    addNode,
    updateNodeConfig,
    updateNodePosition,
    deleteNode,
    duplicateNode,
    setSelectedNode,
    addEdge,
    deleteEdge,
    loadWorkflow,
  } = useAutomationBuilder();

  // Load existing workflow
  useEffect(() => {
    if (!workflowId) return;
    setLoading(true);
    getWorkflow(workflowId)
      .then((wf) => {
        if (wf) loadWorkflow(wf);
        else showToast('Workflow not found', 'error');
      })
      .catch(() => showToast('Failed to load workflow', 'error'))
      .finally(() => setLoading(false));
  }, [workflowId, loadWorkflow, showToast]);

  // Save
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const saved = await saveWorkflow(workflowPayload);
      setWorkflowMeta({ id: saved.id });
      showToast('Workflow saved');
      if (isNew) router.replace(`/automations/${saved.id}`);
    } catch {
      showToast('Failed to save workflow', 'error');
    } finally {
      setSaving(false);
    }
  }, [workflowPayload, setWorkflowMeta, isNew, router, showToast]);

  // Test run
  const handleTest = useCallback(async () => {
    setTestModal({ open: true, result: null, running: true });
    try {
      const result = await runTestWorkflow(workflowPayload);
      setTestModal({ open: true, result, running: false });
    } catch {
      setTestModal({ open: true, result: { status: 'error', nodes: [], logs: ['Test run failed.'] }, running: false });
    }
  }, [workflowPayload]);

  // Publish
  const handlePublish = useCallback(async () => {
    setSaving(true);
    try {
      let wf = workflowPayload;
      if (!wf.id) {
        wf = await saveWorkflow(wf);
        setWorkflowMeta({ id: wf.id });
      }
      const published = await publishWorkflow(wf.id);
      setWorkflowMeta({ status: 'active' });
      showToast('Workflow published and active');
      if (isNew) router.replace(`/automations/${wf.id}`);
    } catch {
      showToast('Failed to publish workflow', 'error');
    } finally {
      setSaving(false);
    }
  }, [workflowPayload, setWorkflowMeta, isNew, router, showToast]);

  // Auto-save on dirty after 2s debounce
  const autoSaveTimer = useRef(null);
  useEffect(() => {
    if (!isDirty || !workflow.id) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveWorkflow(workflowPayload).catch(() => {});
    }, 2000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [isDirty, workflow.id, workflowPayload]);

  const breadcrumb = [
    { label: 'Home', href: '/' },
    { label: 'Automations', href: '/automations' },
    { label: isNew ? 'New Workflow' : (workflow.name || 'Builder') },
  ];

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <CRMPageHeader title="Automations" breadcrumb={breadcrumb} />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50" style={{ minHeight: 'calc(100vh - 0px)' }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white shadow-sm" id="automation-builder-header">
        <CRMPageHeader
          breadcrumb={breadcrumb}
          showProfile
        >
          <div className="flex items-center gap-3 w-full">
            {/* Back */}
            <button
              onClick={() => router.push('/automations')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="w-px h-5 bg-gray-200" />

            {/* Editable workflow name */}
            <input
              value={workflow.name}
              onChange={(e) => setWorkflowMeta({ name: e.target.value })}
              className="flex-1 min-w-0 text-sm font-semibold text-gray-900 bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-orange-500 focus:outline-none px-1 py-0.5 transition-colors"
              placeholder="Workflow name…"
            />

            {/* Status badge */}
            <WorkflowStatusBadge status={workflow.status} size="md" />

            {/* Dirty indicator */}
            {isDirty && !saving && (
              <span className="text-[11px] text-gray-400 flex-shrink-0">Unsaved changes</span>
            )}

            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              {/* Save */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1" />
                )}
                Save
              </Button>

              {/* Test */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTest}
                disabled={saving}
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                Test
              </Button>

              {/* Publish */}
              <Button
                variant="primary"
                size="sm"
                onClick={handlePublish}
                disabled={saving || workflow.status === 'active'}
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <Upload className="w-3.5 h-3.5 mr-1" />
                )}
                {workflow.status === 'active' ? 'Published' : 'Publish'}
              </Button>
            </div>
          </div>
        </CRMPageHeader>
      </div>

      {/* 3-panel builder — fills remaining viewport height */}
      <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 128px)' }}>
        {/* LEFT — Node Library (280px) */}
        <div className="w-70 flex-shrink-0 overflow-hidden" style={{ width: 280 }}>
          <NodeLibrary />
        </div>

        {/* CENTER — Canvas */}
        <AutomationCanvas
          nodes={nodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNode}
          onAddNode={addNode}
          onDeleteNode={deleteNode}
          onDuplicateNode={duplicateNode}
          onUpdateNodePosition={updateNodePosition}
          onAddEdge={addEdge}
          onDeleteEdge={deleteEdge}
        />

        {/* RIGHT — Config Panel (320px) */}
        <div className="flex-shrink-0 overflow-hidden" style={{ width: 320 }}>
          <NodeConfigPanel
            selectedNode={selectedNode}
            onUpdateConfig={updateNodeConfig}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      </div>

      {/* Test run modal */}
      <TestRunModal
        isOpen={testModal.open}
        onClose={() => setTestModal({ open: false, result: null, running: false })}
        result={testModal.result}
        isRunning={testModal.running}
      />
    </div>
  );
}
