// ============================================================
// backend/workers/index.ts
// 
// Entry point for BullMQ workers.
// Run this as a SEPARATE PROCESS from your Next.js app.
// 
// In production, deploy as:
// - A standalone Node.js process (PM2, Docker, Railway, etc.)
// - Or a serverless worker (Inngest, Trigger.dev, etc.)
// 
// Start command: npx tsx backend/workers/index.ts
// ============================================================

import { workflowExecutorWorker } from '../lib/bullmq/workers/workflow-executor';

console.log('🚀 RevFlow Workers Starting...');
console.log('');
console.log('Active Workers:');
console.log('  ✅ Workflow Executor (revflow:workflows)');
console.log('  ✅ Concurrency: 10');
console.log('  ✅ Rate Limit: 100 jobs/sec');
console.log('');

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down workers...`);

  try {
    await workflowExecutorWorker.close();
    console.log('✅ Workflow executor closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Keep the process alive
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception in worker:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection in worker:', reason);
});

console.log('⏳ Workers ready. Waiting for jobs...\n');
