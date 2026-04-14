// background.js
// ─────────────────────────────────────────────
// Service worker. Minimal now — but the right
// place to add: auth proxying, API key management,
// cross-tab messaging, analytics, and more.
// ─────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // ── Relay current tab ID to content script ────
  // Content scripts can't call chrome.tabs.getCurrent(),
  // so they ask the background.

  if (msg.type === "GET_TAB_ID") {
    sendResponse({ tabId: sender.tab?.id ?? null });
    return true;
  }

  // ── Future: proxy AI calls here to hide API key ──
  // if (msg.type === "AI_COMPLETE") { ... }

});

// Clean up storage when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  const key = `cue_history_${tabId}`;
  chrome.storage.local.remove(key);
});