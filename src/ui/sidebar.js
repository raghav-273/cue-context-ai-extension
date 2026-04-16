// src/ui/sidebar.js — Sidebar shell builder
const CUE_SIDEBAR = (() => {
  let _built = false;
  let els = {};

  function buildModeBar() {
    const bar = CUE_DOM.el("div", { class:"cue-modebar" });
    Object.entries(CUE.MODES).forEach(([id, m]) => {
      const btn = CUE_DOM.el("button", {
        class: "cue-mode-btn",
        "data-mode": id,
        title: m.label,
        style: `--mode-color:${m.color}`,
      }, CUE_DOM.el("span", { class:"cue-mode-icon" }, m.icon), CUE_DOM.el("span", { class:"cue-mode-label" }, m.label));
      bar.appendChild(btn);
    });
    return bar;
  }

  function buildHeader() {
    const meta = CUE_STATE.get().pageMeta;
    const domain = meta.domain || "this page";

    const header = CUE_DOM.el("div", { id:"cue-header" },
      CUE_DOM.el("div", { class:"cue-header-top" },
        CUE_DOM.el("div", { class:"cue-brand" },
          CUE_DOM.el("div", { class:"cue-logo-mark" }, "C"),
          CUE_DOM.el("div", { class:"cue-brand-text" },
            CUE_DOM.el("span", { class:"cue-logo" }, "CUE"),
            CUE_DOM.el("span", { class:"cue-logo-sub" }, "intelligence layer"),
          ),
        ),
        CUE_DOM.el("div", { class:"cue-header-actions" },
          CUE_DOM.el("button", { class:"cue-icon-btn", id:"cue-btn-palette", title:"Command palette  ⌘⇧P" }, "⌘"),
          CUE_DOM.el("button", { class:"cue-icon-btn", id:"cue-btn-new",     title:"New chat  ⌘⇧L" }, "↺"),
          CUE_DOM.el("button", { class:"cue-icon-btn", id:"cue-btn-close",   title:"Close  ⌘⇧K" }, "✕"),
        ),
      ),
      CUE_DOM.el("div", { class:"cue-page-chip" },
        CUE_DOM.el("span", { class:"cue-chip-dot" }),
        CUE_DOM.el("span", { class:"cue-chip-domain", id:"cue-chip-domain" }, domain),
        CUE_DOM.el("span", { class:"cue-chip-sep" }, "·"),
        CUE_DOM.el("span", { class:"cue-chip-meta", id:"cue-chip-meta" },
          meta.wordCount ? `${meta.wordCount} words · ${meta.readTime}m read` : "loading context…"
        ),
      ),
    );
    return header;
  }

  function buildDNABar() {
    return CUE_DOM.el("div", { id:"cue-dna-bar", class:"cue-dna-bar" },
      CUE_DOM.el("div", { class:"cue-dna-label" }, "Page DNA"),
      CUE_DOM.el("div", { class:"cue-dna-chips", id:"cue-dna-chips" },
        CUE_DOM.el("div", { class:"cue-dna-loading" },
          CUE_DOM.el("span"), CUE_DOM.el("span"), CUE_DOM.el("span"),
        ),
      ),
    );
  }

  function buildChat() {
    const chat = CUE_DOM.el("div", { id:"cue-chat" });
    renderEmpty(chat);
    return chat;
  }

  function renderEmpty(chat) {
    chat.innerHTML = "";
    chat.appendChild(
      CUE_DOM.el("div", { class:"cue-empty" },
        CUE_DOM.el("div", { class:"cue-empty-graphic" },
          CUE_DOM.el("div", { class:"cue-empty-ring cue-ring-1" }),
          CUE_DOM.el("div", { class:"cue-empty-ring cue-ring-2" }),
          CUE_DOM.el("div", { class:"cue-empty-ring cue-ring-3" }),
          CUE_DOM.el("div", { class:"cue-empty-center" }, "C"),
        ),
        CUE_DOM.el("h3", { class:"cue-empty-title" }, "Ready to think"),
        CUE_DOM.el("p",  { class:"cue-empty-sub"   },
          "I have full context of this page. Ask anything, use quick modes, or press ⌘⇧P for commands."
        ),
      )
    );
  }

  function buildSuggestions() {
    const wrap = CUE_DOM.el("div", { id:"cue-suggestions", class:"cue-suggestions" });
    const chips = CUE.SUGGEST_PROMPTS.slice(0, 4);
    chips.forEach(p => {
      const c = CUE_DOM.el("button", { class:"cue-suggest-chip" }, p);
      c.addEventListener("click", () => CUE_BUS.emit(CUE_BUS.E.MSG_USER, p));
      wrap.appendChild(c);
    });
    return wrap;
  }

  function buildInputArea() {
    const input = CUE_DOM.el("textarea", {
      id: "cue-input",
      placeholder: "Ask anything about this page…",
      rows: "1",
      autocomplete: "off",
      spellcheck: "true",
    });

    // Auto-resize
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 140) + "px";
    });

    const sendBtn = CUE_DOM.el("button", { id:"cue-send", title:"Send  Enter" },
      CUE_DOM.el("svg", { viewBox:"0 0 24 24", fill:"none", xmlns:"http://www.w3.org/2000/svg", html:
        '<path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
      }),
    );

    const charCount = CUE_DOM.el("span", { class:"cue-char-count", id:"cue-char-count" }, "");

    input.addEventListener("input", () => {
      const len = input.value.length;
      CUE_DOM.setText(charCount, len > 80 ? `${len}` : "");
    });

    const area = CUE_DOM.el("div", { id:"cue-input-wrap" },
      CUE_DOM.el("div", { class:"cue-input-row" }, input, sendBtn),
      CUE_DOM.el("div", { class:"cue-input-footer" },
        charCount,
        CUE_DOM.el("span", { class:"cue-hint" }, "Enter to send · Shift+Enter for newline"),
      ),
    );

    els.input   = input;
    els.sendBtn = sendBtn;
    return area;
  }

  function buildStatusBar() {
    return CUE_DOM.el("div", { id:"cue-status-bar" },
      CUE_DOM.el("div", { class:"cue-status-left", id:"cue-status-text" }, ""),
      CUE_DOM.el("div", { class:"cue-status-right", id:"cue-stream-indicator" }),
    );
  }

  function build() {
    if (document.getElementById("cue-sidebar")) return;

    const sidebar = CUE_DOM.el("div", { id:"cue-sidebar" });
    sidebar.append(
      buildHeader(),
      buildDNABar(),
      buildModeBar(),
      buildChat(),
      buildSuggestions(),
      buildInputArea(),
      buildStatusBar(),
    );

    const toggle = CUE_DOM.el("button", { id:"cue-toggle-btn", title:"Open CUE  ⌘⇧K" },
      CUE_DOM.el("span", { class:"cue-toggle-icon" }, "C"),
      CUE_DOM.el("span", { class:"cue-toggle-label" }, "CUE"),
    );

    document.body.append(sidebar, toggle);

    els.sidebar  = sidebar;
    els.toggle   = toggle;
    els.chat     = document.getElementById("cue-chat");
    els.dnaChips = document.getElementById("cue-dna-chips");
    els.status   = document.getElementById("cue-status-text");
    els.streamInd = document.getElementById("cue-stream-indicator");
    _built = true;

    return els;
  }

  function open() {
    els.sidebar.dataset.open  = "true";
    els.toggle.dataset.open   = "true";
    CUE_STATE.set({ isOpen: true });
    setTimeout(() => els.input?.focus(), 250);
  }

  function close() {
    els.sidebar.dataset.open  = "false";
    els.toggle.dataset.open   = "false";
    CUE_STATE.set({ isOpen: false });
  }

  function toggle() { CUE_STATE.get().isOpen ? close() : open(); }

  function setStatus(text, type = "") {
    if (!els.status) return;
    els.status.textContent  = text;
    els.status.dataset.type = type;
  }

  function setStreaming(on) {
    if (!els.streamInd) return;
    els.streamInd.innerHTML = on
      ? '<span class="cue-stream-dot"></span><span class="cue-stream-text">generating</span>'
      : "";
  }

  function updateChip(meta) {
    const d = document.getElementById("cue-chip-domain");
    const m = document.getElementById("cue-chip-meta");
    if (d) d.textContent = meta.domain || location.hostname;
    if (m) m.textContent = meta.wordCount
      ? `${meta.wordCount.toLocaleString()} words · ${meta.readTime}m read`
      : "";
  }

  function setMode(modeId) {
    CUE_DOM.qsa(".cue-mode-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.mode === modeId);
    });
  }

  function clearEmpty() {
    const e = CUE_DOM.qs(".cue-empty", els.chat);
    if (e) e.remove();
    const s = document.getElementById("cue-suggestions");
    if (s) s.style.display = "none";
  }

  function resetEmpty() {
    if (!els.chat) return;
    renderEmpty(els.chat);
    const s = document.getElementById("cue-suggestions");
    if (s) s.style.display = "";
  }

  return { build, open, close, toggle, setStatus, setStreaming, updateChip, setMode, clearEmpty, resetEmpty, getEls: () => els };
})();