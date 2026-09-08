# RevFlow Backend — Complete Integration Guide

## 📁 File Structure

```
backend/
├── lib/
│   ├── supabase/
│   │   ├── server.ts          # Server-side Supabase client (API routes)
│   │   └── client.ts          # Browser-side Supabase client (React hooks)
│   └── bullmq/
│       ├── queues.ts          # Queue definitions (workflow, enrichment, AI, webhook)
│       └── workers/
│           └── workflow-executor.ts  # Core execution engine
├── app/api/
│   ├── workflows/
│   │   ├── route.ts           # GET/POST workflows
│   │   └── [id]/
│   │       ├── route.ts       # GET/PATCH/DELETE single workflow
│   │       └── runs/
│   │           └── route.ts   # POST trigger run, GET list runs
│   ├── webhooks/
│   │   └── inbound/
│   │       └── [workflowId]/
│   │           └── route.ts   # Public webhook catcher
│   └── integrations/
│       └── route.ts           # BYO API key management (Vault)
├── store/
│   └── workflow-store.ts      # Zustand store (canvas ↔ backend sync)
├── hooks/
│   └── useWorkflowSync.ts     # React hook for canvas binding
├── workers/
│   └── index.ts               # Worker process entry point
└── supabase/
    └── rpc-functions.sql      # Database helper functions
```

---

## 🚀 Setup Instructions

### 1. Environment Variables

Create `.env.local` in your Next.js root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # ⚠️ Server-only

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# Optional: Production Redis
# REDIS_URL=rediss://default:your-password@your-redis-host:6379
```

### 2. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr bullmq ioredis zustand
npm install -D @types/ioredis
```

### 3. Run Database Migrations

Copy the SQL from Task 1 (schema) and the RPC functions from `backend/supabase/rpc-functions.sql` into your Supabase SQL Editor. Run them in order:

1. `001_enums.sql` → Types
2. `002_workspaces.sql` → Workspaces table
3. `003_workspace_members.sql` → Members
4. `004_integrations.sql` → Integrations
5. `005_workflows.sql` → Workflows
6. `006_workflow_versions.sql` → Versioning
7. `007_runs.sql` → Run history
8. `008_run_logs.sql` → Node-level logs
9. `009_data_records.sql` → Enriched data (30-day TTL)
10. `010_rls_policies.sql` → Security policies
11. `011_auto_pruning.sql` → Cron jobs
12. `012_vault_setup.sql` → Vault extension
13. `rpc-functions.sql` → Helper functions

### 4. Enable Supabase Extensions

In Supabase Dashboard → Database → Extensions, enable:
- `pg_cron` (for auto-pruning)
- `supabase_vault` (for BYO API key storage)
- `pgcrypto` (for UUID generation)

### 5. Start Redis

```bash
# Local development
docker run -d --name revflow-redis -p 6379:6379 redis:7-alpine

# Or use Upstash (serverless Redis) for production
# REDIS_URL=rediss://default:your-password@your-upstash-host:6379
```

### 6. Start the Workers

```bash
# In a separate terminal from your Next.js dev server
npx tsx backend/workers/index.ts
```

### 7. Copy Files Into Your Next.js Project

Copy the `backend/` contents into your Next.js project:
- `backend/lib/` → `src/lib/`
- `backend/app/api/` → `src/app/api/`
- `backend/store/` → `src/store/`
- `backend/hooks/` → `src/hooks/`
- `backend/workers/` → `src/workers/` (or keep at root)

---

## 🔗 Wiring the Frontend

### In Your Canvas Page Component

```tsx
// src/app/workflows/[id]/page.tsx
'use client';

import { ReactFlow, ReactFlowProvider, Controls, Background, MiniMap } from 'reactflow';
import { useWorkflowSync } from '@/hooks/useWorkflowSync';
import { CustomNode } from '@/components/nodes/CustomNode';

const nodeTypes = {
  trigger: CustomNode,
  enrich: CustomNode,
  ai: CustomNode,
  condition: CustomNode,
  delay: CustomNode,
  execute: CustomNode,
  alert: CustomNode,
  filter: CustomNode,
  split: CustomNode,
};

function WorkflowCanvas({ params }: { params: { id: string } }) {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange,
    workflowName, workflowStatus, isDryRun,
    activeRunStatus, nodeExecutionStates,
    isSaving, isDirty, lastSavedAt,
    handleRun, handleSave, updateMeta,
  } = useWorkflowSync(params.id);

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <input
          value={workflowName}
          onChange={(e) => updateMeta({ name: e.target.value })}
          className="text-lg font-bold bg-transparent"
        />
        <div className="flex items-center gap-3">
          {isDirty && <span className="text-xs text-amber-400">Unsaved</span>}
          {isSaving && <span className="text-xs text-slate-400">Saving...</span>}
          {lastSavedAt && <span className="text-xs text-slate-500">Saved {new Date(lastSavedAt).toLocaleTimeString()}</span>}
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isDryRun}
              onChange={(e) => updateMeta({ is_dry_run: e.target.checked })}
            />
            Dry Run
          </label>

          <button onClick={handleSave} disabled={!isDirty || isSaving}>
            💾 Save
          </button>
          
          <button
            onClick={() => handleRun()}
            disabled={activeRunStatus === 'running'}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg"
          >
            {activeRunStatus === 'running' ? '⏳ Running...' : '▶ Run'}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Run Status Bar */}
      {activeRunStatus && (
        <div className="p-3 border-t bg-slate-900 flex items-center gap-4">
          <span className={`w-2 h-2 rounded-full ${
            activeRunStatus === 'running' ? 'bg-violet-400 animate-pulse' :
            activeRunStatus === 'completed' ? 'bg-emerald-400' :
            activeRunStatus === 'failed' ? 'bg-red-400' :
            'bg-slate-400'
          }`} />
          <span className="text-sm text-white">
            Status: {activeRunStatus}
          </span>
          <span className="text-sm text-slate-400">
            Nodes: {Object.values(nodeExecutionStates).filter(s => s.status === 'success').length} / {Object.keys(nodeExecutionStates).length}
          </span>
          <span className="text-sm text-cyan-400">
            Cost: ${Object.values(nodeExecutionStates).reduce((sum, s) => sum + (s.cost || 0), 0).toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}

export default function Page({ params }: { params: { id: string } }) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas params={params} />
    </ReactFlowProvider>
  );
}
```

