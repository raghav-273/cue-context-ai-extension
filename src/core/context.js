// src/core/context.js
// ─────────────────────────────────────────────
// Smart content extraction. Strips navigation,
// ads, scripts and focuses on the main body text.
// This is the "RAG" layer of the extension.
// ─────────────────────────────────────────────

const CUE_CONTEXT = (() => {

  // ── Clone + strip noise ───────────────────────

  function getCleanDocument() {
    const clone = document.body.cloneNode(true);

    CUE_CONFIG.CONTEXT.NOISE_SELECTORS.forEach((sel) => {
      clone.querySelectorAll(sel).forEach((el) => el.remove());
    });

    return clone;
  }

  // ── Extract text from best candidate element ──

  function extractMainText() {
    // Priority: <main>, <article>, [role=main], then body fallback
    const candidates = [
      document.querySelector("main"),
      document.querySelector("article"),
      document.querySelector("[role='main']"),
    ].filter(Boolean);

    const source = candidates[0] ?? getCleanDocument();
    const raw = source.innerText ?? source.textContent ?? "";

    // Collapse whitespace runs
    return raw
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
      .slice(0, CUE_CONFIG.CONTEXT.MAX_PAGE_CHARS);
  }

  // ── Selected text ─────────────────────────────

  function getSelection() {
    return window.getSelection()?.toString().trim() ?? "";
  }

  // ── Page metadata ─────────────────────────────

  function getMeta() {
    const desc =
      document.querySelector('meta[name="description"]')?.content ??
      document.querySelector('meta[property="og:description"]')?.content ??
      "";

    return {
      title:       document.title,
      url:         location.href,
      description: desc.slice(0, 200),
    };
  }

  // ── Compose final context string ──────────────
  // Passed into every AI prompt. Structured so the
  // model knows exactly what each section is.

  function buildPageContext() {
    const meta = getMeta();
    const text = extractMainText();

    return [
      `PAGE TITLE: ${meta.title}`,
      `URL: ${meta.url}`,
      meta.description ? `DESCRIPTION: ${meta.description}` : "",
      `\nPAGE CONTENT:\n${text}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return { buildPageContext, getSelection, getMeta };

})();