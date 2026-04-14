// message-handler.js (append to content.js or add as a separate file loaded last)
// Listens for messages from the popup or background.

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "OPEN_SIDEBAR") {
    CUE_SIDEBAR.open();
  }
});