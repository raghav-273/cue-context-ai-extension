// src/ui/messages.js
// ─────────────────────────────────────────────
// All message rendering lives here.
// Supports: user bubbles, AI bubbles, streaming
// updates, loading skeleton, empty state.
// ─────────────────────────────────────────────

const CUE_MESSAGES = (() => {

  function getChatBox() {
    return document.getElementById("cue-chat");
  }

  // ── Empty state ───────────────────────────────

  function renderEmpty() {
    const chat = getChatBox();
    chat.innerHTML = "";

    const empty = CUE_DOM.el("div", { class: "cue-empty" },
      CUE_DOM.el("div", { class: "cue-empty-icon" }, "◎"),
      CUE_DOM.el("p",   { class: "cue-empty-title" }, "Ask me anything"),
      CUE_DOM.el("p",   { class: "cue-empty-sub" },
        "I have full context of this page. Use quick actions below or type a question."
      ),
    );

    chat.appendChild(empty);
  }

  // ── Single message bubble ─────────────────────

  function renderMessage(msg) {
    const chat = getChatBox();

    // Remove empty state on first message
    const emptyEl = chat.querySelector(".cue-empty");
    if (emptyEl) emptyEl.remove();

    const bubble = CUE_DOM.el("div", {
      class: `cue-msg cue-msg--${msg.role}`,
      "data-timestamp": msg.timestamp,
    });

    if (msg.role === "assistant") {
      // AI messages: rendered markdown
      const contentEl = CUE_DOM.el("div", { class: "cue-msg-content" });
      CUE_DOM.setHTML(contentEl, CUE_MARKDOWN.render(msg.content));
      bubble.appendChild(contentEl);
    } else {
      // User messages: plain text
      bubble.textContent = msg.content;
    }

    chat.appendChild(bubble);
    CUE_DOM.scrollToBottom(chat);

    return bubble;
  }

  // ── Loading skeleton (while AI is thinking) ───

  function renderLoadingBubble() {
    const chat = getChatBox();

    const bubble = CUE_DOM.el("div", { class: "cue-msg cue-msg--assistant cue-msg--loading" },
      CUE_DOM.el("div", { class: "cue-typing" },
        CUE_DOM.el("span"),
        CUE_DOM.el("span"),
        CUE_DOM.el("span"),
      ),
    );

    chat.appendChild(bubble);
    CUE_DOM.scrollToBottom(chat);

    return bubble;
  }

  // ── Replace loading bubble with real content ──

  function resolveLoadingBubble(bubble, msg) {
    bubble.classList.remove("cue-msg--loading");
    bubble.innerHTML = "";

    const contentEl = CUE_DOM.el("div", { class: "cue-msg-content" });
    CUE_DOM.setHTML(contentEl, CUE_MARKDOWN.render(msg.content));
    bubble.appendChild(contentEl);

    CUE_DOM.scrollToBottom(getChatBox());
  }

  // ── Error bubble ──────────────────────────────

  function renderErrorInBubble(bubble, message) {
    bubble.classList.remove("cue-msg--loading");
    bubble.classList.add("cue-msg--error");
    bubble.innerHTML = "";
    bubble.textContent = `⚠ ${message}`;
    CUE_DOM.scrollToBottom(getChatBox());
  }

  // ── Render full history (on load) ─────────────

  function renderHistory(messages) {
    const chat = getChatBox();
    chat.innerHTML = "";

    if (!messages.length) {
      renderEmpty();
      return;
    }

    // Only show last MAX_HISTORY_RENDER messages
    const slice = messages.slice(-CUE_CONFIG.UI.MAX_HISTORY_RENDER);
    slice.forEach((msg) => renderMessage(msg));
  }

  return {
    renderEmpty,
    renderMessage,
    renderLoadingBubble,
    resolveLoadingBubble,
    renderErrorInBubble,
    renderHistory,
  };

})();