// src/core/config.js
// ─────────────────────────────────────────────
// Single source of truth for all configuration.
// Never scatter magic strings across files.
// ─────────────────────────────────────────────

const CUE_CONFIG = {

  // ── API ──────────────────────────────────────
  // NOTE: In production, proxy through your own backend
  // to keep the key server-side. See SECURITY.md.
  API: {
    BASE_URL: "https://generativelanguage.googleapis.com/v1beta/models",
    MODEL:    "gemini-2.5-flash-lite",
    KEY:      "YOUR_API_KEY_HERE",   // ← Replace or wire to chrome.storage
    MAX_TOKENS: 1024,
    TIMEOUT_MS: 15_000,
  },

  // ── Context extraction ────────────────────────
  CONTEXT: {
    MAX_PAGE_CHARS:      4_000,   // ~1k tokens
    MAX_HISTORY_TURNS:   12,      // messages kept in prompt
    NOISE_SELECTORS: [
      "nav", "footer", "header", "aside",
      "script", "style", "noscript",
      "[role='banner']", "[role='navigation']",
      ".ads", ".cookie-banner", "#cookie-notice",
    ],
  },

  // ── Storage keys ─────────────────────────────
  STORAGE: {
    HISTORY_PREFIX: "cue_history_",   // + tabId
    SETTINGS:       "cue_settings",
  },

  // ── UI ───────────────────────────────────────
  UI: {
    SIDEBAR_WIDTH: "360px",
    ANIMATION_MS:   200,
    MAX_HISTORY_RENDER: 50,
  },

  // ── Keyboard shortcuts ────────────────────────
  SHORTCUTS: {
    TOGGLE_SIDEBAR: { key: "k", ctrlKey: true, shiftKey: true },
    NEW_CHAT:       { key: "n", ctrlKey: true, shiftKey: true },
    FOCUS_INPUT:    { key: "/", ctrlKey: false, shiftKey: false },
  },

  // ── Quick-action prompt templates ────────────
  ACTIONS: {
    summarize: {
      label:  "Summarize",
      icon:   "◎",
      prompt: "Give a concise summary of this page in 3–5 sentences. Be direct.",
    },
    keypoints: {
      label:  "Key Points",
      icon:   "◈",
      prompt: "Extract the 5 most important points from this page as short, sharp bullets.",
    },
    simplify: {
      label:  "Simplify",
      icon:   "◇",
      prompt: "Explain the main idea of this page as if I'm a curious 16-year-old.",
    },
    critique: {
      label:  "Critique",
      icon:   "◉",
      prompt: "Critically analyze the claims or arguments made on this page. Note weaknesses or unsupported assertions.",
    },
  },
};