### Custom Node Component (with execution state)

```tsx
// src/components/nodes/CustomNode.tsx
import { Handle, Position, type NodeProps } from 'reactflow';

export function CustomNode({ data, selected }: NodeProps) {
  const { label, type, executionStatus, errorCode, errorMessage, duration, cost } = data;

  const statusColors = {
    pending: 'border-slate-600',
    running: 'border-violet-500 animate-pulse',
    success: 'border-emerald-500',
    failed: 'border-red-500',
    retrying: 'border-amber-500',
    skipped: 'border-slate-500',
  };

  return (
    <div className={`px-4 py-3 rounded-xl bg-slate-800 border-2 ${
      selected ? 'border-violet-400' : statusColors[executionStatus] || 'border-slate-700'
    } min-w-[160px]`}>
      <Handle type="target" position={Position.Left} />
      
      <div className="text-xs text-slate-400 uppercase mb-1">{type}</div>
      <div className="text-sm font-medium text-white">{label}</div>
      
      {executionStatus && (
        <div className="mt-2 pt-2 border-t border-white/10">
          {executionStatus === 'success' && (
            <div className="text-xs text-emerald-400">
              ✓ {duration}ms · ${cost?.toFixed(4)}
            </div>
          )}
          {executionStatus === 'failed' && (
            <div className="text-xs text-red-400">
              ✗ {errorCode}: {errorMessage}
            </div>
          )}
          {executionStatus === 'running' && (
            <div className="text-xs text-violet-400">⏳ Processing...</div>
          )}
        </div>
      )}
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
```

---

## 🔄 Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. User drags nodes on canvas                                       │
│     └→ Zustand store updates (isDirty = true)                        │
│        └→ Auto-save after 2s debounce                                │
│           └→ PATCH /api/workflows/:id                                │
│              └→ Supabase: UPDATE workflows SET canvas_state = ...    │
│                 └→ Creates workflow_version snapshot                  │
│                                                                       │
│  2. User clicks "Run"                                                │
│     └→ POST /api/workflows/:id/runs                                  │
│        └→ Creates `runs` record (status: queued)                     │
│           └→ Creates `run_logs` for each node (status: pending)      │
│              └→ Adds job to BullMQ workflowQueue                     │
│                                                                       │
│  3. BullMQ Worker picks up job                                       │
│     └→ Updates runs.status = 'running'                               │
│        └→ For each node (topological order):                         │
│           └→ Updates run_logs SET status = 'running'                 │
│              └→ Executes node (enrich/AI/condition/execute)          │
│                 └→ Updates run_logs SET status = 'success'/'failed'  │
│                    └→ Supabase Realtime broadcasts to frontend       │
│                       └→ React hook updates node visual state        │
│                          └→ User sees node turn green/red in real-time│
│                                                                       │
│  4. Run completes                                                    │
│     └→ Updates runs SET status = 'completed', total_cost_usd = ...   │
│        └→ Increments workspace monthly counters                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Architecture Decisions

| Decision | Why |
|----------|-----|
| **BullMQ over alternatives** | Per-tenant queue isolation, exponential backoff, dead-letter queues, job cancellation |
| **Supabase Vault** | Encrypted-at-rest API key storage without managing encryption keys |
| **run_logs table** | Real-time node status via Supabase Realtime → frontend highlights nodes in red/green |
| **30-day data pruning** | Keeps DB costs near zero for a bootstrapped startup |
| **Zustand + auto-save** | No manual "Save" button needed, 2s debounce prevents API spam |
| **Topological sort** | Ensures nodes execute in correct dependency order regardless of canvas layout |
| **Dry run mode** | Users can test workflows without burning API credits |

---

## 📊 What's Next (Task 3 Preview)

When you say "Go" for Task 3, I'll build:
1. **Supabase Edge Functions** for webhook signature verification and Vault key retrieval
2. **Enrichment waterfall** logic (Apollo → Clearbit → ScrapingBee fallback chain)
3. **LinkedIn Signal Harvester** Chrome Extension → webhook integration
4. **Stripe billing integration** for usage-based metering

**Ready when you are.** Say **"Go"** for Task 3.
