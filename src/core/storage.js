// src/core/storage.js
// ─────────────────────────────────────────────
// Thin, async wrapper around chrome.storage.local.
// All history is keyed per-tab so sessions are isolated.
// ─────────────────────────────────────────────

const CUE_STORAGE = (() => {

  // ── Helpers ───────────────────────────────────

  function historyKey(tabId) {
    return `${CUE_CONFIG.STORAGE.HISTORY_PREFIX}${tabId}`;
  }

  function get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => resolve(result[key] ?? null));
    });
  }

  function set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }

  function remove(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, resolve);
    });
  }


  // ── Public API ────────────────────────────────

  async function getHistory(tabId) {
    const raw = await get(historyKey(tabId));
    return Array.isArray(raw) ? raw : [];
  }

  async function saveHistory(tabId, messages) {
    // Keep only the last N turns to cap storage
    const trimmed = messages.slice(-CUE_CONFIG.CONTEXT.MAX_HISTORY_TURNS * 2);
    await set(historyKey(tabId), trimmed);
  }

  async function clearHistory(tabId) {
    await remove(historyKey(tabId));
  }

  async function getSettings() {
    const raw = await get(CUE_CONFIG.STORAGE.SETTINGS);
    return raw ?? { theme: "dark", fontSize: "md" };
  }

  async function saveSettings(patch) {
    const current = await getSettings();
    await set(CUE_CONFIG.STORAGE.SETTINGS, { ...current, ...patch });
  }

  return { getHistory, saveHistory, clearHistory, getSettings, saveSettings };

})();