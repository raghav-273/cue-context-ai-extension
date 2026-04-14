// src/ui/sidebar.js
// ─────────────────────────────────────────────
// Builds and manages the sidebar DOM.
// Knows nothing about AI — only UI structure.
// ─────────────────────────────────────────────

const CUE_SIDEBAR = (() => {

  let sidebar     = null;
  let chatBox     = null;
  let inputEl     = null;
  let sendBtn     = null;
  let toggleBtn   = null;
  let statusBar   = null;

  // ── Build DOM ─────────────────────────────────

  function buildQuickActions() {
    const wrap = CUE_DOM.el("div", { class: "cue-actions" });

    Object.entries(CUE_CONFIG.ACTIONS).forEach(([id, action]) => {
      const btn = CUE_DOM.el("button", {
        class: "cue-action-btn",
        "data-action": id,
        title: action.label,
      }, action.icon, " ", action.label);
      wrap.appendChild(btn);
    });

    return wrap;
  }

  function buildInputArea() {
    inputEl = CUE_DOM.el("textarea", {
      id:          "cue-input",
      placeholder: "Ask about this page…",
      rows:        "1",
    });

    sendBtn = CUE_DOM.el("button", { id: "cue-send", title: "Send (Enter)" }, "↑");

    // Auto-resize textarea
    inputEl.addEventListener("input", () => {
      inputEl.style.height = "auto";
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
    });

    return CUE_DOM.el("div", { id: "cue-input-area" }, inputEl, sendBtn);
  }

  function buildSidebar() {
    const header = CUE_DOM.el("div", { id: "cue-header" },
      CUE_DOM.el("span", { class: "cue-logo" }, "CUE"),
      CUE_DOM.el("div", { class: "cue-header-actions" },
        CUE_DOM.el("button", { class: "cue-icon-btn", id: "cue-clear", title: "Clear chat (Ctrl+Shift+N)" }, "⊘"),
        CUE_DOM.el("button", { class: "cue-icon-btn", id: "cue-close", title: "Close (Ctrl+Shift+K)" }, "✕"),
      ),
    );

    chatBox   = CUE_DOM.el("div", { id: "cue-chat" });
    statusBar = CUE_DOM.el("div", { id: "cue-status" });

    sidebar = CUE_DOM.el("div", { id: "cue-sidebar" },
      header,
      chatBox,
      statusBar,
      buildQuickActions(),
      buildInputArea(),
    );

    sidebar.dataset.open = "false";
    document.body.appendChild(sidebar);
  }

  function buildToggleButton() {
    toggleBtn = CUE_DOM.el("button", { id: "cue-toggle", title: "Open CUE (Ctrl+Shift+K)" }, "CUE");
    document.body.appendChild(toggleBtn);
  }

  // ── Open / Close ──────────────────────────────

  function open() {
    sidebar.dataset.open = "true";
    toggleBtn.dataset.open = "true";
    CUE_STATE.update({ isOpen: true });
    inputEl.focus();
  }

  function close() {
    sidebar.dataset.open = "false";
    toggleBtn.dataset.open = "false";
    CUE_STATE.update({ isOpen: false });
  }

  function toggle() {
    CUE_STATE.getState().isOpen ? close() : open();
  }

  // ── Status / loading ──────────────────────────

  function setStatus(text, type = "") {
    statusBar.textContent = text;
    statusBar.dataset.type = type;
  }

  function clearStatus() {
    statusBar.textContent = "";
    statusBar.dataset.type = "";
  }

  // ── Init ──────────────────────────────────────

  function init() {
    if (document.getElementById("cue-sidebar")) return;

    buildSidebar();
    buildToggleButton();
  }

  // ── Accessors ─────────────────────────────────

  function getElements() {
    return { sidebar, chatBox, inputEl, sendBtn, toggleBtn, statusBar };
  }

  return { init, open, close, toggle, setStatus, clearStatus, getElements };

})();