// ═══════════════════════════════════════════════
// CUE  —  content.js  v4
// Architecture: inject → wire → render → stream
// Zero deps. No build. Runs as a content script.
// ═══════════════════════════════════════════════

const CUE_KEY = "YOUR_API_KEY"; // ← replace

// ─────────────────────────────────────────────
// 1. INJECT  (idempotent — safe on re-inject)
// ─────────────────────────────────────────────

(function inject() {
  if (document.getElementById("cue-root")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <div id="cue-root">

      <!-- SIDEBAR -->
      <aside id="cue-sidebar" role="complementary" aria-label="CUE assistant">

        <header id="cue-header">
          <div class="cue-brand">
            <div class="cue-wordmark">
              <span class="cue-wordmark-c">C</span><span class="cue-wordmark-ue">UE</span>
            </div>
            <div class="cue-page-pill" id="cue-page-pill">
              <span class="cue-pulse"></span>
              <span id="cue-domain">—</span>
            </div>
          </div>
          <div class="cue-header-actions">
            <button class="cue-icon-btn" id="cue-clear" title="Clear chat  ⌘⇧L">
              <svg viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
            <button class="cue-icon-btn" id="cue-close" title="Close  Esc">
              <svg viewBox="0 0 16 16" fill="none"><path d="M10 3H13V13H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 8h7M7 5l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </header>

        <div id="cue-chat" role="log" aria-live="polite"></div>

        <div id="cue-composer">
          <div id="cue-input-shell">
            <textarea
              id="cue-input"
              rows="1"
              placeholder="Ask anything about this page…"
              autocomplete="off"
              spellcheck="true"
              aria-label="Message"
            ></textarea>
            <button id="cue-send" title="Send  Enter" aria-label="Send">
              <svg viewBox="0 0 16 16" fill="none"><path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <div id="cue-composer-footer">
            <span id="cue-status"></span>
            <span class="cue-hint">↵ send  ⇧↵ newline</span>
          </div>
        </div>

      </aside>

      <!-- FLOATING TRIGGER -->
      <button id="cue-trigger" aria-label="Open CUE assistant">
        <span class="cue-trigger-label">CUE</span>
        <span class="cue-trigger-dot"></span>
      </button>

    </div>
  `);
})();

// ─────────────────────────────────────────────
// 2. REFS
// ─────────────────────────────────────────────

const ROOT    = document.getElementById("cue-root");
const SIDEBAR = document.getElementById("cue-sidebar");
const CHAT    = document.getElementById("cue-chat");
const INPUT   = document.getElementById("cue-input");
const SEND    = document.getElementById("cue-send");
const STATUS  = document.getElementById("cue-status");
const TRIGGER = document.getElementById("cue-trigger");
const DOMAIN  = document.getElementById("cue-domain");

// ─────────────────────────────────────────────
// 3. STATE
// ─────────────────────────────────────────────

const state = {
  open:    false,
  loading: false,
  msgs:    [],            // { role, text, id }
  context: "",            // extracted page text
};

// ─────────────────────────────────────────────
// 4. SIDEBAR  OPEN / CLOSE
// ─────────────────────────────────────────────

function open() {
  state.open = true;
  SIDEBAR.classList.add("is-open");
  TRIGGER.classList.add("is-hidden");
  setTimeout(() => INPUT.focus(), 240);

  // Lazy-extract context on first open
  if (!state.context) {
    state.context = extractContext();
    DOMAIN.textContent = location.hostname.replace(/^www\./, "");
  }
  if (!state.msgs.length) renderEmpty();
}

function close() {
  state.open = false;
  SIDEBAR.classList.remove("is-open");
  TRIGGER.classList.remove("is-hidden");
}

TRIGGER.addEventListener("click", open);
document.getElementById("cue-close").addEventListener("click", close);

document.getElementById("cue-clear").addEventListener("click", () => {
  state.msgs = [];
  CHAT.innerHTML = "";
  renderEmpty();
});

// Esc to close
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && state.open) close();
  // ⌘⇧K  or  Ctrl⇧K  to toggle
  if (e.key === "k" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    state.open ? close() : open();
  }
});

// ─────────────────────────────────────────────
// 5. CONTEXT EXTRACTION
// ─────────────────────────────────────────────

function extractContext() {
  // Remove noise nodes from a clone
  const clone = document.body.cloneNode(true);
  ["script","style","noscript","nav","footer","header","aside","[role='banner']","[role='navigation']"]
    .forEach(sel => clone.querySelectorAll(sel).forEach(el => el.remove()));

  // Prefer semantic content regions
  const main =
    clone.querySelector("main") ||
    clone.querySelector("article") ||
    clone.querySelector("[role='main']") ||
    clone;

  return (main.innerText || main.textContent || "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, 4000);
}

// ─────────────────────────────────────────────
// 6. EMPTY STATE
// ─────────────────────────────────────────────

const QUICK = [
  "Summarize this page",
  "What are the key points?",
  "Explain this simply",
  "What's the main argument?",
];

function renderEmpty() {
  CHAT.innerHTML = `
    <div class="cue-empty">
      <div class="cue-empty-orb">
        <div class="cue-orb-ring"></div>
        <div class="cue-orb-ring cue-orb-ring--2"></div>
        <div class="cue-orb-core">C</div>
      </div>
      <p class="cue-empty-title">Ask me anything</p>
      <p class="cue-empty-sub">I've read this page in full. Try a quick prompt or ask your own.</p>
      <div class="cue-quick-row">
        ${QUICK.map(q => `<button class="cue-quick-btn" data-q="${q}">${q}</button>`).join("")}
      </div>
    </div>
  `;

  CHAT.querySelectorAll(".cue-quick-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      INPUT.value = btn.dataset.q;
      send();
    });
  });
}

// ─────────────────────────────────────────────
// 7. MESSAGE RENDERING
// ─────────────────────────────────────────────

let msgSeq = 0;

function pushMessage(role, html, opts = {}) {
  // Clear empty state on first message
  CHAT.querySelector(".cue-empty")?.remove();

  const id  = `cue-m-${++msgSeq}`;
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const wrap = document.createElement("div");
  wrap.className = `cue-msg cue-msg--${role}`;
  wrap.id = id;

  if (role === "user") {
    wrap.innerHTML = `
      <div class="cue-msg-body">${escapeHTML(html)}</div>
      <div class="cue-msg-meta">${now}</div>
    `;
  } else {
    // AI bubble — rendered markdown + copy button
    wrap.innerHTML = `
      <div class="cue-msg-header">
        <span class="cue-ai-label">CUE</span>
        <button class="cue-copy-btn" title="Copy" aria-label="Copy response">
          <svg viewBox="0 0 14 14" fill="none"><rect x="4" y="1" width="9" height="10" rx="1.5" stroke="currentColor" stroke-width="1.25"/><rect x="1" y="4" width="9" height="10" rx="1.5" fill="var(--cue-bg)" stroke="currentColor" stroke-width="1.25"/></svg>
        </button>
      </div>
      <div class="cue-msg-body">${opts.raw ? escapeHTML(html) : renderMD(html)}</div>
      <div class="cue-msg-meta">${now}</div>
    `;

    // Copy-to-clipboard
    wrap.querySelector(".cue-copy-btn").addEventListener("click", function () {
      const text = wrap.querySelector(".cue-msg-body").innerText;
      navigator.clipboard.writeText(text).then(() => {
        this.classList.add("copied");
        setTimeout(() => this.classList.remove("copied"), 2000);
      });
    });
  }

  if (opts.loading) wrap.classList.add("is-loading");

  state.msgs.push({ id, role, text: html });
  CHAT.appendChild(wrap);
  scrollBottom();
  return { id, el: wrap };
}

function updateMessage(id, newHTML, finalise = false) {
  const el = document.getElementById(id);
  if (!el) return;
  const body = el.querySelector(".cue-msg-body");
  if (!body) return;
  body.innerHTML = renderMD(newHTML);
  if (finalise) {
    el.classList.remove("is-loading");
    el.classList.add("is-done");
  }
  scrollBottom();
}

function markError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("is-loading");
  el.classList.add("is-error");
  const body = el.querySelector(".cue-msg-body");
  if (body) body.textContent = msg;
}

function scrollBottom() {
  requestAnimationFrame(() => { CHAT.scrollTop = CHAT.scrollHeight; });
}

// ─────────────────────────────────────────────
// 8. MARKDOWN  →  HTML
// ─────────────────────────────────────────────

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderMD(raw) {
  if (!raw) return "";

  // Pull out code fences before escaping inline content
  const fences = [];
  let s = raw.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const idx = fences.push({ lang: lang || "", code }) - 1;
    return `\x00FENCE${idx}\x00`;
  });

  // Escape
  s = s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  // Headings
  s = s.replace(/^#{1,2} (.+)$/gm, (_, t) => `<h3 class="cue-h">${t}</h3>`);
  s = s.replace(/^#{3,4} (.+)$/gm, (_, t) => `<h4 class="cue-h">${t}</h4>`);

  // Inline bold / italic / code
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g,     "<em>$1</em>");
  s = s.replace(/`([^`]+)`/g,     "<code>$1</code>");

  // Blockquote
  s = s.replace(/^&gt; (.+)$/gm,  "<blockquote>$1</blockquote>");

  // Unordered list — group consecutive bullet lines
  s = s.replace(/((?:^[-*] .+(?:\n|$))+)/gm, block => {
    const items = block.trim().split("\n")
      .map(l => `<li>${l.replace(/^[-*] /,"").trim()}</li>`).join("");
    return `<ul>${items}</ul>`;
  });

  // Ordered list
  s = s.replace(/((?:^\d+\. .+(?:\n|$))+)/gm, block => {
    const items = block.trim().split("\n")
      .map(l => `<li>${l.replace(/^\d+\. /,"").trim()}</li>`).join("");
    return `<ol>${items}</ol>`;
  });

  // Horizontal rule
  s = s.replace(/^[-*_]{3,}$/gm, "<hr>");

  // Paragraphs
  s = s.split(/\n{2,}/).map(chunk => {
    chunk = chunk.trim();
    if (!chunk) return "";
    if (/^<(h[1-6]|ul|ol|hr|blockquote)/.test(chunk)) return chunk;
    if (chunk.includes("\x00FENCE")) return chunk;  // will be replaced below
    return `<p>${chunk.replace(/\n/g, "<br>")}</p>`;
  }).join("\n");

  // Restore fences
  s = s.replace(/\x00FENCE(\d+)\x00/g, (_, i) => {
    const { lang, code } = fences[+i];
    return `<div class="cue-code-block">${lang ? `<span class="cue-code-lang">${lang}</span>` : ""}<pre><code>${escapeHTML(code).trim()}</code></pre></div>`;
  });

  return s;
}

// ─────────────────────────────────────────────
// 9. INPUT  —  resize + keyboard
// ─────────────────────────────────────────────

INPUT.addEventListener("input", () => {
  INPUT.style.height = "auto";
  INPUT.style.height = Math.min(INPUT.scrollHeight, 130) + "px";
});

INPUT.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
});

SEND.addEventListener("click", send);

// ─────────────────────────────────────────────
// 10. SEND  +  STREAM RENDER
// ─────────────────────────────────────────────

async function send() {
  const text = INPUT.value.trim();
  if (!text || state.loading) return;

  // Clear input
  INPUT.value = "";
  INPUT.style.height = "auto";

  // User bubble
  pushMessage("user", text);

  // Lock UI
  state.loading = true;
  setStatus("thinking…");
  INPUT.disabled = true;
  SEND.disabled  = true;

  // AI placeholder
  const { id: aiId } = pushMessage("ai", "", { loading: true });

  try {
    const fullText = await callAI(buildPrompt(text));

    // Simulate token streaming for visual quality
    // Real streaming: replace with SSE reader on streamGenerateContent endpoint
    await streamRender(aiId, fullText);

    // Update stored message text
    const m = state.msgs.find(m => m.id === aiId);
    if (m) m.text = fullText;

  } catch (err) {
    markError(aiId, `⚠  ${err.message || "Request failed. Check your API key."}`);
  } finally {
    state.loading = false;
    setStatus("");
    INPUT.disabled = false;
    SEND.disabled  = false;
    INPUT.focus();
  }
}

// Render text progressively, word by word, for a streaming feel
async function streamRender(id, fullText) {
  const words = fullText.split(/(\s+)/);
  let built = "";
  const CHUNK = 3; // words per frame

  for (let i = 0; i < words.length; i += CHUNK) {
    built += words.slice(i, i + CHUNK).join("");
    updateMessage(id, built + " ▍");
    await sleep(18);
  }

  // Final render — clean, no cursor
  updateMessage(id, fullText, true);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─────────────────────────────────────────────
// 11. STATUS BAR
// ─────────────────────────────────────────────

function setStatus(msg) {
  STATUS.textContent = msg;
  STATUS.classList.toggle("is-active", !!msg);
}

// ─────────────────────────────────────────────
// 12. PROMPT BUILDER
// ─────────────────────────────────────────────

function buildPrompt(question) {
  return `You are CUE, a sharp AI assistant embedded inside a browser sidebar. The user is currently reading a webpage — you have its full text below.

INSTRUCTIONS:
- Answer concisely and directly. No filler phrases like "Certainly!" or "Great question!".
- Use markdown when it helps: **bold** for key terms, bullet lists, short paragraphs. Avoid long unbroken walls of text.
- If the question isn't about the page, answer from general knowledge and say so briefly.
- Never say you can't browse the internet — you already have the page text.

PAGE TITLE: ${document.title}
PAGE URL: ${location.href}

PAGE CONTENT:
${state.context}

USER QUESTION:
${question}`;
}

// ─────────────────────────────────────────────
// 13. API
// ─────────────────────────────────────────────

async function callAI(prompt) {
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 20_000);

  let res;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${CUE_KEY}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        signal:  controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1200, temperature: 0.7, topP: 0.9 },
        }),
      }
    );
  } catch (e) {
    clearTimeout(timeout);
    throw new Error(e.name === "AbortError" ? "Request timed out." : "Network error.");
  }
  clearTimeout(timeout);

  if (res.status === 429) throw new Error("Rate limited — wait a moment.");
  if (res.status === 401 || res.status === 403) throw new Error("Invalid API key.");
  if (!res.ok) throw new Error(`API error ${res.status}.`);

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from API.");
  return text.trim();
}