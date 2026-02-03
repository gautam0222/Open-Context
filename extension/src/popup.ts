// Popup script for extension UI

document.addEventListener('DOMContentLoaded', () => {
  const captureBtn = document.getElementById('captureBtn');
  const openAppBtn = document.getElementById('openAppBtn');
  const statusEl = document.getElementById('status');
  const pageCountEl = document.getElementById('pageCount');
  const conceptCountEl = document.getElementById('conceptCount');
  const lastSyncEl = document.getElementById('lastSync');

  // Load statistics
  loadStats();

  // Capture current page
  captureBtn?.addEventListener('click', async () => {
    try {
      statusEl!.textContent = 'Capturing...';
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.runtime.sendMessage({
        type: 'CAPTURE_CURRENT_PAGE',
      });
      
      statusEl!.textContent = '✓ Captured successfully!';
      loadStats(); // Refresh stats
      
      setTimeout(() => {
        statusEl!.textContent = 'Ready to capture';
      }, 2000);
    } catch (error) {
      statusEl!.textContent = '✗ Capture failed';
      console.error('Capture error:', error);
    }
  });

  // Open dashboard
  openAppBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });

  // Load and display statistics
  async function loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
      
      if (pageCountEl) {
        pageCountEl.textContent = response.captureCount.toString();
      }
      
      // Concept count and last sync will be implemented later
      if (conceptCountEl) {
        conceptCountEl.textContent = '0';
      }
      
      if (lastSyncEl) {
        lastSyncEl.textContent = 'Never';
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }
});