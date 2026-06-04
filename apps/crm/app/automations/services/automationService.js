'use client';

/**
 * Automation Service — localStorage-backed for now; API-ready structure.
 *
 * All methods return Promises so they can be swapped for real API calls
 * (e.g. Strapi content API) without changing call sites.
 */

const STORAGE_KEY = 'webfudge_crm_automations';

function readStore() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeStore(data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateId() {
  return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Get all saved workflows.
 * @returns {Promise<Array>}
 */
export async function getWorkflows() {
  const store = readStore();
  return Object.values(store).sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );
}

/**
 * Get a single workflow by ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getWorkflow(id) {
  const store = readStore();
  return store[id] || null;
}

/**
 * Save (create or update) a workflow.
 * @param {object} workflow - { id?, name, status, description, nodes, edges, version? }
 * @returns {Promise<object>} Saved workflow with id, createdAt, updatedAt
 */
export async function saveWorkflow(workflow) {
  const store = readStore();
  const now = new Date().toISOString();
  const id = workflow.id || generateId();

  const existing = store[id];
  const saved = {
    ...workflow,
    id,
    version: (existing?.version ?? 0) + 1,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    lastRunAt: existing?.lastRunAt || null,
    runCount: existing?.runCount ?? 0,
  };

  store[id] = saved;
  writeStore(store);
  return saved;
}

/**
 * Delete a workflow by ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteWorkflow(id) {
  const store = readStore();
  delete store[id];
  writeStore(store);
}

/**
 * Run a test execution of a workflow (dry run).
 * Returns a mock execution result for now.
 * @param {object} workflow
 * @returns {Promise<object>} Test result
 */
export async function runTestWorkflow(workflow) {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const nodeResults = (workflow.nodes || []).map((node) => ({
    nodeId: node.id,
    nodeLabel: node.label,
    status: 'success',
    output: { message: `Node "${node.label}" would execute successfully.` },
    durationMs: Math.floor(Math.random() * 200) + 50,
  }));

  return {
    workflowId: workflow.id,
    testRunId: `test_${Date.now()}`,
    status: 'success',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    nodes: nodeResults,
    logs: nodeResults.map((r) => `[OK] ${r.nodeLabel}: ${r.output.message}`),
  };
}

/**
 * Publish a workflow (set status to active).
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function publishWorkflow(id) {
  const workflow = await getWorkflow(id);
  if (!workflow) throw new Error(`Workflow ${id} not found.`);
  return saveWorkflow({ ...workflow, status: 'active' });
}

/**
 * Pause a workflow.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function pauseWorkflow(id) {
  const workflow = await getWorkflow(id);
  if (!workflow) throw new Error(`Workflow ${id} not found.`);
  return saveWorkflow({ ...workflow, status: 'paused' });
}

const automationService = {
  getWorkflows,
  getWorkflow,
  saveWorkflow,
  deleteWorkflow,
  runTestWorkflow,
  publishWorkflow,
  pauseWorkflow,
};

export default automationService;
