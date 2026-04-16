// src/core/context.js — Intelligent page content extraction
const CUE_CONTEXT = (() => {

  function stripNoise(root) {
    const clone = root.cloneNode(true);
    CUE.CONTEXT.NOISE_SELECTORS.forEach(s => {
      try { clone.querySelectorAll(s).forEach(el => el.remove()); } catch {}
    });
    return clone;
  }

  // Score candidate elements by content richness
  function scoreElement(el) {
    const text  = el.innerText || el.textContent || "";
    const words = text.trim().split(/\s+/).length;
    const links = el.querySelectorAll("a").length;
    const paras = el.querySelectorAll("p").length;
    // More paragraphs, fewer links relative to words = better content
    return (words * 1.0) + (paras * 10) - (links * 2);
  }

  function findMainContent() {
    // Try semantic selectors first
    for (const sel of CUE.CONTEXT.READABILITY_SELECTORS) {
      const el = document.querySelector(sel);
      if (el && (el.innerText || "").trim().length > 200) return el;
    }

    // Score all large block elements and pick the best
    const candidates = [...document.querySelectorAll("div, section, article")].filter(el => {
      const t = (el.innerText || "").trim();
      return t.length > 300 && t.length < 50_000;
    });

    if (!candidates.length) return document.body;

    return candidates.reduce((best, el) => scoreElement(el) > scoreElement(best) ? el : best);
  }

  function getMainText() {
    const el = findMainContent();
    const clone = stripNoise(el);
    return (clone.innerText || clone.textContent || "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
      .slice(0, CUE.CONTEXT.MAX_PAGE_CHARS);
  }

  function getMeta() {
    const url    = location.href;
    const domain = location.hostname.replace(/^www\./, "");
    const title  = document.title;
    const desc   = document.querySelector('meta[name="description"]')?.content
                || document.querySelector('meta[property="og:description"]')?.content
                || "";
    const author = document.querySelector('meta[name="author"]')?.content
                || document.querySelector('[rel="author"]')?.textContent
                || "";
    const text   = getMainText();
    const words  = text.split(/\s+/).length;
    const readTime = Math.ceil(words / 200); // avg reading speed

    return { url, domain, title, desc: desc.slice(0, 200), author, wordCount: words, readTime };
  }

  function getSelection() {
    return window.getSelection()?.toString().trim() ?? "";
  }

  function buildContext() {
    const meta = getMeta();
    const text = getMainText();
    return {
      prompt: [
        `PAGE: ${meta.title}`,
        `URL: ${meta.url}`,
        meta.desc   ? `DESCRIPTION: ${meta.desc}` : "",
        meta.author ? `AUTHOR: ${meta.author}` : "",
        `WORD COUNT: ~${meta.wordCount} words (${meta.readTime} min read)`,
        `\nCONTENT:\n${text}`,
      ].filter(Boolean).join("\n"),
      meta,
    };
  }

  return { buildContext, getSelection, getMeta, getMainText };
})();