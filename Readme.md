# CUE — Contextual Web Assistant
### A production-grade Chrome Extension · v2.0

> **AI that understands the page you're reading — not just the internet.**

---

## What is CUE?

CUE is a Chrome extension that injects an intelligent sidebar into any webpage. It reads the page content, retains conversation history per tab, and answers questions with full context — like having a research assistant always open beside you.

---

## Architecture

```
cue-extension/
│
├── manifest.json               # MV3 manifest
├── background.js               # Service worker (tab ID relay, future auth proxy)
├── content.js                  # Orchestrator — wires all modules, zero logic inline
├── content.css                 # Scoped sidebar styles
│
├── src/
│   ├── core/
│   │   ├── config.js           # Single source of truth (API, shortcuts, actions)
│   │   ├── storage.js          # chrome.storage abstraction (per-tab history)
│   │   ├── context.js          # Smart page content extraction
│   │   ├── api.js              # AI API layer (retry, timeout, error taxonomy)
│   │   └── state.js            # Centralized state store (pub/sub pattern)
│   │
│   ├── ui/
│   │   ├── sidebar.js          # Sidebar DOM builder + open/close
│   │   ├── messages.js         # Message bubbles, loading, empty/error states
│   │   ├── shortcuts.js        # Keyboard shortcut registration
│   │   └── message-handler.js  # chrome.runtime message listener
│   │
│   └── utils/
│       ├── dom.js              # Lightweight DOM helpers (el, qs, etc.)
│       └── markdown.js         # Zero-dependency markdown → HTML renderer
│
└── popup/
    ├── popup.html
    ├── popup.css
    └── popup.js                # Standalone popup (communicates via scripting API)
```

---

## Module Responsibilities

| Module | Knows About | Does NOT Know About |
|---|---|---|
| `config.js` | Constants | Everything else |
| `storage.js` | chrome.storage, config | UI, AI |
| `context.js` | DOM, config | AI, UI, storage |
| `api.js` | fetch, config | UI, DOM, storage |
| `state.js` | Nothing | UI, AI, DOM |
| `sidebar.js` | DOM, state, config | AI, storage |
| `messages.js` | DOM, markdown, config | AI, storage |
| `content.js` | Everything (orchestrator) | — |

---

## Features

### Core
- **Multi-turn chat** with full conversation memory (ChatGPT-style)
- **Per-tab session history** — each tab has its own chat, persisted across popup opens
- **Smart content extraction** — ignores nav, footer, ads; focuses on `<main>` / `<article>`
- **Context-aware prompts** — every AI call includes page title, URL, and content

### UI
- Slide-in sidebar (CSS transform, no layout shift)
- User / AI message bubbles with distinct styles
- Typing indicator (3-dot bounce animation)
- Auto-resizing textarea
- Empty state, loading state, error state
- Quick action buttons (Summarize, Key Points, Simplify, Critique)
- Status bar for transient feedback

### Developer
- **Pub/sub state** — UI components react to state changes, no direct coupling
- **Error taxonomy** — `network | auth | rate_limit | timeout | unknown`
- **Timeout + abort** on all API calls (15s default)
- Zero external dependencies

---

## Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Toggle sidebar | `Ctrl+Shift+K` |
| New chat | `Ctrl+Shift+N` |
| Focus input | `/` (when sidebar open) |

---

## Setup

1. Clone or download this repo
2. Open `chrome://extensions` → Enable **Developer mode**
3. Click **Load unpacked** → select the `cue-extension/` folder
4. Add your API key in `src/core/config.js`:
   ```js
   KEY: "YOUR_GEMINI_API_KEY"
   ```
5. Pin the extension → click **CUE** or press `Ctrl+Shift+K` on any page

---

## Security

⚠️ **The API key in `config.js` is readable by anyone who inspects the extension.**

### Production fix (backend proxy):

```
Browser Extension  →  Your Backend  →  Gemini API
                       (stores key)
```

In `background.js`, handle `AI_COMPLETE` messages:
```js
// background.js (future)
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === "AI_COMPLETE") {
    fetch("https://your-api.com/complete", {
      method: "POST",
      body: JSON.stringify(msg.payload),
      headers: { "Authorization": `Bearer ${userToken}` }
    })
    .then(r => r.json())
    .then(sendResponse);
    return true;
  }
});
```

---

## Standout Feature Ideas (Portfolio Differentiators)

### 1. Page Diff Mode
When you revisit a page, CUE detects what changed since your last visit and highlights the diffs. Great for news articles, docs, product pages.

### 2. Reading Mode + TTS
Extract clean article text and read it aloud using the Web Speech API. CUE becomes an ambient reading companion.

### 3. Smart Bookmarks
Let users save AI-generated summaries alongside bookmarks. "Bookmark with context" → stores the page summary, key points, and your questions/answers.

### 4. Cross-tab Research Canvas
Open a floating canvas where CUE aggregates insights from multiple tabs you've visited in a session — like a research assistant that follows you across sites.

### 5. Tone-Aware Answers
Detect the type of page (news, academic paper, product page, tutorial) and automatically adapt response style — bullet points for tutorials, balanced analysis for news, comparisons for product pages.

---

## Upgrade Path

| Priority | Feature | Effort |
|---|---|---|
| High | Backend API proxy (hide key) | 1 day |
| High | Streaming responses (SSE) | 2 days |
| Med | Highlight-to-explain (selection tooltip) | 1 day |
| Med | Page diff detection | 3 days |
| Low | Export chat as Markdown | 2 hours |
| Low | Cross-tab research canvas | 1 week |
| Low | Settings page (model, font size, theme) | 1 day |

---

## Tech Stack

- **Manifest V3** Chrome Extension
- **Vanilla JS** (no framework) — keeps bundle size zero
- **Gemini 2.5 Flash Lite** via Google AI API
- **chrome.storage.local** for persistence
- **CSS custom properties** for theming

---

*Built as a portfolio project demonstrating: modular architecture, clean async patterns, production UI polish, and AI product thinking.*