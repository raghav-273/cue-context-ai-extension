// src/ui/highlight-tooltip.js — Highlight-to-explain tooltip
const CUE_HIGHLIGHT = (() => {
  let _tooltip = null, _timer = null;

  function build() {
    if (_tooltip) return;
    _tooltip = CUE_DOM.el("div", { id:"cue-highlight-tip", class:"cue-highlight-tip" },
      CUE_DOM.el("button", { class:"cue-tip-btn cue-tip-explain", "data-action":"explain" },
        "⊙ Explain"
      ),
      CUE_DOM.el("button", { class:"cue-tip-btn cue-tip-define", "data-action":"define" },
        "◈ Define"
      ),
      CUE_DOM.el("button", { class:"cue-tip-btn cue-tip-ask", "data-action":"ask" },
        "▸ Ask about this"
      ),
    );

    _tooltip.addEventListener("mousedown", e => e.preventDefault()); // Don't deselect

    _tooltip.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const sel = window.getSelection()?.toString().trim();
        if (!sel) return;
        const action = btn.dataset.action;
        let prompt = "";
        if (action === "explain")   prompt = `Explain this in context of the page: "${sel}"`;
        if (action === "define")    prompt = `Define and elaborate on: "${sel}"`;
        if (action === "ask")       prompt = `Tell me more about: "${sel}"`;

        hide();
        if (!CUE_STATE.get().isOpen) CUE_SIDEBAR.open();
        CUE_BUS.emit(CUE_BUS.E.MSG_USER, prompt);
      });
    });

    document.body.appendChild(_tooltip);
  }

  function show(x, y) {
    if (!_tooltip) build();
    _tooltip.style.left = `${Math.min(x, window.innerWidth - 260)}px`;
    _tooltip.style.top  = `${y - 52}px`;
    _tooltip.classList.add("visible");
  }

  function hide() {
    _tooltip?.classList.remove("visible");
  }

  function init() {
    build();

    document.addEventListener("mouseup", e => {
      // Don't trigger inside our own sidebar
      if (e.target.closest("#cue-sidebar, #cue-highlight-tip, #cue-palette")) return;

      clearTimeout(_timer);
      _timer = setTimeout(() => {
        const sel = window.getSelection()?.toString().trim();
        if (sel && sel.length > 5 && sel.length < 800) {
          const range  = window.getSelection().getRangeAt(0);
          const rect   = range.getBoundingClientRect();
          const x      = rect.left + window.scrollX + (rect.width / 2) - 120;
          const y      = rect.top  + window.scrollY;
          show(x, y);
          CUE_STATE.set({ selectionText: sel });
          CUE_BUS.emit(CUE_BUS.E.SELECTION_FOUND, sel);
        } else {
          hide();
          CUE_STATE.set({ selectionText: "" });
          CUE_BUS.emit(CUE_BUS.E.SELECTION_CLEAR);
        }
      }, 200);
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") hide();
    });

    document.addEventListener("scroll", () => hide(), { passive: true });
  }

  return { init, show, hide };
})();