# CUE — Contextual Intelligence Layer
### Chrome Extension + Backend · v4.0.0 · Production-Grade

> **An AI assistant that reads every page you visit and thinks alongside you — with the API key where it belongs: on the server.**

---

## What's new in v4.0.1

| Change | Detail |
|---|---|
| **Secure backend proxy** | All Gemini calls now go through a Node.js/Express server. The API key never touches the browser. |
| **Key removed from all frontend files** | `content.js`, `src/core/config.js`, and `popup/popup.js` no longer contain or reference any API key. |
| **SSE streaming proxied server-side** | The backend forwards Gemini's SSE stream chunk-by-chunk to the extension. |
| **Typed error responses** | Backend returns structured `{ error, message }` JSON — frontend maps them to user-facing messages consistently. |
| **Rate limiting** | 60 req/min per IP via `express-rate-limit`. Configurable in `server.js`. |
| **`manifest.json` updated** | `host_permissions` now points to `http://localhost:3000/*` instead of `generativelanguage.googleapis.com`. |

---

## Architecture

```
┌─────────────────────────────────────┐
│         Chrome Extension            │
│                                     │
│  content.js  ──┐                    │
│  popup.js    ──┼──▶  POST           │
│  api.js      ──┘  /api/ai           │
│                    localhost:3000   │
└─────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────┐
│         backend/server.js           │
│         Node.js + Express           │
│                                     │
│  • Validates request shape          │
│  • Rate limits (60 req/min/IP)      │
│  • Reads GEMINI_API_KEY from .env   │
│  • Calls Gemini API                 │
│  • Proxies SSE stream or JSON       │
│  • Maps errors to typed codes       │
└─────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────┐
│         Google Gemini API           │
│  gemini-2.5-flash-lite              │
│  (key never leaves the server)      │
└─────────────────────────────────────┘
```

### Request shape (extension → backend)

```json
POST /api/ai
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "What is the main argument?" }
  ],
  "systemPrompt": "You are CUE...",
  "stream": false
}
```

### Response shape (backend → extension)

**Non-streaming:**
```json
{ "text": "The article argues that..." }
```

**Streaming (SSE):**
```
data: {"chunk":"The article"}
data: {"chunk":" argues that"}
data: [DONE]
```

### Error shape
```json
{ "error": "rate_limit", "message": "Too many requests — try again in a minute." }
```

Error codes: `rate_limit` · `bad_request` · `auth_error` · `upstream_error` · `empty_response` · `server_error`

---

## File structure

```
cue/
│
├── backend/                      ← NEW in v4.0.0
│   ├── server.js                 # Express proxy — holds API key
│   ├── package.json              # express, cors, dotenv, express-rate-limit
│   ├── .env.example              # template — copy to .env, never commit
│   └── .gitignore                # excludes .env and node_modules
│
├── manifest.json                 # MV3 — host_permissions: localhost:3000
├── background.js                 # Tab ID relay, context menus, tab cleanup
├── content.js                    # Orchestrator — BACKEND_URL only, no key
├── content.css                   # Scoped sidebar styles
│
├── src/
│   ├── core/
│   │   ├── config.js             # BACKEND.URL replaces API.KEY
│   │   ├── events.js             # Typed pub/sub event bus
│   │   ├── state.js              # Immutable state store
│   │   ├── storage.js            # chrome.storage.local abstraction
│   │   ├── api.js                # Calls backend only — zero Gemini references
│   │   └── context.js            # Smart page extraction
│   │
│   ├── ui/
│   │   ├── sidebar.js
│   │   ├── messages.js
│   │   ├── command-palette.js
│   │   ├── highlight-tooltip.js
│   │   └── shortcuts.js
│   │
│   ├── features/
│   │   ├── page-dna.js
│   │   └── smart-suggest.js
│   │
│   └── utils/
│       ├── dom.js
│       ├── markdown.js
│       └── time.js
│
└── popup/
    ├── popup.html
    ├── popup.css
    └── popup.js                  # Calls BACKEND_URL — no key
```

### Module contracts (unchanged from v3)

```
config   →  (no deps)
events   →  (no deps)
state    →  (no deps)
storage  →  config
context  →  config
api      →  config              ← now reads BACKEND.URL, not API.KEY
dom      →  (no deps)
markdown →  (no deps)
time     →  (no deps)
sidebar  →  config, state, dom, events
messages →  config, state, dom, markdown, time, sidebar
palette  →  config, state, dom, events
tooltip  →  state, dom, events, sidebar
dna      →  config, storage, api, dom
suggest  →  config, state, api, dom
content  →  ALL (orchestrator only)
```

---

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env — add your GEMINI_API_KEY
npm start
# → [CUE] Backend running on http://localhost:3000
```

### 2. Extension

```bash
# chrome://extensions
# → Enable Developer mode
# → Load unpacked → select the root cue/ folder (not backend/)
# → Pin the extension
# → Press Ctrl+Shift+K on any page
```

> **The extension and backend must both be running.**
> Backend first, then open any page with the extension active.

### 3. Production deployment

When deploying the backend (e.g. Railway, Render, Fly.io):

```bash
# 1. Set environment variables on your host:
GEMINI_API_KEY=your_key_here
ALLOWED_ORIGIN=chrome-extension://YOUR_EXTENSION_ID

