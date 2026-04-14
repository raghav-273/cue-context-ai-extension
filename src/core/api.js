// src/core/api.js
// ─────────────────────────────────────────────
// All AI calls live here. Zero UI logic.
// Multi-turn conversation is handled by passing
// the full messages array (OpenAI-style turns).
// ─────────────────────────────────────────────

const CUE_API = (() => {

  const { API } = CUE_CONFIG;

  // ── Error types ───────────────────────────────

  class APIError extends Error {
    constructor(message, code) {
      super(message);
      this.name = "APIError";
      this.code = code; // "network" | "auth" | "rate_limit" | "timeout" | "unknown"
    }
  }

  // ── Fetch with timeout ────────────────────────

  function fetchWithTimeout(url, options, ms = API.TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);

    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timer));
  }

  // ── Build Gemini-format request body ──────────
  // messages: [{ role: "user"|"model", content: string }]

  function buildRequestBody(messages, systemPrompt) {
    // Gemini uses "contents" array with "user"/"model" roles
    // System instructions go into systemInstruction field
    return {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: messages.map((m) => ({
        role:  m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        maxOutputTokens: API.MAX_TOKENS,
        temperature:     0.7,
        topP:            0.9,
      },
    };
  }

  // ── Core fetch ────────────────────────────────

  async function complete(messages, systemPrompt) {
    const url = `${API.BASE_URL}/${API.MODEL}:generateContent?key=${API.KEY}`;

    let res;
    try {
      res = await fetchWithTimeout(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(buildRequestBody(messages, systemPrompt)),
      });
    } catch (err) {
      if (err.name === "AbortError") {
        throw new APIError("Request timed out. Try again.", "timeout");
      }
      throw new APIError("Network error. Check your connection.", "network");
    }

    if (res.status === 401 || res.status === 403) {
      throw new APIError("Invalid API key.", "auth");
    }
    if (res.status === 429) {
      throw new APIError("Rate limit hit. Wait a moment.", "rate_limit");
    }
    if (!res.ok) {
      throw new APIError(`API error ${res.status}.`, "unknown");
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new APIError("Empty response from AI.", "unknown");

    return text.trim();
  }

  return { complete, APIError };

})();