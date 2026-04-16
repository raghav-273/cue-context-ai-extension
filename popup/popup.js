// popup/popup.js
const API_URL = key =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`;

const KEY = "YOUR_API_KEY_HERE";

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

function setStatus(txt, type = "") {
  statusEl.textContent  = txt;
  statusEl.className    = `status ${type}`;
}

function setOutput(html) {
  outputEl.innerHTML = html;
}

async function getPageText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const main = document.querySelector("main,article,[role='main']") || document.body;
      return {
        title: document.title,
        text:  main.innerText.replace(/\n{3,}/g, "\n\n").trim().slice(0, 4000),
      };
    },
  });
  const v = result?.result;
  return v ? `${v.title}\n\n${v.text}` : "Unable to read page content.";
}

async function run(promptText) {
  setStatus("Reading page…", "loading");
  setOutput('<span class="placeholder">Working…</span>');
  askBtn.disabled = true;

  try {
    const context = await getPageText();
    setStatus("Generating…", "loading");

    const body = {
      contents: [{
        parts: [{
          text: `You are CUE, a sharp browser assistant. Be direct and concise. No filler.\n\nPAGE CONTENT:\n${context}\n\nTASK: ${promptText}`,
        }],
      }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
    };

    const res  = await fetch(API_URL(KEY), {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";

    setOutput(text.replace(/\n/g, "<br>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"));
    setStatus("", "");
  } catch(err) {
    setOutput(`<span style="color:#fca5a5">⚠ ${err.message}</span>`);
    setStatus("Error", "error");
  } finally {
    askBtn.disabled = false;
  }
}

// Mode buttons
document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => run(PROMPTS[btn.dataset.action]));
});

// Ask
askBtn.addEventListener("click", () => {
  const q = question.value.trim();
  if (q) run(`Answer this about the page: ${q}`);
});

question.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askBtn.click(); }
});

// Open sidebar
document.getElementById("openSidebarBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { type: "OPEN_SIDEBAR" });
  window.close();
});