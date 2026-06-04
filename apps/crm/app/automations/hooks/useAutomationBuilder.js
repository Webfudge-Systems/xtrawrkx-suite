'use client';

import { useReducer, useCallback, useMemo } from 'react';
import { NODE_TYPE_MAP } from '../utils/nodeTypes';

// ─── Action types ─────────────────────────────────────────────────────────────

const A = {
  SET_WORKFLOW_META: 'SET_WORKFLOW_META',
  ADD_NODE: 'ADD_NODE',
  UPDATE_NODE: 'UPDATE_NODE',
  UPDATE_NODE_CONFIG: 'UPDATE_NODE_CONFIG',
  UPDATE_NODE_POSITION: 'UPDATE_NODE_POSITION',
  DELETE_NODE: 'DELETE_NODE',
  DUPLICATE_NODE: 'DUPLICATE_NODE',
  SET_SELECTED_NODE: 'SET_SELECTED_NODE',
  ADD_EDGE: 'ADD_EDGE',
  DELETE_EDGE: 'DELETE_EDGE',
  LOAD_WORKFLOW: 'LOAD_WORKFLOW',
  RESET: 'RESET',
};

// ─── Initial state ────────────────────────────────────────────────────────────

const DEFAULT_WORKFLOW = {
  id: null,
  name: 'Untitled Workflow',
  status: 'draft',
  description: '',
  version: 0,
  createdAt: null,
  updatedAt: null,
  lastRunAt: null,
  runCount: 0,
};

const START_NODE = {
  id: 'start',
  typeId: null,
  type: 'trigger',
  label: 'Start Trigger',
  description: 'Choose a trigger to start your workflow',
  iconName: 'Zap',
  position: { x: 360, y: 60 },
  config: {},
  isStart: true,
};

