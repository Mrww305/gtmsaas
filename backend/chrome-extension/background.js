// ============================================================
// CHROME EXTENSION: Background Service Worker
// Purpose: Manage signal detection, queue signals, send to backend
// ============================================================

const API_BASE = 'https://api.revflow.app'; // Update to your domain

// Signal types we detect
const SIGNAL_TYPES = {
  JOB_CHANGE: 'job_change',
  PROFILE_VIEW: 'profile_view',
  POST_ENGAGEMENT: 'post_engagement',
  CONNECTION: 'connection',
  COMPANY_UPDATE: 'company_update',
};

// Track seen profiles to avoid duplicate signals
let seenProfiles = new Set();
let signalQueue = [];

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[RevFlow] Extension installed');
  
  // Load seen profiles from storage
  chrome.storage.local.get(['seenProfiles', 'signalQueue'], (result) => {
    if (result.seenProfiles) {
      seenProfiles = new Set(result.seenProfiles);
    }
    if (result.signalQueue) {
      signalQueue = result.signalQueue;
    }
  });

  // Set up periodic alarm to flush signal queue
  chrome.alarms.create('flushSignals', { periodInMinutes: 1 });
});

// Handle alarms (periodic queue flush)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'flushSignals') {
    await flushSignalQueue();
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SIGNAL_DETECTED') {
    handleSignal(message.signal);
    sendResponse({ success: true });
  }

  if (message.type === 'GET_STATS') {
    chrome.storage.local.get(['signalsSent', 'signalsQueued'], (result) => {
      sendResponse({
        signalsSent: result.signalsSent || 0,
        signalsQueued: signalQueue.length,
      });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'GET_CONFIG') {
    chrome.storage.local.get(['workspaceId', 'apiKey', 'enabled'], (result) => {
      sendResponse({
        workspaceId: result.workspaceId || '',
        apiKey: result.apiKey || '',
        enabled: result.enabled !== false, // Default to enabled
      });
    });
    return true;
  }

  if (message.type === 'SAVE_CONFIG') {
    chrome.storage.local.set(message.config, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

/**
 * Handle incoming signal from content script
 */
async function handleSignal(signal) {
  console.log('[RevFlow] Signal detected:', signal.type, signal.actor?.name);

  // Deduplicate: skip if we've seen this profile + signal type recently
  const dedupeKey = `${signal.actor?.linkedin_url}-${signal.type}`;
  if (seenProfiles.has(dedupeKey)) {
    console.log('[RevFlow] Duplicate signal, skipping');
    return;
  }

  // Mark as seen (with TTL - remove after 24 hours)
  seenProfiles.add(dedupeKey);
  chrome.storage.local.set({ seenProfiles: Array.from(seenProfiles) });

  // Add to queue
  signalQueue.push({
    ...signal,
    timestamp: new Date().toISOString(),
  });

  // Update stats
  chrome.storage.local.get(['signalsQueued'], (result) => {
    chrome.storage.local.set({
      signalsQueued: (result.signalsQueued || 0) + 1,
    });
  });

  // Try to flush immediately
  await flushSignalQueue();
}

/**
 * Flush signal queue to backend
 */
async function flushSignalQueue() {
  if (signalQueue.length === 0) return;

  const config = await new Promise((resolve) => {
    chrome.storage.local.get(['workspaceId', 'apiKey', 'enabled'], resolve);
  });

  if (!config.enabled) {
    console.log('[RevFlow] Extension disabled, skipping flush');
    return;
  }

  if (!config.workspaceId || !config.apiKey) {
    console.log('[RevFlow] Missing workspace ID or API key, skipping flush');
    return;
  }

  // Send signals in batches of 10
  const batchSize = 10;
  const batch = signalQueue.splice(0, batchSize);

  for (const signal of batch) {
    try {
      const response = await fetch(`${API_BASE}/api/signals/linkedin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          workspace_id: config.workspaceId,
          signal,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[RevFlow] Signal sent successfully:', result);

        // Update stats
        chrome.storage.local.get(['signalsSent'], (result) => {
          chrome.storage.local.set({
            signalsSent: (result.signalsSent || 0) + 1,
            signalsQueued: signalQueue.length,
          });
        });
      } else {
        console.error('[RevFlow] Failed to send signal:', response.status);
        // Re-queue failed signal
        signalQueue.push(signal);
      }
    } catch (error) {
      console.error('[RevFlow] Error sending signal:', error);
      // Re-queue failed signal
      signalQueue.push(signal);
    }
  }

  // Save updated queue
  chrome.storage.local.set({ signalQueue });
}

// Clean up old seen profiles every hour (keep last 24 hours)
setInterval(() => {
  // Simple cleanup: clear the set every 24 hours
  // In production, use timestamps for more granular control
  seenProfiles.clear();
  chrome.storage.local.set({ seenProfiles: [] });
}, 24 * 60 * 60 * 1000);
