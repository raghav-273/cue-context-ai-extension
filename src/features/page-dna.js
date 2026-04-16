// src/features/page-dna.js — Page DNA: AI-generated topic fingerprint
// This is the standout innovative feature: scans the page and generates
// a visual "DNA" of topics, sentiment, and content type as clickable chips.
const CUE_DNA = (() => {

  const SYSTEM = `You are a content analysis engine. Analyze a webpage and return ONLY a JSON object — no markdown, no explanation.

Return this exact schema:
{
  "type": "one of: article, tutorial, product, news, academic, forum, documentation, landing",
  "sentiment": "one of: positive, negative, neutral, mixed, analytical",
  "topics": ["topic1", "topic2", "topic3"],
  "difficulty": "one of: beginner, intermediate, advanced, expert",
  "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5"],
  "summary_one_line": "max 12 words"
}

Topics and keywords should be specific and useful, not generic. Max 3 topics.`;

  const TYPE_COLOR = {
    article:"#3b82f6", tutorial:"#10b981", product:"#f59e0b",
    news:"#ef4444", academic:"#8b5cf6", forum:"#06b6d4",
    documentation:"#64748b", landing:"#ec4899",
  };
  const SENTIMENT_ICON = {
    positive:"↑", negative:"↓", neutral:"—", mixed:"~", analytical:"∑",
  };

  async function analyze(pageContext) {
    const url    = location.href;
    const cached = await CUE_STORAGE.getDNA(url);
    if (cached && (Date.now() - cached.ts < 3_600_000)) {
      return cached;
    }

    try {
      const msgs = [{ role:"user", content: `Analyze this webpage:\n\n${pageContext.slice(0,3000)}` }];
      const raw  = await CUE_API.complete(msgs, SYSTEM);
      const clean = raw.replace(/```json|```/g, "").trim();
      const dna  = JSON.parse(clean);
      await CUE_STORAGE.saveDNA(url, dna);
      return dna;
    } catch {
      return null;
    }
  }

  function renderDNA(dna) {
    const el = document.getElementById("cue-dna-chips");
    if (!el || !dna) return;

    el.innerHTML = "";

    // Type chip
    const typeChip = CUE_DOM.el("span", {
      class: "cue-dna-chip cue-chip-type",
      style: `--chip-color:${TYPE_COLOR[dna.type] || "#64748b"}`,
      title: `Content type: ${dna.type}`,
    }, dna.type || "page");
    el.appendChild(typeChip);

    // Sentiment chip
    if (dna.sentiment) {
      const sentChip = CUE_DOM.el("span", {
        class: "cue-dna-chip cue-chip-sentiment",
        title: `Sentiment: ${dna.sentiment}`,
      }, `${SENTIMENT_ICON[dna.sentiment] || ""} ${dna.sentiment}`);
      el.appendChild(sentChip);
    }

    // Difficulty chip
    if (dna.difficulty) {
      const diffChip = CUE_DOM.el("span", {
        class: "cue-dna-chip cue-chip-diff",
        "data-level": dna.difficulty,
        title: `Complexity: ${dna.difficulty}`,
      }, dna.difficulty);
      el.appendChild(diffChip);
    }

    // Topic chips — clickable to ask about that topic
    (dna.topics || []).slice(0, 3).forEach(topic => {
      const tc = CUE_DOM.el("button", {
        class: "cue-dna-chip cue-chip-topic",
        title: `Ask about: ${topic}`,
      }, `# ${topic}`);
      tc.addEventListener("click", () => {
        if (!CUE_STATE.get().isOpen) CUE_SIDEBAR.open();
        CUE_BUS.emit(CUE_BUS.E.MSG_USER, `Tell me more about "${topic}" in the context of this page.`);
      });
      el.appendChild(tc);
    });

    // Store one-liner in state for context
    if (dna.summary_one_line) {
      CUE_STATE.set({ dnaReady: true });
      CUE_BUS.emit(CUE_BUS.E.DNA_READY, dna);
    }
  }

  async function init(pageContext) {
    const dna = await analyze(pageContext);
    renderDNA(dna);
    return dna;
  }

  return { init, renderDNA };
})();