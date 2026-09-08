# RevFlow — The Visual Canvas for Revenue Operations

> **A complete GTM orchestration platform for modern revenue teams. Built by [Megnito.com](https://megnito.com).**

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-emerald)]()
[![License](https://img.shields.io/badge/License-Proprietary-red)]()
[![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Supabase%20%7C%20BullMQ-violet)]()

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Quick Start](#quick-start)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Backend Workers](#backend-workers)
8. [Chrome Extension](#chrome-extension)
9. [Frontend Integration](#frontend-integration)
10. [Deployment Guide](#deployment-guide)
11. [Environment Variables](#environment-variables)
12. [Testing](#testing)
13. [Troubleshooting](#troubleshooting)
14. [Contributing](#contributing)

---

## 🎯 Overview

RevFlow is a **visual GTM orchestration platform** that unifies data enrichment, AI-powered outreach, workflow automation, and multi-channel execution in a single canvas.

### Core Value Proposition

| Problem | RevFlow Solution |
|---------|------------------|
| **Data Fragmentation** | Unified data layer with 50+ integrations |
| **Execution Latency** | Visual canvas → live in 4 minutes |
| **AI Without Context** | Pre-prompted nodes + BYO API keys |
| **Tool Sprawl** | Replace 12+ tools with 1 platform |

### Key Features

- ✅ **Visual Workflow Canvas** — React Flow-based drag-and-drop builder
- ✅ **Enrichment Waterfall** — Apollo → Clearbit → ScrapingBee fallback chain
- ✅ **AI Routing** — Auto-selects Claude 3.5 Sonnet vs GPT-4o-mini
- ✅ **LinkedIn Signal Harvester** — Chrome extension captures job changes, profile views
- ✅ **Usage Dashboard** — Real-time metering with cost attribution
- ✅ **Team Collaboration** — Role-based access (Owner/Admin/Editor/Viewer)
- ✅ **Advanced Analytics** — ROI tracking, node performance metrics
- ✅ **Stripe Billing** — Usage-based pricing with hard limits

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  React Flow Canvas ←→ Zustand Store ←→ Supabase Realtime        │
│  Usage Dashboard ←→ API Routes ←→ Stripe Billing                │
│  Team Settings ←→ Audit Logs ←→ Analytics                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (BullMQ Workers)                    │
├─────────────────────────────────────────────────────────────────┤
│  Workflow Executor ←→ Enrichment Waterfall ←→ AI Router         │
│  Signal Processor ←→ Webhook Delivery ←→ Cost Tracker           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE (Supabase)                     │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL (RLS) ←→ Redis (Queues) ←→ Vault (API Keys)         │
│  Edge Functions ←→ Storage ←→ Realtime                          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → API Route → Supabase → BullMQ Queue → Worker → External API
                                                              ↓
Frontend ← Supabase Realtime ← Run Logs ← Worker Execution ←┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React framework (App Router) | 14+ |
| **React Flow** | Visual workflow canvas | 11+ |
| **Zustand** | State management | 4+ |
| **Tailwind CSS** | Styling | 3+ |
| **Framer Motion** | Animations | 10+ |
| **Recharts** | Dashboard charts | 2+ |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Supabase** | Database + Auth + Realtime | Latest |
| **PostgreSQL** | Primary database | 15+ |
| **Redis** | Queue backend (BullMQ) | 7+ |
| **BullMQ** | Job queue system | 5+ |
| **Stripe** | Billing + payments | 2024-12-18 |

### External Services
| Service | Purpose | Cost |
|---------|---------|------|
| **Apollo.io** | Email enrichment | $0.01/lookup |
| **Clearbit** | Company enrichment | $0.05/lookup |
| **ScrapingBee** | Custom scraping | $0.001/request |
| **OpenAI** | AI processing (GPT-4o-mini) | $0.00015/1K tokens |
| **Anthropic** | AI processing (Claude 3.5) | $0.003/1K tokens |
| **Smartlead** | Email execution | Varies |
| **Instantly** | Email execution | Varies |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or Supabase account)
- Redis 7+ (local or cloud)
- Stripe account (for billing)
- API keys for enrichment/AI providers

### 1. Clone & Install

```bash
git clone https://github.com/your-org/revflow.git
cd revflow
npm install
```

### 2. Environment Setup

```bash
cp backend/.env.example .env.local
```

Fill in required values (see [Environment Variables](#environment-variables)).

### 3. Database Setup

```bash
# If using Supabase:
# 1. Create new project at supabase.com
# 2. Copy project URL and keys to .env.local
# 3. Run migrations in SQL Editor (see Database Schema section)

# If using local PostgreSQL:
createdb revflow
psql revflow < backend/supabase/migrations/*.sql
```

### 4. Start Redis

```bash
# Local development
docker run -d --name revflow-redis -p 6379:6379 redis:7-alpine

# Or use Upstash (serverless Redis)
# REDIS_URL=rediss://default:your-password@your-upstash-host:6379
```

### 5. Start Development Servers

```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: BullMQ workers
npx tsx backend/workers/index.ts
```

### 6. Access the App

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Workers**: Running in background (check terminal output)

---

## 🗄️ Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `workspaces` | Tenant boundary | id, name, plan, usage_limits |
| `workspace_members` | RBAC | user_id, workspace_id, role |
| `integrations` | BYO API keys | provider, vault_key_id, status |
| `workflows` | Canvas state | canvas_state (JSONB), status |
| `workflow_versions` | Rollback history | version_number, canvas_state |
| `runs` | Execution history | status, cost, trigger_payload |
| `run_logs` | Node-level status | node_id, status, error_code |
| `data_records` | Enriched data (30-day TTL) | enriched_data, expires_at |
| `audit_logs` | Compliance tracking | action, user_id, metadata |

### Row Level Security (RLS)

All tables have RLS enabled. Policies ensure:
- Users can only access their own workspace data
- Role-based permissions (owner > admin > editor > viewer)
- Service role key bypasses RLS (for workers only)

### Auto-Pruning

```sql
-- Data records: 30-day TTL
DELETE FROM data_records WHERE expires_at < now();

-- Audit logs: 1-year retention
DELETE FROM audit_logs WHERE created_at < now() - INTERVAL '1 year';

-- Run logs: 90-day retention
DELETE FROM run_logs WHERE created_at < now() - INTERVAL '90 days';
```

### Migrations

Run migrations in order:

```bash
# 001-013: Core schema (see backend/supabase/migrations/)
# 014: Audit logs (added in Task 4)
```

---

## 🔌 API Reference

### Authentication

All API routes require Supabase authentication except:
- `POST /api/webhooks/inbound/[workflowId]` — Public webhook catcher
- `POST /api/webhooks/stripe` — Stripe webhook handler

### Endpoints

#### Workflows

```typescript
// List workflows
GET /api/workflows?status=draft|active|paused

// Create workflow
POST /api/workflows
Body: { name, description?, emoji?, canvas_state? }

// Get workflow
GET /api/workflows/[id]

// Update workflow (auto-versions if canvas_state changes)
PATCH /api/workflows/[id]
Body: { name?, canvas_state?, status?, trigger_config? }

// Delete workflow (soft delete)
DELETE /api/workflows/[id]
```

#### Runs

```typescript
// Trigger workflow run
POST /api/workflows/[id]/runs
Body: { trigger_type, trigger_payload?, is_dry_run? }

// List runs
GET /api/workflows/[id]/runs?page=1&limit=20&status=completed

// Get run logs (node-level status)
GET /api/workflows/[id]/runs/[runId]/logs
```

#### Integrations

```typescript
// List integrations (never returns actual API keys)
GET /api/integrations

// Add BYO API key (stored in Supabase Vault)
POST /api/integrations
Body: { provider: 'apollo', display_name?, config: { api_key } }

// Delete integration
DELETE /api/integrations?id=[integration_id]
```

#### Webhooks

```typescript
// Inbound webhook catcher (public)
POST /api/webhooks/inbound/[workflowId]
Body: { ...any payload }
Headers: { x-revflow-signature?: string }

// Stripe webhook handler
POST /api/webhooks/stripe
Headers: { stripe-signature: string }
```

#### Billing

```typescript
// Create checkout session
POST /api/billing/checkout
Body: { workspace_id, plan: 'starter'|'growth' }

// Get billing portal URL
GET /api/billing/portal?workspace_id=[id]

// Get usage limits
GET /api/billing/limits?workspace_id=[id]
```

#### Team

```typescript
// List members
GET /api/team/members

// Invite member
POST /api/invites
Body: { email, role: 'admin'|'editor'|'viewer' }

// Cancel invite
DELETE /api/invites?id=[invite_id]

// List audit logs (admin/owner only)
GET /api/audit-logs?action=workflow.created&period=30d
```

#### Usage & Analytics

```typescript
// Get usage metrics
GET /api/usage?period=7d|30d|90d

// Get advanced analytics
GET /api/analytics?workflow_id=[id]&period=30d
```

#### LinkedIn Signals

```typescript
// Receive signal from Chrome extension
POST /api/signals/linkedin
Body: { workspace_id, signal: { type, actor, details, timestamp } }
```

---

## ⚙️ Backend Workers

### Architecture

Workers run as a **separate process** from Next.js. They process jobs from BullMQ queues.

```
Next.js API → BullMQ Queue → Worker → External API
                ↓
           Redis (stores jobs)
```

### Queue Types

| Queue | Purpose | Concurrency | Rate Limit |
|-------|---------|-------------|------------|
| `revflow:workflows` | Main orchestrator | 10 | 100/sec |
| `revflow:enrichment` | Enrichment API calls | 20 | 50/sec |
| `revflow:ai` | LLM API calls | 15 | 30/sec |
| `revflow:webhooks` | Outbound webhook delivery | 25 | 100/sec |

### Per-Tenant Isolation

Each workspace gets isolated queue processing to prevent one user's heavy job from blocking others:

```typescript
// Queue name includes workspace ID
const queueName = `revflow:workflows:tenant:${workspaceId}`;
```

### Exponential Backoff

Failed jobs retry with exponential backoff:

```typescript
backoff: {
  type: 'exponential',
  delay: 2000, // 2s, 4s, 8s, 16s...
}
```

### Starting Workers

```bash
# Development
npx tsx backend/workers/index.ts

# Production (PM2)
pm2 start backend/workers/index.ts --interpreter npx --name revflow-workers

# Production (Docker)
docker run -d --name revflow-workers revflow-workers:latest
```

---

## 🧩 Chrome Extension

### Overview

The **RevFlow Signal Harvester** Chrome extension captures LinkedIn signals (job changes, profile views, post engagement) and triggers automated workflows.

### Signal Types

| Signal | Trigger | Use Case |
|--------|---------|----------|
| `job_change` | User changes job | Congratulate + pitch |
| `profile_view` | User views profile | Re-engage warm lead |
| `post_engagement` | High-engagement post | Comment + connect |
| `connection` | New connection accepted | Welcome sequence |
| `company_update` | Company news/funding | Timed outreach |

### Installation

```bash
# 1. Build extension
cd backend/chrome-extension
# (Create icons: icon16.png, icon48.png, icon128.png)

# 2. Load in Chrome
# - Go to chrome://extensions
# - Enable "Developer mode"
# - Click "Load unpacked"
# - Select backend/chrome-extension folder

# 3. Configure
# - Click extension icon
# - Enter workspace ID + API key
# - Enable signal capture
```

### How It Works

```
User browses LinkedIn
  ↓
Content script detects signal (DOM parsing)
  ↓
Background service worker receives signal
  ↓
Deduplicates (24-hour TTL)
  ↓
Adds to queue
  ↓
Flushes every 1 minute → POST /api/signals/linkedin
  ↓
Backend finds matching workflows → Triggers runs
```

### Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension manifest (MV3) |
| `background.js` | Service worker — queue, dedup, API sync |
| `content.js` | Content script — DOM parsing |
| `popup.html` | Settings UI |
| `popup.js` | Popup logic |

---

## 🎨 Frontend Integration

### Canvas Component

```tsx
// src/app/workflows/[id]/page.tsx
import { ReactFlow, ReactFlowProvider } from 'reactflow';
import { useWorkflowSync } from '@/hooks/useWorkflowSync';

function WorkflowCanvas({ params }) {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange,
    handleRun, handleSave,
    nodeExecutionStates,
  } = useWorkflowSync(params.id);

  return (
    <ReactFlow
      nodes={nodes.map(n => ({
        ...n,
         { ...n.data, ...nodeExecutionStates[n.id] }
      }))}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
    />
  );
}
```

### Real-Time Node Highlighting

When a workflow runs, nodes update in real-time:

```typescript
// Node status → visual state
const borderColor =
  status === 'success' ? '#10b981' :  // Green
  status === 'failed' ? '#ef4444' :   // Red
  status === 'running' ? '#8b5cf6' :  // Purple (animated)
  status === 'retrying' ? '#f59e0b' : // Amber
  undefined;
```

### Usage Dashboard

```tsx
// src/app/dashboard/page.tsx
import { UsageDashboard } from '@/components/dashboard/UsageDashboard';

export default function DashboardPage() {
  return <UsageDashboard workspaceId={workspaceId} />;
}
```

### Analytics

```tsx
// src/app/analytics/page.tsx
import { WorkflowAnalytics } from '@/components/analytics/WorkflowAnalytics';

export default function AnalyticsPage() {
  return <WorkflowAnalytics workflowId={workflowId} />;
}
```

### Team Settings

```tsx
// src/app/settings/team/page.tsx
import { TeamSettings } from '@/components/team/TeamSettings';

export default function TeamPage() {
  return (
    <TeamSettings
      workspaceId={workspaceId}
      currentUserId={userId}
      currentUserRole={role}
    />
  );
}
```

---

## 🌍 Deployment Guide

### 1. Supabase Setup

```bash
# 1. Create project at supabase.com
# 2. Enable extensions:
#    - pg_cron (auto-pruning)
#    - supabase_vault (API key storage)
#    - pgcrypto (UUID generation)

# 3. Run migrations (001-014)
# 4. Deploy Edge Functions:
supabase functions deploy get-vault-key
supabase functions deploy verify-webhook-signature
```

### 2. Redis Setup

**Option A: Upstash (Recommended for production)**

```bash
# 1. Create account at upstash.com
# 2. Create Redis database
# 3. Copy connection string to .env.local
REDIS_URL=rediss://default:your-password@your-host:6379
```

**Option B: Self-hosted**

```bash
docker run -d \
  --name revflow-redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine
```

### 3. Stripe Setup

```bash
# 1. Create products in Stripe dashboard:
#    - Starter: $249/mo
#    - Growth: $749/mo

# 2. Copy price IDs to .env.local:
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_GROWTH=price_...

# 3. Create webhook endpoint:
#    URL: https://your-domain.com/api/webhooks/stripe
#    Events: checkout.session.completed, customer.subscription.updated, etc.

# 4. Copy webhook secret to .env.local:
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Deploy Next.js

**Option A: Vercel (Recommended)**

```bash
npm i -g vercel
vercel
```

**Option B: Docker**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 5. Deploy Workers

**Option A: Railway**

```bash
railway up
```

**Option B: Docker + PM2**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY backend ./backend
CMD ["npx", "tsx", "backend/workers/index.ts"]
```

### 6. Chrome Extension

```bash
# 1. Create icons (16x16, 48x48, 128x128)
# 2. Zip the extension folder
cd backend/chrome-extension
zip -r revflow-extension.zip .

# 3. Upload to Chrome Web Store
# https://chrome.google.com/webstore/devconsole
```

---

## 🔐 Environment Variables

```bash
# ============================================================
# SUPABASE
# ============================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # ⚠️ Server-only

# ============================================================
# REDIS
# ============================================================
REDIS_URL=redis://localhost:6379

# ============================================================
# STRIPE
# ============================================================
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...  # $249/mo
STRIPE_PRICE_GROWTH=price_...   # $749/mo

# ============================================================
# APP CONFIG
# ============================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# Test API routes
npm run test:integration

# Test workers
npm run test:workers
```

### E2E Tests

```bash
npm run test:e2e
```

### Manual Testing Checklist

- [ ] Create workflow with 3 nodes (trigger → enrich → execute)
- [ ] Trigger run → verify nodes highlight green/red in real-time
- [ ] Test dry run mode (no external API calls)
- [ ] Test enrichment waterfall (Apollo fails → Clearbit succeeds)
- [ ] Test AI routing (complex task → Claude, simple → GPT-4o-mini)
- [ ] Test Chrome extension (detect job change → trigger workflow)
- [ ] Test team invites (invite member → change role → remove member)
- [ ] Test usage metering (approach limit → warning → hard cap)
- [ ] Test Stripe checkout (create subscription → verify limits applied)
- [ ] Test audit logs (perform actions → verify logs created)

---

## 🐛 Troubleshooting

### Workers Not Processing Jobs

```bash
# Check Redis connection
redis-cli ping  # Should return PONG

# Check worker logs
npx tsx backend/workers/index.ts  # Look for errors

# Check BullMQ queue status
redis-cli keys "bull:*"  # Should see queue keys
```

### API Keys Not Working

```bash
# Verify Vault extension is enabled
# Supabase Dashboard → Database → Extensions → supabase_vault

# Check integration status
SELECT * FROM integrations WHERE status != 'active';
```

### Real-Time Updates Not Working

```bash
# Check Supabase Realtime is enabled
# Supabase Dashboard → Database → Settings → Realtime

# Check browser console for WebSocket errors
```

### Chrome Extension Not Detecting Signals

```bash
# Check content script is loaded
# chrome://extensions → RevFlow → "Service Worker" → Console

# Check LinkedIn URL matches manifest.json host_permissions
```

### Stripe Webhooks Failing

```bash
# Verify webhook signature
# Stripe Dashboard → Developers → Webhooks → [endpoint] → Signing secret

# Check webhook logs
# Stripe Dashboard → Developers → Webhooks → [endpoint] → Attempts
```

---

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- 80%+ test coverage

### Pull Request Process

1. Update documentation (README, API docs)
2. Add tests for new features
3. Ensure all tests pass
4. Request review from maintainers
5. Squash and merge

---

## 📄 License

Proprietary — All rights reserved.

---

## 🙏 Acknowledgments

Built with ❤️ by [Megnito.com](https://megnito.com)

Special thanks to:
- Supabase team for the incredible backend platform
- React Flow team for the visual canvas library
- BullMQ team for the robust queue system
- Stripe team for the billing infrastructure

---

## 📞 Contact

- **Website**: [revflow.app](https://revflow.app)
- **Email**: CEO@MEGNITOO.COM
- **Co-Founder**: [Megnito.com](https://megnito.com)

---

## 🗺️ Roadmap

### Q1 2026
- [ ] Multi-workspace support
- [ ] Advanced scheduling (cron-based triggers)
- [ ] Custom node builder (JavaScript/Python)

### Q2 2026
- [ ] Mobile app (React Native)
- [ ] Slack app integration
- [ ] Advanced reporting (PDF exports)

### Q3 2026
- [ ] AI agent marketplace
- [ ] White-label option
- [ ] On-premise deployment

---

**Built for modern revenue teams. Ship faster. Close more deals.** 🚀
