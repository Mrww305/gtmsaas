// ============================================================
// backend/store/workflow-store.ts
// Zustand store for managing React Flow canvas state
// Syncs with Supabase backend (auto-save, version tracking)
// ============================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Node, Edge, Viewport } from 'reactflow';
import type { Run, RunLog, Workflow, NodeStatus } from '@/types/database';
import { getSupabaseClient } from '@/lib/supabase/client';

// ============================================================
// Types
// ============================================================

interface WorkflowState {
  // Canvas state
  workflowId: string | null;
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;

  // Workflow metadata
  workflowName: string;
  workflowStatus: Workflow['status'];
  currentVersion: number;
  isDryRun: boolean;

  // Execution state
  activeRunId: string | null;
  activeRunStatus: Run['status'] | null;
  nodeExecutionStates: Record<string, {
    status: NodeStatus;
    errorCode: string | null;
    errorMessage: string | null;
    duration: number | null;
    cost: number;
  }>;

  // UI state
  isSaving: boolean;
  isDirty: boolean; // Unsaved changes
  lastSavedAt: string | null;
  isLoading: boolean;
  error: string | null;
}

interface WorkflowActions {
  // Canvas actions
  setWorkflowId: (id: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setViewport: (viewport: Viewport) => void;
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;

  // Workflow actions
  loadWorkflow: (id: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  updateWorkflowMeta: (updates: Partial<Pick<Workflow, 'name' | 'status' | 'is_dry_run'>>) => void;

  // Execution actions
  triggerRun: (triggerPayload?: Record<string, any>) => Promise<Run>;
  subscribeToRunLogs: (runId: string) => () => void;
  clearRunState: () => void;

  // Utility
  reset: () => void;
}

// ============================================================
// Store
// ============================================================

const initialState: WorkflowState = {
  workflowId: null,
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  workflowName: '',
  workflowStatus: 'draft',
  currentVersion: 1,
  isDryRun: false,
  activeRunId: null,
  activeRunStatus: null,
  nodeExecutionStates: {},
  isSaving: false,
  isDirty: false,
  lastSavedAt: null,
  isLoading: false,
  error: null,
};

export const useWorkflowStore = create<WorkflowState & WorkflowActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // ---- Canvas Actions ----

    setWorkflowId: (id) => set({ workflowId: id }),

    setNodes: (nodes) => set({ nodes, isDirty: true }),

    setEdges: (edges) => set({ edges, isDirty: true }),

    setViewport: (viewport) => set({ viewport }),

    onNodesChange: (changes) => {
      const { nodes } = get();
      // Apply changes to nodes (position, selection, etc.)
      const updatedNodes = applyNodeChanges(changes, nodes);
      set({ nodes: updatedNodes, isDirty: true });
    },

    onEdgesChange: (changes) => {
      const { edges } = get();
      const updatedEdges = applyEdgeChanges(changes, edges);
      set({ edges: updatedEdges, isDirty: true });
    },

    // ---- Workflow Actions ----

    loadWorkflow: async (id: string) => {
      set({ isLoading: true, error: null });

      try {
        const response = await fetch(`/api/workflows/${id}`);
        if (!response.ok) throw new Error('Failed to load workflow');

        const { workflow } = await response.json();

        set({
          workflowId: id,
          nodes: workflow.canvas_state?.nodes || [],
          edges: workflow.canvas_state?.edges || [],
          viewport: workflow.canvas_state?.viewport || { x: 0, y: 0, zoom: 1 },
          workflowName: workflow.name,
          workflowStatus: workflow.status,
          currentVersion: workflow.current_version,
          isDryRun: workflow.is_dry_run,
          isLoading: false,
          isDirty: false,
          lastSavedAt: workflow.updated_at,
        });
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
      }
    },

    saveWorkflow: async () => {
      const { workflowId, nodes, edges, viewport, isDirty, isSaving } = get();
      if (!workflowId || !isDirty || isSaving) return;

      set({ isSaving: true });

      try {
        const response = await fetch(`/api/workflows/${workflowId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            canvas_state: { nodes, edges, viewport },
          }),
        });

        if (!response.ok) throw new Error('Failed to save workflow');

        const { workflow } = await response.json();

        set({
          isSaving: false,
          isDirty: false,
          currentVersion: workflow.current_version,
          lastSavedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        set({ isSaving: false, error: err.message });
      }
    },

    updateWorkflowMeta: (updates) => {
      set((state) => ({
        ...state,
        workflowName: updates.name ?? state.workflowName,
        workflowStatus: updates.status ?? state.workflowStatus,
        isDryRun: updates.is_dry_run ?? state.isDryRun,
        isDirty: true,
      }));
    },

    // ---- Execution Actions ----

    triggerRun: async (triggerPayload) => {
      const { workflowId, isDryRun } = get();
      if (!workflowId) throw new Error('No workflow loaded');

      const response = await fetch(`/api/workflows/${workflowId}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger_type: 'manual',
          trigger_payload: triggerPayload || null,
          is_dry_run: isDryRun,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to trigger run');
      }

      const { run } = await response.json();

      set({
        activeRunId: run.id,
        activeRunStatus: run.status,
        nodeExecutionStates: {},
      });

      return run;
    },

    subscribeToRunLogs: (runId: string) => {
      const supabase = getSupabaseClient();

      // Subscribe to real-time run_log updates via Supabase Realtime
      const channel = supabase
        .channel(`run-logs-${runId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'run_logs',
            filter: `run_id=eq.${runId}`,
          },
          (payload) => {
            const log = payload.new as RunLog;

            set((state) => ({
              ...state,
              nodeExecutionStates: {
                ...state.nodeExecutionStates,
                [log.node_id]: {
                  status: log.status,
                  errorCode: log.error_code,
                  errorMessage: log.error_message,
                  duration: log.duration_ms,
                  cost: log.cost_usd,
                },
              },
            }));

            // Also update node visual state on the canvas
            const { nodes } = get();
            const updatedNodes = nodes.map((node) => {
              if (node.id !== log.node_id) return node;

              const borderColor =
                log.status === 'failed' ? '#ef4444' :
                log.status === 'success' ? '#10b981' :
                log.status === 'running' ? '#8b5cf6' :
                log.status === 'retrying' ? '#f59e0b' :
                undefined;

              return {
                ...node,
                data: {
                  ...node.data,
                  executionStatus: log.status,
                  errorCode: log.error_code,
                  errorMessage: log.error_message,
                  duration: log.duration_ms,
                  cost: log.cost_usd,
                },
                style: {
                  ...node.style,
                  borderColor,
                  borderWidth: borderColor ? '2px' : undefined,
                },
              };
            });

            set({ nodes: updatedNodes });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'runs',
            filter: `id=eq.${runId}`,
          },
          (payload) => {
            const run = payload.new as Run;
            set({ activeRunStatus: run.status });
          }
        )
        .subscribe();

      // Return cleanup function
      return () => {
        supabase.removeChannel(channel);
      };
    },

    clearRunState: () => {
      set({
        activeRunId: null,
        activeRunStatus: null,
        nodeExecutionStates: {},
        // Reset node visual states
        nodes: get().nodes.map((node) => ({
          ...node,
          data: { ...node.data, executionStatus: null, errorCode: null, errorMessage: null },
          style: { ...node.style, borderColor: undefined, borderWidth: undefined },
        })),
      });
    },

    reset: () => set(initialState),
  }))
);

// ============================================================
// Auto-save subscription (debounced)
// ============================================================

let saveTimeout: NodeJS.Timeout | null = null;

useWorkflowStore.subscribe(
  (state) => state.isDirty,
  (isDirty) => {
    if (isDirty && saveTimeout) clearTimeout(saveTimeout);
    if (isDirty) {
      saveTimeout = setTimeout(() => {
        useWorkflowStore.getState().saveWorkflow();
      }, 2000); // Auto-save 2 seconds after last change
    }
  }
);

// ============================================================
// Helper: Apply React Flow changes to nodes/edges
// (Simplified version — in production use @reactflow/core utils)
// ============================================================

function applyNodeChanges(changes: any[], nodes: Node[]): Node[] {
  let updatedNodes = [...nodes];

  for (const change of changes) {
    if (change.type === 'position' && change.position) {
      updatedNodes = updatedNodes.map((n) =>
        n.id === change.id ? { ...n, position: change.position } : n
      );
    } else if (change.type === 'select') {
      updatedNodes = updatedNodes.map((n) =>
        n.id === change.id ? { ...n, selected: change.selected } : n
      );
    } else if (change.type === 'remove') {
      updatedNodes = updatedNodes.filter((n) => n.id !== change.id);
    } else if (change.type === 'add') {
      updatedNodes = [...updatedNodes, change.item];
    }
  }

  return updatedNodes;
}

function applyEdgeChanges(changes: any[], edges: Edge[]): Edge[] {
  let updatedEdges = [...edges];

  for (const change of changes) {
    if (change.type === 'select') {
      updatedEdges = updatedEdges.map((e) =>
        e.id === change.id ? { ...e, selected: change.selected } : e
      );
    } else if (change.type === 'remove') {
      updatedEdges = updatedEdges.filter((e) => e.id !== change.id);
    } else if (change.type === 'add') {
      updatedEdges = [...updatedEdges, change.item];
    }
  }

  return updatedEdges;
}
