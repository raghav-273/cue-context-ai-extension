// background.js — Service worker

// Tab ID relay
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_TAB_ID") {
    sendResponse({ tabId: sender.tab?.id ?? null });
    return true;
  }
  if (msg.type === "OPEN_SIDEBAR") {
    chrome.tabs.sendMessage(sender.tab.id, { type: "OPEN_SIDEBAR" });
  }
});

// Context menu: right-click → ask CUE
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id:       "cue-explain",
    title:    'Ask CUE: "%s"',
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id:       "cue-summarize-page",
    title:    "Summarize this page with CUE",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === "cue-explain" && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      type:   "CONTEXT_ACTION",
      action: "explain",
      text:   info.selectionText,
    });
  }
  if (info.menuItemId === "cue-summarize-page") {
    chrome.tabs.sendMessage(tab.id, {
      type:   "CONTEXT_ACTION",
      action: "summarize",
    });
  }
});

// Clean up history when a tab closes
chrome.tabs.onRemoved.addListener(tabId => {
  chrome.storage.local.remove(`cue_h_${tabId}`);
});