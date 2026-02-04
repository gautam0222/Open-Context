import { CapturedData, generateId } from '@open-context/shared';

// Server configuration
const SERVER_URL = 'http://localhost:3001';
const STORAGE_KEY_PREFIX = 'capture_';

// Statistics storage key
const STATS_KEY = 'open_context_stats';

// Initialize stats on installation
chrome.runtime.onInstalled.addListener(async () => {
  // Create context menu
  chrome.contextMenus.create({
    id: 'add-to-open-context',
    title: 'Add to Open Context',
    contexts: ['page', 'selection'],
  });

  // Initialize stats if not exists
  const stats = await chrome.storage.local.get(STATS_KEY);
  if (!stats[STATS_KEY]) {
    await chrome.storage.local.set({
      [STATS_KEY]: {
        totalCaptures: 0,
        lastCaptureTime: null,
        lastSyncTime: null,
      },
    });
  }

  console.log('✅ Open Context extension installed successfully');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'add-to-open-context' && tab) {
    captureContent(tab, info.selectionText);
  }
});

// Main capture function
async function captureContent(tab: chrome.tabs.Tab, selectedText?: string) {
  try {
    // Validate tab data
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showError(tab.id, 'Cannot capture Chrome internal pages');
      return;
    }

    console.log('📸 Capturing content from:', tab.url);

    // Create captured data object
    const capturedData: CapturedData = {
      url: tab.url,
      title: tab.title || 'Untitled',
      selectedText: selectedText,
      timestamp: Date.now(),
      tabId: tab.id,
    };

    // Generate unique ID
    const captureId = generateId('capture');

    // Store locally first (offline-first approach)
    await chrome.storage.local.set({
      [STORAGE_KEY_PREFIX + captureId]: capturedData,
    });

    console.log('💾 Saved to local storage:', captureId);

    // Update statistics
    await updateStats();

    // Try to send to server
    let serverSuccess = false;
    try {
      const response = await fetch(`${SERVER_URL}/api/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: captureId,
          ...capturedData,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Server response:', result);
        serverSuccess = true;

        // Update last sync time
        const stats = await chrome.storage.local.get(STATS_KEY);
        await chrome.storage.local.set({
          [STATS_KEY]: {
            ...stats[STATS_KEY],
            lastSyncTime: Date.now(),
          },
        });
      } else {
        console.warn('⚠️ Server returned error:', response.status);
      }
    } catch (serverError) {
      console.log('⚠️ Server not reachable, data saved locally only');
    }

    // Show success feedback
    showSuccess(tab.id, serverSuccess);
  } catch (error) {
    console.error('❌ Capture failed:', error);
    showError(tab.id, 'Capture failed');
  }
}

// Update capture statistics
async function updateStats() {
  const stats = await chrome.storage.local.get(STATS_KEY);
  const currentStats = stats[STATS_KEY] || {
    totalCaptures: 0,
    lastCaptureTime: null,
    lastSyncTime: null,
  };

  await chrome.storage.local.set({
    [STATS_KEY]: {
      ...currentStats,
      totalCaptures: currentStats.totalCaptures + 1,
      lastCaptureTime: Date.now(),
    },
  });
}

// Show success feedback
function showSuccess(tabId: number | undefined, syncedToServer: boolean) {
  if (!tabId) return;

  // Set badge
  chrome.action.setBadgeText({ text: '✓', tabId });
  chrome.action.setBadgeBackgroundColor({ color: '#10b981', tabId });

  // Set title
  const title = syncedToServer
    ? 'Saved and synced to server!'
    : 'Saved locally (server offline)';
  chrome.action.setTitle({ title, tabId });

  // Clear badge after 2 seconds
  setTimeout(() => {
    chrome.action.setBadgeText({ text: '', tabId });
    chrome.action.setTitle({ title: 'Open Context', tabId });
  }, 2000);
}

// Show error feedback
function showError(tabId: number | undefined, message: string) {
  if (!tabId) return;

  chrome.action.setBadgeText({ text: '✗', tabId });
  chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId });
  chrome.action.setTitle({ title: message, tabId });

  setTimeout(() => {
    chrome.action.setBadgeText({ text: '', tabId });
    chrome.action.setTitle({ title: 'Open Context', tabId });
  }, 3000);
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Capture current page
  if (message.type === 'CAPTURE_CURRENT_PAGE') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        captureContent(tabs[0], message.selectedText);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    return true; // Keep channel open for async response
  }

  // Get statistics
  if (message.type === 'GET_STATS') {
    chrome.storage.local.get(STATS_KEY, (result) => {
      const stats = result[STATS_KEY] || {
        totalCaptures: 0,
        lastCaptureTime: null,
        lastSyncTime: null,
      };
      sendResponse(stats);
    });
    return true;
  }

  // Get recent captures
  if (message.type === 'GET_RECENT_CAPTURES') {
    chrome.storage.local.get(null, (items) => {
      const captures = Object.entries(items)
        .filter(([key]) => key.startsWith(STORAGE_KEY_PREFIX))
        .map(([key, value]) => ({
          id: key.replace(STORAGE_KEY_PREFIX, ''),
          ...(value as CapturedData),
        }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, message.limit || 10);

      sendResponse({ captures });
    });
    return true;
  }

  // Clear all captures (for testing)
  if (message.type === 'CLEAR_ALL_CAPTURES') {
    chrome.storage.local.get(null, async (items) => {
      const keysToRemove = Object.keys(items).filter((key) =>
        key.startsWith(STORAGE_KEY_PREFIX)
      );
      await chrome.storage.local.remove(keysToRemove);

      // Reset stats
      await chrome.storage.local.set({
        [STATS_KEY]: {
          totalCaptures: 0,
          lastCaptureTime: null,
          lastSyncTime: null,
        },
      });

      sendResponse({ success: true, removed: keysToRemove.length });
    });
    return true;
  }
});

console.log('🧠 Open Context background service worker ready');