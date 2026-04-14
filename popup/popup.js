// popup/popup.js
// ─────────────────────────────────────────────
// Popup is a lightweight standalone UI.
// It does NOT share modules with content scripts —
// it communicates with them via chrome.tabs.sendMessage.
// ─────────────────────────────────────────────

const CONFIG = {
  API_URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=YOUR_API_KEY_HERE`,

  ACTIONS: {
    summarize: "Give a concise 3–5 sentence summary of this page.",
    keypoints: "List the 5 most important points from this page as sharp, short bullets.",
    simplify:  "Explain the main idea of this page in simple terms for a curious teenager.",
    critique:  "Critically analyze the claims on this page. Note weaknesses or unsupported assertions.",
  },
};


// ── DOM refs ──────────────────────────────────

const outputEl  = document.getElementById("output");
const questionEl = document.getElementById("question");
const statusEl  = document.getElementById("status");
const askBtn    = document.getElementById("askBtn");


// ── UI helpers ────────────────────────────────

function setLoading(on) {
  askBtn.disabled   = on;
  statusEl.textContent = on ? "Thinking…" : "";
  statusEl.className   = on ? "status-text loading" : "status-text";
}

function setOutput(html, isError = false) {
  outputEl.innerHTML  = isError
    ? `<span style="color:#fca5a5">⚠ ${html}</span>`
    : html;
  statusEl.textContent = "";
}


// ── API call ──────────────────────────────────

async function callAI(prompt) {
  const res = await fetch(CONFIG.API_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
    }),
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";
}


// ── Page content fetcher ──────────────────────

async function getPageContext() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  return new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func:   () => {
          const main = document.querySelector("main, article, [role='main']")
            ?? document.body;
          return {
            title: document.title,
            text:  main.innerText.replace(/\n{3,}/g, "\n\n").trim().slice(0, 4000),
          };
        },
      },
      ([result]) => {
        const val = result?.result;
        resolve(val ? `${val.title}\n\n${val.text}` : "Could not read page.");
      }
    );
  });
}


// ── Core action handler ───────────────────────

async function runAction(promptText) {
  try {
    setLoading(true);
    outputEl.innerHTML = `<span class="placeholder">Thinking…</span>`;

    const context = await getPageContext();

    const fullPrompt = `
You are CUE, a concise browser assistant.

PAGE CONTENT:
${context}

TASK:
${promptText}

Rules: Be direct. Use plain text. Short bullets if listing. No markdown symbols like ** or *.
`.trim();

    const result = await callAI(fullPrompt);
    setOutput(result.replace(/\n/g, "<br>"));

  } catch (err) {
    setOutput(err.message, true);
    statusEl.textContent = "Error";
    statusEl.className   = "status-text error";
  } finally {
    setLoading(false);
  }
}


// ── Events ────────────────────────────────────

// Quick action buttons
document.querySelectorAll(".action-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const prompt = CONFIG.ACTIONS[btn.dataset.action];
    if (prompt) runAction(prompt);
  });
});

// Ask button
askBtn.addEventListener("click", () => {
  const q = questionEl.value.trim();
  if (!q) return;
  runAction(`Answer this about the page: ${q}`);
});

// Enter to submit
questionEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    askBtn.click();
  }
});

// Open sidebar
document.getElementById("openSidebar").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { type: "OPEN_SIDEBAR" });
  window.close();
});