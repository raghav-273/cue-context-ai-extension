// popup/popup.js  v4.0.0
// No API key. All AI calls go to the backend proxy.

const BACKEND_URL = "http://localhost:3000/api/ai"; // matches CUE.BACKEND.URL

const PROMPTS = {
  summarize:  "Summarize this page in 3–5 direct sentences. Lead with the core idea.",
  keypoints:  "List exactly 5 key insights from this page as sharp, short bullets. No fluff.",
  critique:   "Critically analyze this page: strongest claim, weakest assumption, missing context.",
  simplify:   "Explain the main idea in plain terms as if explaining to a curious non-expert.",
  outline:    "Generate a clean hierarchical outline of this page's content structure.",
  questions:  "Generate 5 thought-provoking questions this page raises but doesn't fully answer.",
};

const outputEl = document.getElementById("output");
const statusEl = document.getElementById("statusText");
const askBtn   = document.getElementById("askBtn");
const question = document.getElementById("question");

// Show current page domain
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const domain = tab?.url ? new URL(tab.url).hostname.replace(/^www\./, "") : "—";
  document.getElementById("pageDomain").textContent = domain;
});

// ── UI helpers ────────────────────────────────

function setStatus(txt, type = "") {
  statusEl.textContent  = txt;
  statusEl.className    = `status ${type}`;
}

function setOutput(html) {
  outputEl.innerHTML = html;
}

// ── Page content extractor ────────────────────

async function getPageContext() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const main = document.querySelector("main,article,[role='main']") || document.body;
      return {
        title: document.title,
        url:   location.href,
        text:  main.innerText.replace(/\n{3,}/g, "\n\n").trim().slice(0, 4000),
      };
    },
  });
  const v = result?.result;
  return v ? `PAGE: ${v.title}\nURL: ${v.url}\n\nCONTENT:\n${v.text}` : "Could not read page.";
}

// ── Core handler ──────────────────────────────

async function run(promptText) {
  setStatus("Reading page…", "loading");
  setOutput('<span class="placeholder">Working…</span>');
  askBtn.disabled = true;

  try {
    const pageContext = await getPageContext();

    const systemPrompt = `You are CUE, a concise browser assistant. Answer directly. Use markdown when helpful.

${pageContext}`;

    const messages = [{ role: "user", content: promptText }];

    setStatus("Generating…", "loading");

    const res = await fetch(BACKEND_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ messages, systemPrompt, stream: false }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Server error ${res.status}`);
    }

    const { text } = await res.json();

    setOutput(text
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
      .replace(/\n/g,"<br>")
    );
    setStatus("", "");

  } catch (err) {
    setOutput(`<span style="color:#fca5a5">⚠ ${err.message}</span>`);
    setStatus("Error", "error");
  } finally {
    askBtn.disabled = false;
  }
}

// ── Event bindings ────────────────────────────

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => run(PROMPTS[btn.dataset.action]));
});

askBtn.addEventListener("click", () => {
  const q = question.value.trim();
  if (q) run(`Answer this about the page: ${q}`);
});

question.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askBtn.click(); }
});

document.getElementById("openSidebarBtn")?.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { type: "OPEN_SIDEBAR" });
  window.close();
});