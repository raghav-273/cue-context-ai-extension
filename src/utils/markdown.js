// src/utils/markdown.js — Markdown → HTML renderer (zero deps)
const CUE_MD = (() => {
  const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  function inline(t) {
    return esc(t)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,     "<em>$1</em>")
      .replace(/`(.+?)`/g,       "<code>$1</code>")
      .replace(/~~(.+?)~~/g,     "<del>$1</del>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  function render(raw) {
    if (!raw) return "";
    const lines = raw.split("\n");
    let out = [], inList = false, inOl = false, inCode = false, codeAcc = [], codeLang = "";

    const closeList = () => {
      if (inList)  { out.push("</ul>"); inList = false; }
      if (inOl)    { out.push("</ol>"); inOl = false; }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code fence
      if (line.startsWith("```")) {
        if (inCode) {
          out.push(`<pre class="cue-code" data-lang="${codeLang}"><code>${esc(codeAcc.join("\n"))}</code></pre>`);
          codeAcc = []; inCode = false; codeLang = "";
        } else {
          closeList();
          codeLang = line.slice(3).trim();
          inCode = true;
        }
        continue;
      }
      if (inCode) { codeAcc.push(line); continue; }

      // Headings
      const hm = line.match(/^(#{1,4})\s+(.+)/);
      if (hm) { closeList(); out.push(`<p class="cue-h cue-h${hm[1].length}">${inline(hm[2])}</p>`); continue; }

      // Horizontal rule
      if (/^[-*_]{3,}$/.test(line.trim())) { closeList(); out.push('<hr class="cue-hr"/>'); continue; }

      // Blockquote
      if (line.startsWith("> ")) { closeList(); out.push(`<blockquote class="cue-bq">${inline(line.slice(2))}</blockquote>`); continue; }

      // Unordered list
      const ulm = line.match(/^[-*+]\s+(.+)/);
      if (ulm) {
        if (inOl) { out.push("</ol>"); inOl = false; }
        if (!inList) { out.push("<ul>"); inList = true; }
        out.push(`<li>${inline(ulm[1])}</li>`);
        continue;
      }

      // Ordered list
      const olm = line.match(/^\d+\.\s+(.+)/);
      if (olm) {
        if (inList) { out.push("</ul>"); inList = false; }
        if (!inOl) { out.push("<ol>"); inOl = true; }
        out.push(`<li>${inline(olm[1])}</li>`);
        continue;
      }

      // Close lists on blank / non-list lines
      if (line.trim() === "") { closeList(); continue; }

      // Paragraph
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }

    closeList();
    if (inCode) out.push(`<pre class="cue-code"><code>${esc(codeAcc.join("\n"))}</code></pre>`);

    return out.join("");
  }

  return { render };
})();