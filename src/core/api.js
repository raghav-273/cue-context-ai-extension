// src/core/api.js — Streaming AI layer
const CUE_API = (() => {

  class APIError extends Error {
    constructor(msg, code) { super(msg); this.name = "APIError"; this.code = code; }
  }

  function buildBody(messages, systemPrompt) {
    return {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map(m => ({
        role:  m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        maxOutputTokens: CUE.API.MAX_TOKENS,
        temperature:     CUE.API.TEMPERATURE,
        topP: 0.92,
      },
    };
  }

  // Non-streaming complete (for background/popup)
  async function complete(messages, systemPrompt) {
    const url = `${CUE.API.BASE}/${CUE.API.MODEL}:generateContent?key=${CUE.API.KEY}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CUE.API.TIMEOUT_MS);

    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(messages, systemPrompt)),
        signal: ctrl.signal,
      });
    } catch(e) {
      clearTimeout(timer);
      if (e.name === "AbortError") throw new APIError("Request timed out.", "timeout");
      throw new APIError("Network error.", "network");
    }
    clearTimeout(timer);

    if (res.status === 401 || res.status === 403) throw new APIError("Invalid API key.", "auth");
    if (res.status === 429) throw new APIError("Rate limited — wait a moment.", "rate_limit");
    if (!res.ok) throw new APIError(`API error ${res.status}.`, "unknown");

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new APIError("Empty AI response.", "empty");
    return text.trim();
  }

  // Streaming complete — calls onToken(chunk) as words arrive, returns full text
  async function stream(messages, systemPrompt, onToken) {
    const url = `${CUE.API.BASE}/${CUE.API.MODEL}:streamGenerateContent?alt=sse&key=${CUE.API.KEY}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CUE.API.TIMEOUT_MS);

    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(messages, systemPrompt)),
        signal: ctrl.signal,
      });
    } catch(e) {
      clearTimeout(timer);
      if (e.name === "AbortError") throw new APIError("Request timed out.", "timeout");
      throw new APIError("Network error. Check your connection.", "network");
    }
    clearTimeout(timer);

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new APIError("Invalid API key.", "auth");
      if (res.status === 429) throw new APIError("Rate limited.", "rate_limit");
      throw new APIError(`API error ${res.status}.`, "unknown");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") continue;
        try {
          const parsed = JSON.parse(raw);
          const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (chunk) {
            full += chunk;
            onToken(chunk, full);
          }
        } catch {}
      }
    }

    if (!full) throw new APIError("Empty AI response.", "empty");
    return full.trim();
  }

  return { complete, stream, APIError };
})();