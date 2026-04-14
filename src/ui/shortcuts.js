// src/ui/shortcuts.js
// ─────────────────────────────────────────────
// Global keyboard shortcut registration.
// Keeps hotkey logic out of content.js.
// ─────────────────────────────────────────────

const CUE_SHORTCUTS = (() => {

  function matches(e, shortcut) {
    return (
      e.key?.toLowerCase() === shortcut.key.toLowerCase() &&
      !!e.ctrlKey  === !!shortcut.ctrlKey &&
      !!e.shiftKey === !!shortcut.shiftKey &&
      !!e.metaKey  === !!shortcut.metaKey
    );
  }

  function init() {
    document.addEventListener("keydown", (e) => {
      const { SHORTCUTS } = CUE_CONFIG;

      // Don't intercept when typing in inputs (except our own)
      const target = e.target;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
        && target.id !== "cue-input";

      if (matches(e, SHORTCUTS.TOGGLE_SIDEBAR)) {
        e.preventDefault();
        CUE_SIDEBAR.toggle();
        return;
      }

      if (matches(e, SHORTCUTS.NEW_CHAT)) {
        e.preventDefault();
        CUE_APP.clearChat();
        return;
      }

      // Focus input only when sidebar is open and not already typing
      if (!isTyping && matches(e, SHORTCUTS.FOCUS_INPUT)) {
        const { isOpen } = CUE_STATE.getState();
        if (isOpen) {
          e.preventDefault();
          document.getElementById("cue-input")?.focus();
        }
      }
    });
  }

  return { init };

})();