function createInitialState(initialWorkflow = null) {
  if (initialWorkflow) {
    return {
      workflow: { ...DEFAULT_WORKFLOW, ...initialWorkflow },
      nodes: initialWorkflow.nodes || [START_NODE],
      edges: initialWorkflow.edges || [],
      selectedNodeId: null,
      isDirty: false,
    };
  }
  return {
    workflow: { ...DEFAULT_WORKFLOW },
    nodes: [START_NODE],
    edges: [],
    selectedNodeId: null,
    isDirty: false,
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function generateNodeId() {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function generateEdgeId() {
  return `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function reducer(state, action) {
  switch (action.type) {
    case A.SET_WORKFLOW_META:
      return {
        ...state,
        workflow: { ...state.workflow, ...action.payload },
        isDirty: true,
      };

    case A.ADD_NODE: {
      const typeDef = NODE_TYPE_MAP[action.payload.typeId];
      const newNode = {
        id: generateNodeId(),
        typeId: action.payload.typeId,
        type: typeDef?.type || 'action',
        label: typeDef?.label || 'Node',
        description: typeDef?.description || '',
        iconName: typeDef?.iconName || 'Circle',
        position: action.payload.position || { x: 200, y: 200 },
        config: { ...(typeDef?.defaultConfig || {}) },
        isStart: false,
      };
      return {
        ...state,
        nodes: [...state.nodes, newNode],
        selectedNodeId: newNode.id,
        isDirty: true,
      };
    }

    case A.UPDATE_NODE: {
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.payload.id ? { ...n, ...action.payload.changes } : n
        ),
        isDirty: true,
      };
    }

    case A.UPDATE_NODE_CONFIG: {
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.payload.id
            ? { ...n, config: { ...n.config, ...action.payload.config } }
            : n
        ),
        isDirty: true,
      };
    }

    case A.UPDATE_NODE_POSITION: {
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.payload.id
            ? { ...n, position: action.payload.position }
            : n
        ),
        isDirty: true,
      };
    }

    case A.DELETE_NODE: {
      const id = action.payload;
      if (id === 'start') return state;
      return {
        ...state,
        nodes: state.nodes.filter((n) => n.id !== id),
        edges: state.edges.filter(
          (e) => e.sourceNodeId !== id && e.targetNodeId !== id
        ),
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        isDirty: true,
      };
    }

    case A.DUPLICATE_NODE: {
      const source = state.nodes.find((n) => n.id === action.payload);
      if (!source || source.isStart) return state;
      const dup = {
        ...source,
        id: generateNodeId(),
        position: { x: source.position.x + 40, y: source.position.y + 40 },
        config: { ...source.config },
      };
      return {
        ...state,
        nodes: [...state.nodes, dup],
        selectedNodeId: dup.id,
        isDirty: true,
      };
    }

    case A.SET_SELECTED_NODE:
      return { ...state, selectedNodeId: action.payload };

    case A.ADD_EDGE: {
      const { sourceNodeId, sourceHandle, targetNodeId, targetHandle } = action.payload;
      const alreadyExists = state.edges.some(
        (e) =>
          e.sourceNodeId === sourceNodeId &&
          e.sourceHandle === sourceHandle &&
          e.targetNodeId === targetNodeId
      );
      if (alreadyExists || sourceNodeId === targetNodeId) return state;
      const newEdge = {
        id: generateEdgeId(),
        sourceNodeId,
        sourceHandle: sourceHandle || 'output',
        targetNodeId,
        targetHandle: targetHandle || 'input',
      };
      return { ...state, edges: [...state.edges, newEdge], isDirty: true };
    }

    case A.DELETE_EDGE:
      return {
        ...state,
        edges: state.edges.filter((e) => e.id !== action.payload),
        isDirty: true,
      };

    case A.LOAD_WORKFLOW:
      return {
        ...createInitialState(action.payload),
        isDirty: false,
      };

    case A.RESET:
      return createInitialState();

    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAutomationBuilder(initialWorkflow = null) {
  const [state, dispatch] = useReducer(reducer, null, () =>
    createInitialState(initialWorkflow)
  );

  // Workflow meta
  const setWorkflowMeta = useCallback(
    (changes) => dispatch({ type: A.SET_WORKFLOW_META, payload: changes }),
    []
  );

  // Nodes
  const addNode = useCallback(
    (typeId, position) => dispatch({ type: A.ADD_NODE, payload: { typeId, position } }),
    []
  );

  const updateNode = useCallback(
    (id, changes) => dispatch({ type: A.UPDATE_NODE, payload: { id, changes } }),
    []
  );

  const updateNodeConfig = useCallback(
    (id, config) => dispatch({ type: A.UPDATE_NODE_CONFIG, payload: { id, config } }),
    []
  );

  const updateNodePosition = useCallback(
    (id, position) => dispatch({ type: A.UPDATE_NODE_POSITION, payload: { id, position } }),
    []
  );

  const deleteNode = useCallback(
    (id) => dispatch({ type: A.DELETE_NODE, payload: id }),
    []
  );

  const duplicateNode = useCallback(
    (id) => dispatch({ type: A.DUPLICATE_NODE, payload: id }),
    []
  );

  const setSelectedNode = useCallback(
    (id) => dispatch({ type: A.SET_SELECTED_NODE, payload: id }),
    []
  );

  // Edges
  const addEdge = useCallback(
    (sourceNodeId, sourceHandle, targetNodeId, targetHandle) =>
      dispatch({
        type: A.ADD_EDGE,
        payload: { sourceNodeId, sourceHandle, targetNodeId, targetHandle },
      }),
    []
  );

  const deleteEdge = useCallback(
    (id) => dispatch({ type: A.DELETE_EDGE, payload: id }),
    []
  );

  // Load / Reset
  const loadWorkflow = useCallback(
    (workflow) => dispatch({ type: A.LOAD_WORKFLOW, payload: workflow }),
    []
  );

  const reset = useCallback(() => dispatch({ type: A.RESET }), []);

  // Derived
  const selectedNode = useMemo(
    () => state.nodes.find((n) => n.id === state.selectedNodeId) || null,
    [state.nodes, state.selectedNodeId]
  );

  const workflowPayload = useMemo(
    () => ({
      ...state.workflow,
      nodes: state.nodes,
      edges: state.edges,
    }),
    [state.workflow, state.nodes, state.edges]
  );

  return {
    // State
    workflow: state.workflow,
    nodes: state.nodes,
    edges: state.edges,
    selectedNodeId: state.selectedNodeId,
    selectedNode,
    isDirty: state.isDirty,
    workflowPayload,

    // Actions
    setWorkflowMeta,
    addNode,
    updateNode,
    updateNodeConfig,
    updateNodePosition,
    deleteNode,
    duplicateNode,
    setSelectedNode,
    addEdge,
    deleteEdge,
    loadWorkflow,
    reset,
  };
}

export default useAutomationBuilder;
