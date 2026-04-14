// src/utils/markdown.js
// ─────────────────────────────────────────────
// Minimal, zero-dependency markdown → HTML
// renderer. Only handles patterns the AI uses.
// No XSS risk: we never render user input as HTML.
// ─────────────────────────────────────────────

const CUE_MARKDOWN = (() => {

  function escape(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderInline(text) {
    return escape(text)
      .replace(/\*\*(.+?)\*\*/g,  "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,      "<em>$1</em>")
      .replace(/`(.+?)`/g,        "<code>$1</code>");
  }

  /**
   * Convert markdown string → safe HTML string.
   * Handles: headings, bullet lists, numbered lists,
   * code blocks, bold, italic, inline code.
   */
  function render(raw) {
    if (!raw) return "";

    const lines  = raw.split("\n");
    const output = [];
    let inList   = false;
    let inCode   = false;
    let codeAcc  = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // ── Code fence ──────────────────────────
      if (line.startsWith("```")) {
        if (inCode) {
          output.push(`<pre><code>${escape(codeAcc.join("\n"))}</code></pre>`);
          codeAcc = [];
          inCode = false;
        } else {
          if (inList) { output.push("</ul>"); inList = false; }
          inCode = true;
        }
        continue;
      }

      if (inCode) { codeAcc.push(line); continue; }

      // ── Heading ──────────────────────────────
      const hMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (hMatch) {
        if (inList) { output.push("</ul>"); inList = false; }
        const level = hMatch[1].length + 2; // h3–h5 (sidebar is small)
        output.push(`<h${level} class="cue-h">${renderInline(hMatch[2])}</h${level}>`);
        continue;
      }

      // ── Bullet list ───────────────────────────
      const bulletMatch = line.match(/^[-*+]\s+(.+)/);
      if (bulletMatch) {
        if (!inList) { output.push("<ul>"); inList = true; }
        output.push(`<li>${renderInline(bulletMatch[1])}</li>`);
        continue;
      }

      // ── Numbered list ─────────────────────────
      const numMatch = line.match(/^\d+\.\s+(.+)/);
      if (numMatch) {
        if (!inList) { output.push("<ul>"); inList = true; }
        output.push(`<li>${renderInline(numMatch[1])}</li>`);
        continue;
      }

      // ── Close list on blank / other line ──────
      if (inList && line.trim() === "") {
        output.push("</ul>");
        inList = false;
      }

      // ── Paragraph ────────────────────────────
      if (line.trim()) {
        output.push(`<p>${renderInline(line)}</p>`);
      }
    }

    if (inList)  output.push("</ul>");
    if (inCode)  output.push(`<pre><code>${escape(codeAcc.join("\n"))}</code></pre>`);

    return output.join("");
  }

  return { render };

})();