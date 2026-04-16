// src/core/storage.js — Async chrome.storage wrapper
const CUE_STORAGE = (() => {
  const _get = k => new Promise(r => chrome.storage.local.get(k, d => r(d[k] ?? null)));
  const _set = (k, v) => new Promise(r => chrome.storage.local.set({ [k]: v }, r));
  const _del = k => new Promise(r => chrome.storage.local.remove(k, r));

  const histKey = id => `${CUE.STORAGE.HISTORY}${id}`;
  const dnaKey  = url => `${CUE.STORAGE.DNA_CACHE}${btoa(url).slice(0,40)}`;

  async function getHistory(tabId) {
    return (await _get(histKey(tabId))) ?? [];
  }
  async function saveHistory(tabId, messages) {
    const trimmed = messages.slice(-(CUE.CONTEXT.MAX_HISTORY * 2));
    await _set(histKey(tabId), trimmed);
  }
  async function clearHistory(tabId) { await _del(histKey(tabId)); }

  async function getSettings() {
    return (await _get(CUE.STORAGE.SETTINGS)) ?? { theme:"dark", fontSize:13 };
  }
  async function saveSettings(patch) {
    const cur = await getSettings();
    await _set(CUE.STORAGE.SETTINGS, { ...cur, ...patch });
  }

  async function getDNA(url)      { return await _get(dnaKey(url)); }
  async function saveDNA(url, d)  { await _set(dnaKey(url), { ...d, ts: Date.now() }); }

  return { getHistory, saveHistory, clearHistory, getSettings, saveSettings, getDNA, saveDNA };
})();