// src/ui/shortcuts.js
const CUE_SHORTCUTS = (() => {
  function matches(e, s) {
    return e.key?.toLowerCase() === s.key.toLowerCase()
      && !!e.ctrlKey === !!s.ctrl
      && !!e.shiftKey === !!s.shift;
  }

  function init() {
    document.addEventListener("keydown", e => {
      const inExtension = e.target.closest?.("#cue-sidebar, #cue-palette");
      const isTyping = ["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName) && !inExtension;

      if (matches(e, CUE.SHORTCUTS.TOGGLE))   { e.preventDefault(); CUE_SIDEBAR.toggle(); return; }
      if (matches(e, CUE.SHORTCUTS.NEW_CHAT))  { e.preventDefault(); CUE_BUS.emit(CUE_BUS.E.CHAT_CLEAR); return; }
      if (matches(e, CUE.SHORTCUTS.PALETTE))   { e.preventDefault(); CUE_PALETTE.toggle(); return; }
      if (!isTyping && matches(e, CUE.SHORTCUTS.FOCUS) && CUE_STATE.get().isOpen) {
        e.preventDefault();
        document.getElementById("cue-input")?.focus();
      }
    });
  }
  return { init };
})();