# 2. Update the extension to point at your deployed URL:
# In content.js:
const BACKEND_URL = "https://your-backend.railway.app/api/ai";

# In src/core/config.js:
BACKEND: { URL: "https://your-backend.railway.app/api/ai", ... }

# In popup/popup.js:
const BACKEND_URL = "https://your-backend.railway.app/api/ai";

# 3. Update manifest.json host_permissions:
"host_permissions": ["https://your-backend.railway.app/*"]
```

---

## Backend API reference

### `POST /api/ai`

| Field | Type | Required | Description |
|---|---|---|---|
| `messages` | `Array<{role, content}>` | ✓ | Conversation history. `role`: `"user"` or `"assistant"` |
| `systemPrompt` | `string` | ✓ | System instruction for the model |
| `stream` | `boolean` | — | `true` for SSE streaming, `false` (default) for JSON |

### `GET /health`

Returns `{ status: "ok", model, ts }`. Use for uptime monitoring.

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+K` | Toggle sidebar |
| `Ctrl+Shift+L` | Clear chat |
| `Ctrl+Shift+P` | Open command palette |
| `/` | Focus input (sidebar open) |
| `Enter` | Send message |
| `Shift+Enter` | Newline in input |

---

## Feature set

### Core intelligence
| Feature | Description |
|---|---|
| **Multi-turn streaming chat** | Word-by-word token streaming proxied through the backend |
| **Smart content extraction** | Scores elements by readability, targets `<main>` / `<article>`, strips noise |
| **Per-tab session memory** | Persistent history per tab via `chrome.storage.local` |
| **6 Quick Modes** | Summarize · Key Points · Critique · Simplify · Outline · Questions |

### Innovative features
| Feature | Description |
|---|---|
| **Page DNA** | AI-generated content fingerprint: type, sentiment, difficulty, topic chips |
| **Smart Follow-ups** | After each response, generates 3 contextual follow-up questions |
| **Highlight-to-Explain** | Select any text → Explain / Define / Ask tooltip |
| **Command Palette** | `⌘⇧P` — Spotlight-style palette with fuzzy search |
| **Context Menu** | Right-click any selection → "Ask CUE" |
| **Export Chat** | Download conversation as formatted `.md` |

---

## Security model

| Layer | Mechanism |
|---|---|
| **Key storage** | `.env` on the server — never in source control, never in the browser |
| **CORS** | Restricted to `chrome-extension://` origins. Blocks web pages from calling your backend. |
| **Rate limiting** | 60 req/min/IP via `express-rate-limit`. Prevents abuse if the backend URL leaks. |
| **Input validation** | `messages` array and `systemPrompt` are validated before forwarding to Gemini. |
| **No key in responses** | The API key is only used in the Gemini `fetch` call server-side. It never appears in any response body or header. |
| **`manifest.json`** | `host_permissions` lists only your backend URL — not `generativelanguage.googleapis.com`. The extension has no direct path to Gemini. |

### What the extension can and cannot do

```
CAN:   POST to localhost:3000/api/ai
CANNOT: reach generativelanguage.googleapis.com (not in host_permissions)
CANNOT: read the API key (it's in server .env, never sent to the client)
```

---

## future Upgrades (roadmap) / open-souce 

| Priority | Feature | Status |
|---|---|---|
| ✅ Done | Backend API proxy | v4.0.0 |
| 🔴 High | Auth layer (user sessions, JWT) | Next |
| 🔴 High | Deploy backend to production (Railway / Fly.io) | Next |
| 🟡 Med | User settings panel (model, shortcuts, font) | Planned |
| 🟡 Med | Page Diff Mode — detect changes on revisit | Planned |
| 🟡 Med | Reading Mode + Web Speech API TTS | Planned |
| 🟢 Low | Chat search / filtering | Backlog |
| 🟢 Low | Light theme | Backlog |
| 🟢 Low | Pinned notes per domain | Backlog |

---

## Standout features

1. **Secure backend proxy** — not a toy. The key is server-side, CORS-locked, rate-limited. Demonstrates production security thinking.

2. **Page DNA** — AI generates a live content fingerprint (type, sentiment, difficulty, clickable topic chips) on every page load, cached per URL.

3. **Real SSE streaming proxied end-to-end** — Gemini SSE → backend → extension → word-by-word render with live cursor. Most tutorials skip the proxy layer.

4. **Command Palette** — `⌘⇧P` opens a Spotlight-class palette with fuzzy search across commands and free-text prompts.

5. **Typed error taxonomy** — every failure path (network, timeout, rate limit, auth, upstream, empty) surfaces a specific code and message. No "something went wrong".

---

*Zero frontend dependencies. Zero build step. Node 18+. Ships as-is.*
