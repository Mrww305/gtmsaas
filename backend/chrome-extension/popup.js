// ============================================================
// CHROME EXTENSION: Popup Script
// Purpose: Handle settings UI and display stats
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const signalsSentEl = document.getElementById('signalsSent');
  const signalsQueuedEl = document.getElementById('signalsQueued');
  const enableToggle = document.getElementById('enableToggle');
  const workspaceIdInput = document.getElementById('workspaceId');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const messageEl = document.getElementById('message');

  // Load current config
  chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (config) => {
    workspaceIdInput.value = config.workspaceId || '';
    apiKeyInput.value = config.apiKey || '';
    
    if (config.enabled) {
      enableToggle.classList.add('active');
    }

    updateStatus(config.enabled, config.workspaceId, config.apiKey);
  });

  // Load stats
  chrome.runtime.sendMessage({ type: 'GET_STATS' }, (stats) => {
    signalsSentEl.textContent = stats.signalsSent || 0;
    signalsQueuedEl.textContent = stats.signalsQueued || 0;
  });

  // Toggle enable/disable
  enableToggle.addEventListener('click', () => {
    enableToggle.classList.toggle('active');
    const isEnabled = enableToggle.classList.contains('active');

    chrome.runtime.sendMessage({
      type: 'SAVE_CONFIG',
      config: { enabled: isEnabled }
    }, () => {
      updateStatus(isEnabled, workspaceIdInput.value, apiKeyInput.value);
    });
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    const workspaceId = workspaceIdInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!workspaceId || !apiKey) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    chrome.runtime.sendMessage({
      type: 'SAVE_CONFIG',
      config: { workspaceId, apiKey }
    }, () => {
      showMessage('Settings saved successfully!', 'success');
      updateStatus(enableToggle.classList.contains('active'), workspaceId, apiKey);
    });
  });

  /**
   * Update status display
   */
  function updateStatus(enabled, workspaceId, apiKey) {
    if (!enabled) {
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Disabled';
      statusText.style.color = '#ef4444';
    } else if (!workspaceId || !apiKey) {
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Not configured';
      statusText.style.color = '#f59e0b';
    } else {
      statusDot.className = 'status-dot active';
      statusText.textContent = 'Active';
      statusText.style.color = '#10b981';
    }
  }

  /**
   * Show message
   */
  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.classList.remove('hidden');

    setTimeout(() => {
      messageEl.classList.add('hidden');
    }, 3000);
  }
});
