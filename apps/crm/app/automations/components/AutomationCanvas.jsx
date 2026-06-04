'use client';

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  memo,
} from 'react';
import { ZoomIn, ZoomOut, Maximize2, Trash2 } from 'lucide-react';
import AutomationNode from './AutomationNode';

// ─── SVG edge path ────────────────────────────────────────────────────────────

function getEdgePath(sx, sy, tx, ty) {
  const dy = Math.abs(ty - sy);
  const curve = Math.max(60, dy * 0.5);
  return `M ${sx} ${sy} C ${sx} ${sy + curve}, ${tx} ${ty - curve}, ${tx} ${ty}`;
}

// ─── Edge component ───────────────────────────────────────────────────────────

const HANDLE_COLORS = {
  output: '#fb923c',
  'output-true': '#4ade80',
  'output-false': '#f87171',
};

function EdgePath({ edge, nodes, onDelete }) {
  const [hovered, setHovered] = useState(false);

  const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
  const targetNode = nodes.find((n) => n.id === edge.targetNodeId);
  if (!sourceNode || !targetNode) return null;

  const NODE_W = 208;
  const NODE_H = 100;

  const isCondition = sourceNode.type === 'condition';
  let sx, sy;

  if (edge.sourceHandle === 'output-true') {
    sx = sourceNode.position.x + NODE_W * 0.25;
    sy = sourceNode.position.y + NODE_H;
  } else if (edge.sourceHandle === 'output-false') {
    sx = sourceNode.position.x + NODE_W * 0.75;
    sy = sourceNode.position.y + NODE_H;
  } else {
    sx = sourceNode.position.x + NODE_W / 2;
    sy = sourceNode.position.y + NODE_H;
  }

  const tx = targetNode.position.x + NODE_W / 2;
  const ty = targetNode.position.y;

  const d = getEdgePath(sx, sy, tx, ty);
  const color = HANDLE_COLORS[edge.sourceHandle] || '#fb923c';
  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Invisible wider path for easier hover */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={16} style={{ cursor: 'pointer' }} />
      <path
        d={d}
        fill="none"
        stroke={hovered ? '#f97316' : color}
        strokeWidth={hovered ? 2.5 : 2}
        strokeDasharray={hovered ? '6 3' : 'none'}
        markerEnd="url(#arrowhead)"
        style={{ transition: 'all 0.15s' }}
      />
      {hovered && (
        <g
          transform={`translate(${midX - 10}, ${midY - 10})`}
          style={{ cursor: 'pointer' }}
          onClick={() => onDelete(edge.id)}
        >
          <circle cx={10} cy={10} r={10} fill="white" stroke="#e5e7eb" strokeWidth={1.5} />
          <line x1={6} y1={6} x2={14} y2={14} stroke="#ef4444" strokeWidth={1.5} strokeLinecap="round" />
          <line x1={14} y1={6} x2={6} y2={14} stroke="#ef4444" strokeWidth={1.5} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

// ─── In-progress edge (while connecting) ─────────────────────────────────────

function DraftEdge({ from, to }) {
  if (!from || !to) return null;
  const d = getEdgePath(from.x, from.y, to.x, to.y);
  return (
    <path
      d={d}
      fill="none"
      stroke="#f97316"
      strokeWidth={2}
      strokeDasharray="6 3"
      opacity={0.7}
    />
  );
}

// ─── AutomationCanvas ─────────────────────────────────────────────────────────

function AutomationCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onAddNode,
  onDeleteNode,
  onDuplicateNode,
  onUpdateNodePosition,
  onAddEdge,
  onDeleteEdge,
}) {
  const canvasRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // Panning
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Node dragging
  const draggingNode = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Connection drawing
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // ── Canvas coordinate helpers ──────────────────────────────────────────────

  const canvasPoint = useCallback(
    (clientX, clientY) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - pan.x) / scale,
        y: (clientY - rect.top - pan.y) / scale,
      };
    },
    [pan, scale]
  );

  // ── Node dragging ──────────────────────────────────────────────────────────

  const handleNodeDragStart = useCallback(
    (e, nodeId) => {
      if (connectingFrom) return;
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const pt = canvasPoint(e.clientX, e.clientY);
      draggingNode.current = nodeId;
      dragOffset.current = {
        x: pt.x - node.position.x,
        y: pt.y - node.position.y,
      };
    },
    [nodes, canvasPoint, connectingFrom]
  );

  const handleNodeDragEnd = useCallback(() => {
    draggingNode.current = null;
  }, []);

  // ── Connection handles ─────────────────────────────────────────────────────

  const handleHandleMouseDown = useCallback(
    (e, nodeId, handleType) => {
      e.stopPropagation();
      if (handleType === 'input') return;
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const NODE_W = 208;
      const NODE_H = 100;
      let hx, hy;
      if (handleType === 'output-true') {
        hx = node.position.x + NODE_W * 0.25;
        hy = node.position.y + NODE_H;
      } else if (handleType === 'output-false') {
        hx = node.position.x + NODE_W * 0.75;
        hy = node.position.y + NODE_H;
      } else {
        hx = node.position.x + NODE_W / 2;
        hy = node.position.y + NODE_H;
      }
      setConnectingFrom({ nodeId, handle: handleType, x: hx, y: hy });
    },
    [nodes]
  );

  // ── Global mouse events ────────────────────────────────────────────────────

  useEffect(() => {
    const onMouseMove = (e) => {
      if (draggingNode.current) {
        const pt = canvasPoint(e.clientX, e.clientY);
        onUpdateNodePosition(draggingNode.current, {
          x: Math.round(pt.x - dragOffset.current.x),
          y: Math.round(pt.y - dragOffset.current.y),
        });
        return;
      }
      if (isPanning.current) {
        setPan((prev) => ({
          x: prev.x + e.clientX - panStart.current.x,
          y: prev.y + e.clientY - panStart.current.y,
        }));
        panStart.current = { x: e.clientX, y: e.clientY };
        return;
      }
      if (connectingFrom) {
        const pt = canvasPoint(e.clientX, e.clientY);
        setCursorPos(pt);
      }
    };

    const onMouseUp = (e) => {
      if (draggingNode.current) {
        draggingNode.current = null;
        return;
      }
      isPanning.current = false;

      if (connectingFrom) {
        // Check if dropped on an input handle
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const handleId = el?.dataset?.handleId;
        if (handleId) {
          const [targetNodeId, handleType] = handleId.split('__');
          if (handleType === 'input' && targetNodeId !== connectingFrom.nodeId) {
            onAddEdge(connectingFrom.nodeId, connectingFrom.handle, targetNodeId, 'input');
          }
        }
        setConnectingFrom(null);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [canvasPoint, connectingFrom, onAddEdge, onUpdateNodePosition]);

  // ── Canvas mouse events ────────────────────────────────────────────────────

  const handleCanvasMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (e.target === canvasRef.current || e.target.classList.contains('canvas-bg')) {
        onSelectNode(null);
        if (!connectingFrom) {
          isPanning.current = true;
          panStart.current = { x: e.clientX, y: e.clientY };
        }
      }
    },
    [onSelectNode, connectingFrom]
  );

  // ── Drop from library ──────────────────────────────────────────────────────

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const typeId = e.dataTransfer.getData('application/automation-node-type');
      if (!typeId) return;
      const pt = canvasPoint(e.clientX, e.clientY);
      onAddNode(typeId, { x: Math.round(pt.x - 104), y: Math.round(pt.y - 50) });
    },
    [canvasPoint, onAddNode]
  );

  const handleDragOver = (e) => e.preventDefault();

  // ── Zoom ──────────────────────────────────────────────────────────────────

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setScale((s) => Math.min(2, Math.max(0.3, s + delta)));
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const zoom = (dir) =>
    setScale((s) => Math.min(2, Math.max(0.3, parseFloat((s + dir * 0.15).toFixed(2)))));

  const resetView = () => { setPan({ x: 0, y: 0 }); setScale(1); };

  // ── SVG dims (large enough to cover all nodes) ───────────────────────────

  const svgW = 4000;
  const svgH = 4000;

  return (
    <div className="relative flex-1 bg-gray-50 overflow-hidden">
      {/* Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 overflow-hidden"
        onMouseDown={handleCanvasMouseDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{ cursor: isPanning.current ? 'grabbing' : connectingFrom ? 'crosshair' : 'default' }}
      >
        {/* Grid background */}
        <div
          className="canvas-bg absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
            backgroundSize: `${20 * scale}px ${20 * scale}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {/* Transform container */}
        <div
          className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: svgW,
            height: svgH,
          }}
        >
          {/* Edges SVG */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={svgW}
            height={svgH}
            style={{ overflow: 'visible' }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="8"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L8,3 z" fill="#fb923c" />
              </marker>
            </defs>
            {edges.map((edge) => (
              <EdgePath
                key={edge.id}
                edge={edge}
                nodes={nodes}
                onDelete={onDeleteEdge}
              />
            ))}
            {connectingFrom && (
              <DraftEdge
                from={connectingFrom}
                to={cursorPos}
              />
            )}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => (
            <AutomationNode
              key={node.id}
              node={node}
              isSelected={node.id === selectedNodeId}
              onSelect={onSelectNode}
              onDelete={onDeleteNode}
              onDuplicate={onDuplicateNode}
              onDragStart={handleNodeDragStart}
              onDragEnd={handleNodeDragEnd}
              onHandleMouseDown={handleHandleMouseDown}
              connectingFromHandle={!!connectingFrom}
            />
          ))}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-20">
        <button
          onClick={() => zoom(1)}
          className="w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoom(-1)}
          className="w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600"
          title="Reset view"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <span className="text-xs text-gray-400 bg-white/80 px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Empty canvas hint */}
      {nodes.length <= 1 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border-2 border-dashed border-orange-200 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-400">Drag nodes from the left panel</p>
            <p className="text-xs text-gray-300 mt-1">to build your automation workflow</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(AutomationCanvas);
