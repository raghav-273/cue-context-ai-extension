// src/features/smart-suggest.js — AI-generated follow-up suggestions
const CUE_SUGGEST = (() => {

  const SYSTEM = `You generate exactly 3 short follow-up question suggestions for a chat conversation.
Rules:
- Each suggestion is max 7 words
- They should be intellectually interesting and specific to the conversation
- Return ONLY a JSON array of 3 strings. No markdown. No explanation.
Example: ["What evidence supports this?", "How does this compare historically?", "What are the counterarguments?"]`;

  async function generate(lastAIResponse, pageContext) {
    try {
      const msgs = [{
        role: "user",
        content: `Page context: ${pageContext.slice(0,500)}\n\nLast AI response: ${lastAIResponse.slice(0,600)}\n\nGenerate 3 follow-up questions.`,
      }];
      const raw = await CUE_API.complete(msgs, SYSTEM);
      const clean = raw.replace(/```json|```/g, "").trim();
      return JSON.parse(clean);
    } catch {
      return null;
    }
  }

  function renderSuggestions(suggestions) {
    // Remove old suggestion row
    document.getElementById("cue-ai-suggestions")?.remove();

    const chat = document.getElementById("cue-chat");
    if (!chat || !suggestions?.length) return;

    const row = CUE_DOM.el("div", { id:"cue-ai-suggestions", class:"cue-ai-suggestions" },
      CUE_DOM.el("div", { class:"cue-ai-sug-label" }, "continue with"),
      ...suggestions.map(s => {
        const btn = CUE_DOM.el("button", { class:"cue-ai-sug-btn" }, s);
        btn.addEventListener("click", () => {
          row.remove();
          CUE_BUS.emit(CUE_BUS.E.MSG_USER, s);
        });
        return btn;
      }),
    );

    chat.appendChild(row);
    CUE_DOM.scrollBottom(chat);
  }

  async function afterResponse(aiText) {
    const { pageContext } = CUE_STATE.get();
    const suggestions = await generate(aiText, pageContext);
    if (suggestions) renderSuggestions(suggestions);
  }

  return { afterResponse };
})();