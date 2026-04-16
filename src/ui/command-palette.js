// src/ui/command-palette.js — Spotlight-style command palette
const CUE_PALETTE = (() => {

  const COMMANDS = [
    { id:"summarize",  label:"Summarize Page",      desc:"Get a concise summary",           icon:"◎", group:"Modes" },
    { id:"keypoints",  label:"Key Points",           desc:"5 most important insights",       icon:"◈", group:"Modes" },
    { id:"critique",   label:"Critique Content",     desc:"Find weaknesses and gaps",        icon:"◉", group:"Modes" },
    { id:"simplify",   label:"Simplify Language",    desc:"Explain like I'm new to this",    icon:"◇", group:"Modes" },
    { id:"outline",    label:"Generate Outline",     desc:"Hierarchical content structure",  icon:"▦", group:"Modes" },
    { id:"questions",  label:"Raise Questions",      desc:"What this page leaves unanswered", icon:"?", group:"Modes" },
    { id:"clear",      label:"Clear Chat",            desc:"Start a fresh conversation",      icon:"↺", group:"Actions" },
    { id:"copy-last",  label:"Copy Last Response",   desc:"Copy AI's last message",          icon:"⊡", group:"Actions" },
    { id:"export",     label:"Export Chat",           desc:"Download conversation as .md",    icon:"↓", group:"Actions" },
    { id:"close",      label:"Close Sidebar",         desc:"Hide CUE panel",                  icon:"✕", group:"Navigation" },
    { id:"focus",      label:"Focus Input",           desc:"Jump to the chat input",          icon:"▸", group:"Navigation" },
  ];

  let _el = null, _input = null, _list = null, _open = false, _selected = 0, _filtered = [];

  function build() {
    if (_el) return;

    _input = CUE_DOM.el("input", {
      class: "cue-pal-input",
      placeholder: "Type a command or ask anything…",
      autocomplete: "off",
    });

    _list = CUE_DOM.el("div", { class:"cue-pal-list" });

    const overlay = CUE_DOM.el("div", { class:"cue-pal-overlay" });
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });

    _el = CUE_DOM.el("div", { class:"cue-palette", id:"cue-palette" },
      overlay,
      CUE_DOM.el("div", { class:"cue-pal-modal" },
        CUE_DOM.el("div", { class:"cue-pal-header" },
          CUE_DOM.el("span", { class:"cue-pal-icon" }, "⌘"),
          _input,
          CUE_DOM.el("kbd", { class:"cue-pal-esc" }, "ESC"),
        ),
        _list,
        CUE_DOM.el("div", { class:"cue-pal-footer" },
          CUE_DOM.el("span", {}, "↑↓ navigate"),
          CUE_DOM.el("span", {}, "↵ select"),
          CUE_DOM.el("span", {}, "esc dismiss"),
        ),
      ),
    );

    document.body.appendChild(_el);

    _input.addEventListener("input",  () => { _selected = 0; render(_input.value); });
    _input.addEventListener("keydown", onKey);
  }

  function render(query = "") {
    const q = query.toLowerCase().trim();
    _filtered = q
      ? COMMANDS.filter(c => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))
      : COMMANDS;

    if (!_filtered.length) {
      // Treat as a free-text prompt
      _filtered = [{
        id: "__prompt__",
        label: `Ask: "${query}"`,
        desc: "Send this as a chat message",
        icon: "▸",
        group: "Chat",
        _prompt: query,
      }];
    }

    let html = "", lastGroup = "";
    _filtered.forEach((cmd, i) => {
      if (cmd.group !== lastGroup) {
        html += `<div class="cue-pal-group">${cmd.group}</div>`;
        lastGroup = cmd.group;
      }
      html += `<div class="cue-pal-item ${i === _selected ? "cue-pal-selected" : ""}" data-idx="${i}">
        <span class="cue-pal-item-icon">${cmd.icon}</span>
        <div class="cue-pal-item-text">
          <span class="cue-pal-item-label">${hl(cmd.label, query)}</span>
          <span class="cue-pal-item-desc">${cmd.desc}</span>
        </div>
      </div>`;
    });

    CUE_DOM.setHTML(_list, html);

    _list.querySelectorAll(".cue-pal-item").forEach(el => {
      el.addEventListener("click",      () => select(+el.dataset.idx));
      el.addEventListener("mousemove",  () => { _selected = +el.dataset.idx; render(_input.value); });
    });
  }

  function hl(text, query) {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return text;
    return text.slice(0,idx) + `<mark>${text.slice(idx, idx+query.length)}</mark>` + text.slice(idx+query.length);
  }

  function select(idx) {
    const cmd = _filtered[idx];
    if (!cmd) return;
    close();

    if (cmd._prompt) { CUE_BUS.emit(CUE_BUS.E.MSG_USER, cmd._prompt); return; }

    switch(cmd.id) {
      case "clear":    CUE_BUS.emit(CUE_BUS.E.CHAT_CLEAR); break;
      case "close":    CUE_SIDEBAR.close(); break;
      case "focus":    document.getElementById("cue-input")?.focus(); break;
      case "copy-last": {
        const msgs = CUE_STATE.get().messages;
        const last = [...msgs].reverse().find(m => m.role === "assistant");
        if (last) navigator.clipboard.writeText(last.content);
        break;
      }
      case "export":   CUE_BUS.emit("chat:export"); break;
      default:
        CUE_BUS.emit(CUE_BUS.E.MSG_USER, CUE.MODES[cmd.id]?.prompt || cmd.label);
    }
  }

  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); _selected = Math.min(_selected+1, _filtered.length-1); render(_input.value); }
    if (e.key === "ArrowUp")   { e.preventDefault(); _selected = Math.max(_selected-1, 0); render(_input.value); }
    if (e.key === "Enter")     { e.preventDefault(); select(_selected); }
    if (e.key === "Escape")    close();
  }

  function open() {
    build();
    _el.dataset.open = "true";
    _input.value = "";
    _selected = 0;
    render("");
    setTimeout(() => _input.focus(), 50);
    _open = true;
  }

  function close() {
    if (_el) _el.dataset.open = "false";
    _open = false;
  }

  return { open, close, toggle: () => _open ? close() : open() };
})();