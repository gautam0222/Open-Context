import { CapturedData, generateId } from '@open-context/shared';

// Server connection (will be implemented in Phase 1)
const SERVER_URL = 'http://localhost:3001';

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'add-to-open-context',
    title: 'Add to Open Context',
    contexts: ['page', 'selection'],
  });

  console.log('Open Context extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'add-to-open-context' && tab) {
    captureContent(tab, info.selectionText);
  }
});

// Capture page content
async function captureContent(tab: chrome.tabs.Tab, selectedText?: string) {
  try {
    const capturedData: CapturedData = {
      url: tab.url || '',
      title: tab.title || 'Untitled',
      selectedText: selectedText,
      timestamp: Date.now(),
      tabId: tab.id,
    };

    // Store in local storage
    const storageKey = generateId('capture');
    await chrome.storage.local.set({
      [storageKey]: capturedData,
    });

    // Try to send to server (will fail gracefully if server not running)
    try {
      await fetch(`${SERVER_URL}/api/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(capturedData),
      });
    } catch (serverError) {
      console.log('Server not reachable, data saved locally');
    }

    // Show success notification
    chrome.action.setBadgeText({ text: '✓', tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981', tabId: tab.id });

    setTimeout(() => {
      chrome.action.setBadgeText({ text: '', tabId: tab.id });
    }, 2000);

    console.log('Content captured:', capturedData);
  } catch (error) {
    console.error('Failed to capture content:', error);
  }
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_CURRENT_PAGE') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        captureContent(tabs[0], message.selectedText);
        sendResponse({ success: true });
      }
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'GET_STATS') {
    chrome.storage.local.get(null, (items) => {
      const captureCount = Object.keys(items).filter((key) =>
        key.startsWith('capture_')
      ).length;
      sendResponse({ captureCount });
    });
    return true;
  }
});

console.log('Open Context background service worker loaded');