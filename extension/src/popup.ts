// Popup script for extension UI

interface Stats {
  totalCaptures: number;
  lastCaptureTime: number | null;
  lastSyncTime: number | null;
}

interface Capture {
  id: string;
  url: string;
  title: string;
  timestamp: number;
}

document.addEventListener('DOMContentLoaded', () => {
  const captureBtn = document.getElementById('captureBtn') as HTMLButtonElement;
  const openAppBtn = document.getElementById('openAppBtn') as HTMLButtonElement;
  const statusEl = document.getElementById('status') as HTMLElement;
  const pageCountEl = document.getElementById('pageCount') as HTMLElement;
  const conceptCountEl = document.getElementById('conceptCount') as HTMLElement;
  const lastSyncEl = document.getElementById('lastSync') as HTMLElement;

  // Load statistics on popup open
  loadStats();

  // Auto-refresh stats every 5 seconds
  setInterval(loadStats, 5000);

  // Capture current page
  captureBtn?.addEventListener('click', async () => {
    try {
      captureBtn.disabled = true;
      statusEl!.textContent = '📸 Capturing...';

      const response = await chrome.runtime.sendMessage({
        type: 'CAPTURE_CURRENT_PAGE',
      });

      if (response.success) {
        statusEl!.textContent = '✅ Captured successfully!';
        statusEl!.style.color = '#10b981';

        // Refresh stats immediately
        setTimeout(() => {
          loadStats();
          statusEl!.textContent = 'Ready to capture';
          statusEl!.style.color = '';
        }, 1500);
      } else {
        statusEl!.textContent = '❌ Capture failed';
        statusEl!.style.color = '#ef4444';
      }
    } catch (error) {
      statusEl!.textContent = '❌ Error occurred';
      statusEl!.style.color = '#ef4444';
      console.error('Capture error:', error);
    } finally {
      captureBtn.disabled = false;
      setTimeout(() => {
        statusEl!.textContent = 'Ready to capture';
        statusEl!.style.color = '';
      }, 3000);
    }
  });

  // Open dashboard
  openAppBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });

  // Load and display statistics
  async function loadStats() {
    try {
      // Get stats from background
      const stats: Stats = await chrome.runtime.sendMessage({ type: 'GET_STATS' });

      // Update page count
      if (pageCountEl) {
        pageCountEl.textContent = stats.totalCaptures.toString();
      }

      // Update last sync time
      if (lastSyncEl) {
        if (stats.lastSyncTime) {
          const syncDate = new Date(stats.lastSyncTime);
          const now = new Date();
          const diffMinutes = Math.floor((now.getTime() - syncDate.getTime()) / 60000);

          if (diffMinutes < 1) {
            lastSyncEl.textContent = 'Just now';
          } else if (diffMinutes < 60) {
            lastSyncEl.textContent = `${diffMinutes}m ago`;
          } else {
            const diffHours = Math.floor(diffMinutes / 60);
            lastSyncEl.textContent = `${diffHours}h ago`;
          }
        } else {
          lastSyncEl.textContent = 'Never';
        }
      }

      // Concept count (will be implemented in Phase 3)
      if (conceptCountEl) {
        conceptCountEl.textContent = '0';
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }
});