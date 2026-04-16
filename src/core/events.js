// src/core/events.js — Typed pub/sub event bus
const CUE_BUS = (() => {
  const _h = new Map();

  const on  = (e, fn) => { if (!_h.has(e)) _h.set(e, new Set()); _h.get(e).add(fn); return () => _h.get(e).delete(fn); };
  const off = (e, fn) => _h.get(e)?.delete(fn);
  const emit = (e, d) => _h.get(e)?.forEach(fn => { try { fn(d); } catch(err) { console.warn("[CUE Bus]", e, err); } });
  const once = (e, fn) => { const u = on(e, d => { fn(d); u(); }); return u; };

  // Typed event constants
  const E = {
    SIDEBAR_TOGGLE:   "sidebar:toggle",
    SIDEBAR_OPEN:     "sidebar:open",
    SIDEBAR_CLOSE:    "sidebar:close",
    MSG_USER:         "msg:user",
    MSG_AI_START:     "msg:ai:start",
    MSG_AI_TOKEN:     "msg:ai:token",
    MSG_AI_DONE:      "msg:ai:done",
    MSG_AI_ERROR:     "msg:ai:error",
    CHAT_CLEAR:       "chat:clear",
    MODE_CHANGE:      "mode:change",
    PALETTE_OPEN:     "palette:open",
    PALETTE_CLOSE:    "palette:close",
    SELECTION_FOUND:  "selection:found",
    SELECTION_CLEAR:  "selection:clear",
    DNA_READY:        "dna:ready",
    CONTEXT_LOADED:   "context:loaded",
    TAB_READY:        "tab:ready",
  };

  return { on, off, emit, once, E };
})();