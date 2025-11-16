/**
 * FRW Extension Popup
 */

// UI Elements
const nameInput = document.getElementById('name-input') as HTMLInputElement;
const goButton = document.getElementById('go-button') as HTMLButtonElement;
const clearCacheButton = document.getElementById('clear-cache') as HTMLButtonElement;
const settingsButton = document.getElementById('settings') as HTMLButtonElement;
const cacheCountEl = document.getElementById('cache-count') as HTMLSpanElement;

/**
 * Navigate to FRW name
 */
function navigate() {
  const name = nameInput.value.trim();
  if (!name) return;
  
  const url = name.startsWith('frw://') ? name : `frw://${name}/`;
  chrome.tabs.create({ url });
  window.close();
}

/**
 * Clear cache
 */
function clearCache() {
  chrome.runtime.sendMessage({ type: 'clear-cache' }, (response) => {
    if (response.success) {
      updateStats();
      alert('Cache cleared successfully');
    }
  });
}

/**
 * Update statistics
 */
function updateStats() {
  chrome.runtime.sendMessage({ type: 'get-stats' }, (response) => {
    if (response.success) {
      cacheCountEl.textContent = response.stats.size.toString();
    }
  });
}

/**
 * Open settings
 */
function openSettings() {
  chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
  window.close();
}

// Event listeners
goButton.addEventListener('click', navigate);
nameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') navigate();
});
clearCacheButton.addEventListener('click', clearCache);
settingsButton.addEventListener('click', openSettings);

// Initialize
updateStats();
nameInput.focus();
