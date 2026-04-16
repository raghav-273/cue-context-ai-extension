# CUE — Contextual Intelligence Layer
### Chrome Extension · v3.0 · Production-Grade

> **An AI assistant that reads every page you visit and thinks alongside you.**

---

## Overview

CUE is a Chrome extension that injects a persistent AI sidebar into every webpage. It extracts and understands the page content, maintains per-tab conversation history, and responds with full context — streaming responses word by word, with zero latency perception.

Built to demonstrate FAANG-level frontend + systems + AI product thinking.

---

## Feature Set

### Core Intelligence
| Feature | Description |
|---|---|
| **Multi-turn streaming chat** | ChatGPT-style conversation with word-by-word token streaming |
| **Smart content extraction** | Scores page elements by readability — prioritises `<main>`, `<article>`, removes noise |
| **Per-tab session memory** | Each tab has its own persistent chat history via `chrome.storage.local` |
| **6 Quick Modes** | Summarize · Key Points · Critique · Simplify · Outline · Questions |

### Innovative Features
| Feature | Description |
|---|---|
| **Page DNA** | AI-generated fingerprint: content type, sentiment, difficulty, topic chips — all clickable |
| **Smart Follow-ups** | After each AI response, generates 3 contextual follow-up question suggestions |
| **Highlight-to-Explain** | Select any text on the page → tooltip with Explain / Define / Ask actions |
| **Command Palette** | `⌘⇧P` opens Spotlight-style palette with fuzzy search across all commands and free-text |
| **Context Menu Integration** | Right-click any selection → "Ask CUE" without opening the extension |
| **Export Chat** | Download full conversation as formatted `.md` file |

### UI/UX
| Feature | Description |
|---|---|
| **Refined dark luxury aesthetic** | Deep navy palette, DM Sans + DM Mono typography, geometric precision |
| **CSS slide animation** | Hardware-accelerated `transform`, no layout shifts |
| **Typing indicator** | 3-dot bounce with staggered timing |
| **Streaming cursor** | Live `▋` cursor while AI generates |
| **Auto-resize textarea** | Input grows with content, capped at 140px |
| **Keyboard shortcuts** | Full keyboard control, `prefers-reduced-motion` respected |

---

## Architecture

```
cue-extension/
│
├── manifest.json                 # MV3, contextMenus, storage, scripting
├── background.js                 # Tab ID relay, context menus, tab cleanup
├── content.js                    # Orchestrator — zero business logic
├── content.css                   # Scoped sidebar styles (4KB gzipped)
│
├── src/
│   ├── core/
│   │   ├── config.js             # Single source of truth — all constants
│   │   ├── events.js             # Typed pub/sub event bus
│   │   ├── state.js              # Immutable state store
│   │   ├── storage.js            # chrome.storage.local abstraction
│   │   ├── api.js                # Streaming Gemini API (SSE), error taxonomy
│   │   └── context.js            # Smart page extraction with readability scoring
│   │
│   ├── ui/
│   │   ├── sidebar.js            # Sidebar DOM builder, open/close, chip updates
│   │   ├── messages.js           # Bubble rendering, streaming, copy button
│   │   ├── command-palette.js    # Spotlight-style palette with fuzzy search
│   │   ├── highlight-tooltip.js  # Selection → Explain/Define/Ask tooltip
│   │   └── shortcuts.js          # Keyboard shortcut registry
│   │
│   ├── features/
│   │   ├── page-dna.js           # AI page fingerprint: type + sentiment + topics
│   │   └── smart-suggest.js      # AI-generated follow-up question suggestions
│   │
│   └── utils/
│       ├── dom.js                # Declarative element builder + helpers
│       ├── markdown.js           # Zero-dep MD → HTML renderer
│       └── time.js               # Timestamp formatting
│
└── popup/
    ├── popup.html
    ├── popup.css
    └── popup.js
```

### Module Contracts

Each module has exactly one responsibility and cannot import from its siblings:

```
config  →  (no deps)
events  →  (no deps)
state   →  (no deps)
storage →  config
context →  config
api     →  config
dom     →  (no deps)
markdown→  (no deps)
time    →  (no deps)
sidebar →  config, state, dom, events
messages→  config, state, dom, markdown, time, sidebar
palette →  config, state, dom, events
tooltip →  state, dom, events, sidebar
dna     →  config, storage, api, dom
suggest →  config, state, api, dom
content →  ALL (orchestrator only)
```

---

## Setup

1. Clone or download this repo
2. Open `chrome://extensions` → Enable **Developer mode**
3. Click **Load unpacked** → select the `cue-extension/` folder
4. Add your API key in `src/core/config.js`:
   ```js
   KEY: "YOUR_API_KEY"
   ```
5. For the popup to work, you have to Add your API key in popup/popup.js
6. Pin the extension → click **CUE** or press `Ctrl+Shift+K` on any page

---

## Security (current issue):

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+K` | Toggle sidebar |
| `Ctrl+Shift+L` | Clear chat |
| `Ctrl+Shift+P` | Open command palette |
| `/` | Focus input (when sidebar open) |
| `Enter` | Send message |
| `Shift+Enter` | Newline in input |

### Production fix (backend proxy): 

```
Extension → Your Backend (auth + key storage) → Gemini API
```

Implement in `background.js` as a message handler:
```js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "AI_STREAM") {
    // Validate user session, then proxy to Gemini
    proxyToGemini(msg.payload).then(sendResponse);
    return true;
  }
});
```

---

## Standout Feature Ideas :

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

## Upgrade Path (Open Contribution)/ (Will do in future)

| Priority | Feature | Effort |
|---|---|---|
| 🔴 High | Backend API proxy (hide key, add auth) | 1 day |
| 🔴 High | User settings panel (model, font, shortcuts) | 1 day |
| 🟡 Med | Page Diff Mode (detect changes on revisit) | 3 days |
| 🟡 Med | Multi-tab research canvas | 1 week |
| 🟡 Med | Reading Mode + Web Speech API TTS | 2 days |
| 🟢 Low | Chat search / filtering | 1 day |
| 🟢 Low | Pinned notes per domain | 2 days |
| 🟢 Low | Light theme | 4 hours |

---

## Standout Features

- **Manifest V3** Chrome Extension
- **Vanilla JS** (no framework) — keeps bundle size zero
- **Gemini 2.5 Flash Lite** via Google AI API (for testing) `Can use better/paid models`
- **chrome.storage.local** for persistence
- **CSS custom properties** for theming

---

*Built by Raghav Mishra*
