const API_BASE = 'http://localhost:3001';

// Install event - create context menus
chrome.runtime.onInstalled.addListener(() => {
  console.log('✅ Open Context Extension installed!');
  
  // Create context menu items
  chrome.contextMenus.create({
    id: 'capture-page',
    title: 'Save to Open Context',
    contexts: ['page'],
  });

  chrome.contextMenus.create({
    id: 'capture-selection',
    title: 'Save Selection to Open Context',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'capture-link',
    title: 'Save Link to Open Context',
    contexts: ['link'],
  });

  chrome.contextMenus.create({
    id: 'capture-image',
    title: 'Save Image to Open Context',
    contexts: ['image'],
  });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'capture-page':
      capturePage(tab);
      break;
    case 'capture-selection':
      captureSelection(info, tab);
      break;
    case 'capture-link':
      captureLink(info, tab);
      break;
    case 'capture-image':
      captureImage(info, tab);
      break;
  }
});

// Keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'quick-capture') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      capturePage(tab);
    });
  } else if (command === 'capture-selection') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      captureSelectedText(tab);
    });
  }
});

// Capture current page
async function capturePage(tab) {
  try {
    const response = await fetch(`${API_BASE}/api/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: tab.url,
        title: tab.title,
      }),
    });

    if (!response.ok) throw new Error('Capture failed');

    const data = await response.json();

    // Show success notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icon-128.png',
      title: 'Page Captured! 🎉',
      message: `"${tab.title}" saved successfully`,
      priority: 2,
    });

    // Award XP
    await awardXP(10);

  } catch (error) {
    console.error('Capture error:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icon-128.png',
      title: 'Capture Failed',
      message: 'Failed to save page. Please try again.',
      priority: 1,
    });
  }
}

// Capture selected text
async function captureSelection(info, tab) {
  try {
    const response = await fetch(`${API_BASE}/api/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: tab.url,
        title: `Selection from ${tab.title}`,
        content: info.selectionText,
      }),
    });

    if (!response.ok) throw new Error('Capture failed');

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icon-128.png',
      title: 'Selection Captured! ✂️',
      message: 'Selected text saved successfully',
      priority: 2,
    });

    await awardXP(5);

  } catch (error) {
    console.error('Capture error:', error);
  }
}

// Capture link
async function captureLink(info, tab) {
  try {
    const response = await fetch(`${API_BASE}/api/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: info.linkUrl,
        title: `Link from ${tab.title}`,
      }),
    });

    if (!response.ok) throw new Error('Capture failed');

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icon-128.png',
      title: 'Link Captured! 🔗',
      message: 'Link saved successfully',
      priority: 2,
    });

    await awardXP(5);

  } catch (error) {
    console.error('Capture error:', error);
  }
}

// Capture image
async function captureImage(info, tab) {
  try {
    const response = await fetch(`${API_BASE}/api/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: tab.url,
        title: `Image from ${tab.title}`,
        content: `Image: ${info.srcUrl}`,
        metadata: JSON.stringify({ imageUrl: info.srcUrl }),
      }),
    });

    if (!response.ok) throw new Error('Capture failed');

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icon-128.png',
      title: 'Image Captured! 🖼️',
      message: 'Image reference saved',
      priority: 2,
    });

    await awardXP(5);

  } catch (error) {
    console.error('Capture error:', error);
  }
}

// Award XP to user
async function awardXP(amount) {
  try {
    await fetch(`${API_BASE}/api/profile/xp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xp: amount }),
    });
  } catch (error) {
    console.error('Failed to award XP:', error);
  }
}

// Badge management
async function updateBadge() {
  try {
    const response = await fetch(`${API_BASE}/api/notifications?unread=true`);
    const data = await response.json();
    
    const unreadCount = data.notifications?.filter((n) => !n.is_read).length || 0;
    
    if (unreadCount > 0) {
      chrome.action.setBadgeText({ text: unreadCount.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Failed to update badge:', error);
  }
}

// Update badge every minute
setInterval(updateBadge, 60000);
updateBadge();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'capture-page') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      capturePage(tab);
    });
  }
});