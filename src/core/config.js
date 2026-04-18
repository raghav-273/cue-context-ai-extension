// src/core/config.js — Single source of truth
// v4.0.0: No API key here. All AI calls go through the backend.
const CUE = {

  VERSION: "4.0.0",

  // ── Backend ──────────────────────────────────
  // The only URL the extension ever calls.
  // Change to your deployed URL in production.
  BACKEND: {
    URL:        "http://localhost:3000/api/ai",
    TIMEOUT_MS: 25_000,
  },

  // ── Context extraction ────────────────────────
  CONTEXT: {
    MAX_PAGE_CHARS:   5_000,
    MAX_HISTORY:      20,
    NOISE_SELECTORS: [
      "nav","footer","header","aside","script","style","noscript",
      "[role='banner']","[role='navigation']","[role='complementary']",
      ".ad",".ads",".advertisement",".cookie-banner","#cookie-notice",
      ".popup",".modal-overlay","[aria-hidden='true']",
    ],
    READABILITY_SELECTORS: [
      "main","article","[role='main']","#main","#content",
      ".post-content",".article-body",
    ],
  },

  // ── Storage keys ──────────────────────────────
  STORAGE: {
    HISTORY:   "cue_h_",
    SETTINGS:  "cue_settings",
    DNA_CACHE: "cue_dna_",
  },

  // ── UI ───────────────────────────────────────
  UI: {
    WIDTH:        "380px",
    MAX_BUBBLES:  60,
  },

  // ── Keyboard shortcuts ────────────────────────
  SHORTCUTS: {
    TOGGLE:   { key:"k", ctrl:true, shift:true },
    NEW_CHAT: { key:"l", ctrl:true, shift:true },
    PALETTE:  { key:"p", ctrl:true, shift:true },
    FOCUS:    { key:"/", ctrl:false, shift:false },
  },

  // ── Quick-action modes ────────────────────────
  MODES: {
    summarize: {
      label:"Summarize",  icon:"◎", color:"#3b82f6",
      prompt:"Write a crisp, structured summary of this page. Lead with the core thesis, then 3–5 supporting points. Be direct — no filler.",
    },
    keypoints: {
      label:"Key Points", icon:"◈", color:"#8b5cf6",
      prompt:"Extract exactly 5 key insights from this page. Each should be an actionable or memorable takeaway, not just a topic label.",
    },
    critique: {
      label:"Critique",   icon:"◉", color:"#f59e0b",
      prompt:"Critically analyze the content on this page. Identify the strongest claim, the weakest assumption, and any missing context or counter-arguments.",
    },
    simplify: {
      label:"Simplify",   icon:"◇", color:"#10b981",
      prompt:"Explain the main idea of this page in plain language. Imagine explaining it to a smart friend who has no background in this topic.",
    },
    outline: {
      label:"Outline",    icon:"▦", color:"#ec4899",
      prompt:"Generate a hierarchical outline of this page's structure and content. Use nested bullets to show how ideas relate.",
    },
    questions: {
      label:"Questions",  icon:"?", color:"#06b6d4",
      prompt:"Generate 5 thought-provoking questions that this page raises but doesn't fully answer. Make them intellectually interesting.",
    },
  },

  SUGGEST_PROMPTS: [
    "What's the main argument?",
    "What are the key takeaways?",
    "Explain this simply",
    "What's missing from this?",
    "Find any logical gaps",
    "TL;DR",
  ],
};