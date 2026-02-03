// Content script runs on every page
// This will be used later for enhanced capture (reading page content)

console.log('Open Context content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_CONTENT') {
    // Extract clean page content
    const pageContent = {
      title: document.title,
      url: window.location.href,
      text: document.body.innerText,
      html: document.body.innerHTML,
      selectedText: window.getSelection()?.toString() || '',
    };
    
    sendResponse(pageContent);
  }
  
  return true;
});

// Add visual feedback when content is captured
function showCaptureAnimation() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(102, 126, 234, 0.1);
    z-index: 999999;
    pointer-events: none;
    animation: fadeOut 0.5s ease-out;
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    overlay.remove();
    style.remove();
  }, 500);
}

// Optional: Listen for keyboard shortcuts (Ctrl+Shift+S to save)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    chrome.runtime.sendMessage({
      type: 'CAPTURE_CURRENT_PAGE',
      selectedText: window.getSelection()?.toString(),
    });
    showCaptureAnimation();
  }
});