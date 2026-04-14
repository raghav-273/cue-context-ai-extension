// src/core/state.js
// ─────────────────────────────────────────────
// Centralized state store with a minimal pub/sub
// system. UI components subscribe to state slices
// instead of reaching into each other.
//
// Pattern: Redux-lite (no library needed).
// ─────────────────────────────────────────────

const CUE_STATE = (() => {

  // ── Initial state ─────────────────────────────

  let state = {
    tabId:       null,
    isOpen:      false,
    isLoading:   false,
    messages:    [],        // { role, content, timestamp }
    pageContext: "",
    mode:        "chat",    // "chat" | "summarize" | "keypoints" | etc.
    error:       null,
  };

  // ── Subscribers ───────────────────────────────

  const listeners = new Map();

  function subscribe(key, fn) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(fn);

    // Return unsubscribe
    return () => listeners.get(key).delete(fn);
  }

  function notify(keys) {
    keys.forEach((key) => {
      if (listeners.has(key)) {
        listeners.get(key).forEach((fn) => fn(state[key], state));
      }
    });
  }

  // ── Updater ───────────────────────────────────

  function update(patch) {
    const changed = Object.keys(patch);
    state = { ...state, ...patch };
    notify(changed);
  }

  // ── Specific actions ──────────────────────────

  function pushMessage(role, content) {
    const msg = { role, content, timestamp: Date.now() };
    update({ messages: [...state.messages, msg] });
    return msg;
  }

  function setLoading(val) {
    update({ isLoading: val, error: val ? null : state.error });
  }

  function setError(msg) {
    update({ error: msg, isLoading: false });
  }

  function clearError() {
    update({ error: null });
  }

  function clearHistory() {
    update({ messages: [] });
  }

  function getState() {
    return { ...state };
  }

  return {
    subscribe,
    update,
    pushMessage,
    setLoading,
    setError,
    clearError,
    clearHistory,
    getState,
  };

})();