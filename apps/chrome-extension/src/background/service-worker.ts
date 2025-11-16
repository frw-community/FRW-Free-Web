/**
 * FRW Chrome Extension - Background Service Worker
 * Intercepts frw:// URLs and redirects to viewer page
 */

import { FRWResolver } from '../core/resolver';

const resolver = new FRWResolver();

/**
 * Handle omnibox input (typing "frw <name>")
 */
chrome.omnibox.onInputEntered.addListener((text) => {
  const url = text.startsWith('frw://') ? text : `frw://${text}/`;
  handleFRWUrl(url);
});

/**
 * Handle frw:// URL navigation
 */
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.url.startsWith('frw://')) {
      console.log('[FRW Extension] Intercepted:', details.url);
      handleFRWUrl(details.url);
      return { cancel: true };
    }
    return { cancel: false };
  },
  { urls: ['<all_urls>'] },
  ['blocking']
);

/**
 * Handle tab updates to detect frw:// in address bar
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.startsWith('frw://')) {
    console.log('[FRW Extension] Tab navigation to:', changeInfo.url);
    handleFRWUrl(changeInfo.url, tabId);
  }
});

/**
 * Main handler for frw:// URLs
 */
async function handleFRWUrl(frwUrl: string, tabId?: number) {
  try {
    // Parse URL
    const match = frwUrl.match(/^frw:\/\/([^\/]+)(\/.*)?$/);
    if (!match) {
      showError('Invalid FRW URL format', tabId);
      return;
    }
    
    const [, name, path] = match;
    const viewerUrl = chrome.runtime.getURL(
      `viewer/viewer.html?name=${encodeURIComponent(name)}&path=${encodeURIComponent(path || '/')}`
    );
    
    if (tabId) {
      // Update existing tab
      chrome.tabs.update(tabId, { url: viewerUrl });
    } else {
      // Create new tab
      chrome.tabs.create({ url: viewerUrl });
    }
    
  } catch (error) {
    console.error('[FRW Extension] Error handling URL:', error);
    showError('Failed to load FRW page', tabId);
  }
}

/**
 * Show error page
 */
function showError(message: string, tabId?: number) {
  const errorUrl = chrome.runtime.getURL(
    `viewer/viewer.html?error=${encodeURIComponent(message)}`
  );
  
  if (tabId) {
    chrome.tabs.update(tabId, { url: errorUrl });
  } else {
    chrome.tabs.create({ url: errorUrl });
  }
}

/**
 * Handle messages from popup or viewer
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'resolve-name') {
    resolver.resolveName(request.name)
      .then(record => {
        sendResponse({ success: true, record });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
  
  if (request.type === 'clear-cache') {
    resolver.clearCache();
    sendResponse({ success: true });
    return false;
  }
  
  if (request.type === 'get-stats') {
    const stats = resolver.getCacheStats();
    sendResponse({ success: true, stats });
    return false;
  }
});

console.log('[FRW Extension] Service worker initialized');
