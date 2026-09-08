// ============================================================
// backend/hooks/useWorkflowSync.ts
// 
// THE GLUE: Connects your React Flow canvas to the Supabase backend.
// 
// Usage in your canvas page component:
// 
// ```tsx
// export default function WorkflowCanvasPage({ params }) {
//   const { workflowId } = params;
//   const {
//     nodes, edges, onNodesChange, onEdgesChange,
//     isSaving, isDirty, activeRunStatus,
//     handleRun, handleSave, nodeExecutionStates
//   } = useWorkflowSync(workflowId);
//
//   return (
//     <ReactFlow
//       nodes={nodes.map(n => ({
//         ...n,
//         data: { ...n.data, ...nodeExecutionStates[n.id] }
//       }))}
//       edges={edges}
//       onNodesChange={onNodesChange}
//       onEdgesChange={onEdgesChange}
//       nodeTypes={nodeTypes}
//     />
//   );
// }
// ```
// ============================================================

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useNodesState, useEdgesState, useReactFlow, type Node, type Edge } from 'reactflow';
import { useWorkflowStore } from '@/store/workflow-store';
import type { Run, RunLog } from '@/types/database';

export function useWorkflowSync(workflowId: string) {
  const store = useWorkflowStore();
  const { fitView } = useReactFlow();
  const cleanupRef = useRef<(() => void) | null>(null);

  // ---- Local React Flow state (synced with store) ----
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // ---- Load workflow from backend on mount ----
  useEffect(() => {
    if (workflowId) {
      store.loadWorkflow(workflowId);
    }

    return () => {
      store.reset();
    };
  }, [workflowId]);

  // ---- Sync store → local React Flow state ----
  useEffect(() => {
    if (store.nodes.length > 0 || store.workflowId === workflowId) {
      setNodes(store.nodes);
      setEdges(store.edges);
    }
  }, [store.nodes, store.edges, store.workflowId]);

  // ---- Sync local changes → store (triggers auto-save) ----
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    // Debounced sync to store (store handles auto-save)
    // We use the store's onNodesChange which sets isDirty=true
  }, [onNodesChange]);

  const handleEdgesChange = useCallback((changes: any[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  // ---- When local nodes/edges change, update store ----
  useEffect(() => {
    // Only sync if we're not in the middle of loading
    if (!store.isLoading && store.workflowId) {
      store.setNodes(nodes);
      store.setEdges(edges);
    }
  }, [nodes, edges]);

  // ---- Subscribe to real-time run logs when a run is active ----
  useEffect(() => {
    if (store.activeRunId) {
      cleanupRef.current = store.subscribeToRunLogs(store.activeRunId);
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [store.activeRunId]);

  // ---- Trigger a workflow run ----
  const handleRun = useCallback(async (triggerPayload?: Record<string, any>) => {
    try {
      // Save current canvas state first
      await store.saveWorkflow();

      // Trigger the run
      const run = await store.triggerRun(triggerPayload);

      return run;
    } catch (error: any) {
      console.error('[useWorkflowSync] Failed to trigger run:', error);
      throw error;
    }
  }, [store]);

  // ---- Manual save ----
  const handleSave = useCallback(async () => {
    await store.saveWorkflow();
  }, [store]);

  // ---- Build enriched nodes with execution state ----
  const enrichedNodes = useMemo(() => {
    return nodes.map((node) => {
      const execState = store.nodeExecutionStates[node.id];

      if (!execState) return node;

      // Map execution status to visual styles
      const borderColor =
        execState.status === 'failed' ? '#ef4444' :
        execState.status === 'success' ? '#10b981' :
        execState.status === 'running' ? '#8b5cf6' :
        execState.status === 'retrying' ? '#f59e0b' :
        execState.status === 'skipped' ? '#6b7280' :
        undefined;

      const bgColor =
        execState.status === 'failed' ? 'rgba(239, 68, 68, 0.05)' :
        execState.status === 'success' ? 'rgba(16, 185, 129, 0.05)' :
        execState.status === 'running' ? 'rgba(139, 92, 246, 0.05)' :
        undefined;

      return {
        ...node,
        data: {
          ...node.data,
          // Execution state for custom node components
          executionStatus: execState.status,
          errorCode: execState.errorCode,
          errorMessage: execState.errorMessage,
          duration: execState.duration,
          cost: execState.cost,
        },
        style: {
          ...node.style,
          borderColor,
          borderWidth: borderColor ? '2px' : undefined,
          backgroundColor: bgColor,
          // Add animation for running nodes
          animation: execState.status === 'running' ? 'pulse 2s infinite' : undefined,
        },
      };
    });
  }, [nodes, store.nodeExecutionStates]);

  // ---- Build enriched edges with execution flow ----
  const enrichedEdges = useMemo(() => {
    return edges.map((edge) => {
      const sourceState = store.nodeExecutionStates[edge.source];
      const targetState = store.nodeExecutionStates[edge.target];

      // If both nodes completed successfully, highlight the edge
      if (sourceState?.status === 'success' && targetState?.status === 'success') {
        return {
          ...edge,
          animated: false,
          style: { ...edge.style, stroke: '#10b981', strokeWidth: 2 },
        };
      }

      // If currently flowing through this edge
      if (sourceState?.status === 'success' && targetState?.status === 'running') {
        return {
          ...edge,
          animated: true,
          style: { ...edge.style, stroke: '#8b5cf6', strokeWidth: 2 },
        };
      }

      // If failed
      if (targetState?.status === 'failed') {
        return {
          ...edge,
          animated: false,
          style: { ...edge.style, stroke: '#ef4444', strokeWidth: 2 },
        };
      }

      return edge;
    });
  }, [edges, store.nodeExecutionStates]);

  // ---- Fit view on initial load ----
  useEffect(() => {
    if (nodes.length > 0 && store.isLoading === false) {
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    }
  }, [store.isLoading, nodes.length]);

  return {
    // Canvas state
    nodes: enrichedNodes,
    edges: enrichedEdges,
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,

    // Workflow metadata
    workflowName: store.workflowName,
    workflowStatus: store.workflowStatus,
    currentVersion: store.currentVersion,
    isDryRun: store.isDryRun,

    // Execution state
    activeRunId: store.activeRunId,
    activeRunStatus: store.activeRunStatus,
    nodeExecutionStates: store.nodeExecutionStates,

    // UI state
    isSaving: store.isSaving,
    isDirty: store.isDirty,
    lastSavedAt: store.lastSavedAt,
    isLoading: store.isLoading,
    error: store.error,

    // Actions
    handleRun,
    handleSave,
    updateMeta: store.updateWorkflowMeta,
    clearRunState: store.clearRunState,
  };
}
