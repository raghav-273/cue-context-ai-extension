// src/ui/messages.js — Message bubble rendering + streaming
const CUE_MESSAGES = (() => {

  function getChat() { return document.getElementById("cue-chat"); }

  // ── User bubble ───────────────────────────────

  function renderUser(msg) {
    CUE_SIDEBAR.clearEmpty();
    const chat = getChat();

    const bubble = CUE_DOM.el("div", { class:"cue-msg cue-msg--user", "data-id": msg.id },
      CUE_DOM.el("div", { class:"cue-msg-content" }, msg.content),
      CUE_DOM.el("div", { class:"cue-msg-meta" }, CUE_TIME.fmtExact(msg.ts)),
    );

    chat.appendChild(bubble);
    CUE_DOM.scrollBottom(chat);
    return bubble;
  }

  // ── AI bubble with streaming support ──────────

  function renderAIPlaceholder(msgId) {
    const chat = getChat();

    const contentEl = CUE_DOM.el("div", { class:"cue-msg-content cue-streaming" });
    const typing    = CUE_DOM.el("div", { class:"cue-typing" },
      CUE_DOM.el("span"), CUE_DOM.el("span"), CUE_DOM.el("span"),
    );
    contentEl.appendChild(typing);

    const bubble = CUE_DOM.el("div", { class:"cue-msg cue-msg--ai cue-msg--loading", "data-id": msgId },
      CUE_DOM.el("div", { class:"cue-msg-ai-header" },
        CUE_DOM.el("div", { class:"cue-ai-label" },
          CUE_DOM.el("span", { class:"cue-ai-dot" }),
          "CUE",
        ),
      ),
      contentEl,
    );

    chat.appendChild(bubble);
    CUE_DOM.scrollBottom(chat);
    return { bubble, contentEl };
  }

  // Stream tokens into the content element
  function streamToken(contentEl, fullText) {
    const chat = getChat();
    CUE_DOM.setHTML(contentEl, CUE_MD.render(fullText) + '<span class="cue-cursor">▋</span>');
    CUE_DOM.scrollBottom(chat);
  }

  // Finalize a streaming bubble
  function finalizeAI(bubble, contentEl, msg) {
    bubble.classList.remove("cue-msg--loading");
    contentEl.classList.remove("cue-streaming");

    const words    = msg.content.split(/\s+/).length;
    const copyBtn  = CUE_DOM.el("button", { class:"cue-copy-btn", title:"Copy response" }, "⊡ copy");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(msg.content).then(() => {
        copyBtn.textContent = "✓ copied";
        setTimeout(() => { copyBtn.textContent = "⊡ copy"; }, 1800);
      });
    });

    const meta = CUE_DOM.el("div", { class:"cue-msg-meta" },
      CUE_DOM.el("span", {}, CUE_TIME.fmtExact(msg.ts)),
      CUE_DOM.el("span", { class:"cue-meta-sep" }, "·"),
      CUE_DOM.el("span", {}, `${words} words`),
      copyBtn,
    );

    CUE_DOM.setHTML(contentEl, CUE_MD.render(msg.content));
    bubble.appendChild(meta);

    const chat = getChat();
    CUE_DOM.scrollBottom(chat);
  }

  // ── Error bubble ──────────────────────────────

  function renderError(msgId, errMsg) {
    const chat = getChat();
    const existing = chat.querySelector(`[data-id="${msgId}"]`);

    const errEl = CUE_DOM.el("div", { class:"cue-msg cue-msg--error", "data-id": msgId },
      CUE_DOM.el("div", { class:"cue-error-icon" }, "⚠"),
      CUE_DOM.el("div", { class:"cue-error-text" }, errMsg),
    );

    if (existing) existing.replaceWith(errEl);
    else chat.appendChild(errEl);
    CUE_DOM.scrollBottom(chat);
  }

  // ── System message (mode label, divider) ──────

  function renderSystem(text) {
    const chat = getChat();
    chat.appendChild(
      CUE_DOM.el("div", { class:"cue-msg-system" },
        CUE_DOM.el("span", { class:"cue-sys-line" }),
        CUE_DOM.el("span", { class:"cue-sys-text" }, text),
        CUE_DOM.el("span", { class:"cue-sys-line" }),
      )
    );
  }

  // ── Render full history ───────────────────────

  function renderHistory(messages) {
    const chat = getChat();
    chat.innerHTML = "";

    if (!messages.length) {
      CUE_SIDEBAR.resetEmpty();
      return;
    }

    messages.slice(-CUE.UI.MAX_BUBBLES).forEach(msg => {
      if (msg.role === "user") renderUser(msg);
      else if (msg.role === "assistant") {
        const { bubble, contentEl } = renderAIPlaceholder(msg.id);
        finalizeAI(bubble, contentEl, msg);
      }
    });
  }

  return { renderUser, renderAIPlaceholder, streamToken, finalizeAI, renderError, renderSystem, renderHistory };
})();