const API_BASE = 'http://localhost:3001';

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Load user profile and stats
async function loadProfile() {
  try {
    const response = await fetch(`${API_BASE}/api/profile`);
    const data = await response.json();
    
    if (data.profile) {
      document.getElementById('statDocuments').textContent = data.profile.total_documents || 0;
      document.getElementById('statLevel').textContent = data.profile.level || 1;
      document.getElementById('statStreak').textContent = data.profile.streak_days || 0;
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  }
}

// Load collections
async function loadCollections() {
  const container = document.getElementById('collectionsList');
  
  try {
    const response = await fetch(`${API_BASE}/api/collections`);
    const data = await response.json();
    
    if (data.collections && data.collections.length > 0) {
      container.innerHTML = data.collections
        .slice(0, 5)
        .map(col => `
          <div class="collection-item" data-id="${col.id}">
            <div class="collection-icon" style="background: ${col.color}20">
              ${col.icon}
            </div>
            <div class="collection-name">${col.name}</div>
            <div class="collection-count">${col.stats?.documentCount || 0}</div>
          </div>
        `).join('');
      
      // Add click handlers
      container.querySelectorAll('.collection-item').forEach(item => {
        item.addEventListener('click', () => {
          item.classList.toggle('selected');
        });
      });
    } else {
      container.innerHTML = '<div class="loading">No collections yet</div>';
    }
  } catch (error) {
    console.error('Failed to load collections:', error);
    container.innerHTML = '<div class="loading">Failed to load</div>';
  }
}

// Load recent captures
async function loadRecent() {
  const container = document.getElementById('recentList');
  
  try {
    const response = await fetch(`${API_BASE}/api/captures?limit=5`);
    const data = await response.json();
    
    if (data.documents && data.documents.length > 0) {
      container.innerHTML = data.documents.map(doc => `
        <a href="http://localhost:3000/library/${doc.id}" target="_blank" class="recent-item">
          <div class="recent-title">${doc.title}</div>
          <div class="recent-meta">${new Date(doc.created_at).toLocaleDateString()}</div>
        </a>
      `).join('');
    } else {
      container.innerHTML = '<div class="loading">No captures yet</div>';
    }
  } catch (error) {
    console.error('Failed to load recent:', error);
    container.innerHTML = '<div class="loading">Failed to load</div>';
  }
}

// Capture current page
async function capturePage() {
  const btn = document.getElementById('capturePageBtn');
  const originalText = btn.querySelector('.btn-title').textContent;
  
  btn.querySelector('.btn-title').textContent = 'Capturing...';
  btn.disabled = true;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const response = await fetch(`${API_BASE}/api/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: tab.url,
        title: tab.title,
      }),
    });
    
    if (!response.ok) throw new Error('Capture failed');
    
    // Add to selected collections
    const selectedCollections = document.querySelectorAll('.collection-item.selected');
    const data = await response.json();
    
    for (const col of selectedCollections) {
      await fetch(`${API_BASE}/api/collections/${col.dataset.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: data.document.id }),
      });
    }
    
    showToast('✅ Page captured successfully!', 'success');
    loadProfile();
    loadRecent();
    
  } catch (error) {
    console.error('Capture error:', error);
    showToast('❌ Failed to capture page', 'error');
  } finally {
    btn.querySelector('.btn-title').textContent = originalText;
    btn.disabled = false;
  }
}

// Add to popup.js in the goal creation section
function updateXPPreview() {
  const targetValue = parseInt(document.getElementById('targetValue').value) || 0;
  const difficulty = document.getElementById('difficulty').value;
  
  const multipliers = { easy: 1, medium: 2, hard: 3 };
  const xp = targetValue * (multipliers[difficulty] || 2) * 10;
  
  document.getElementById('xpPreview').textContent = xp;
}

// Add event listeners
document.getElementById('targetValue').addEventListener('input', updateXPPreview);
document.getElementById('difficulty').addEventListener('change', updateXPPreview);
// Capture selected text
async function captureSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString(),
    });
    
    const selectedText = result[0].result;
    
    if (!selectedText) {
      showToast('⚠️ No text selected', 'error');
      return;
    }
    
    const response = await fetch(`${API_BASE}/api/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: tab.url,
        title: `Selection from ${tab.title}`,
        content: selectedText,
      }),
    });
    
    if (!response.ok) throw new Error('Capture failed');
    
    showToast('✅ Selection captured!', 'success');
    loadProfile();
    loadRecent();
    
  } catch (error) {
    console.error('Capture error:', error);
    showToast('❌ Failed to capture', 'error');
  }
}

// Quick note
function quickNote() {
  const note = prompt('Enter your note:');
  if (!note) return;
  
  fetch(`${API_BASE}/api/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'note://',
      title: `Note - ${new Date().toLocaleDateString()}`,
      content: note,
    }),
  })
    .then(() => {
      showToast('✅ Note saved!', 'success');
      loadProfile();
      loadRecent();
    })
    .catch(() => {
      showToast('❌ Failed to save note', 'error');
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  loadCollections();
  loadRecent();
  
  document.getElementById('capturePageBtn').addEventListener('click', capturePage);
  document.getElementById('captureSelectionBtn').addEventListener('click', captureSelection);
  document.getElementById('quickNoteBtn').addEventListener('click', quickNote);
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  document.getElementById('manageCollectionsBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/collections' });
  });
  document.getElementById('feedbackBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/settings' });
  });
});