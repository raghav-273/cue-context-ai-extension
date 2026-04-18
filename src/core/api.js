// src/core/api.js — AI transport layer  v4.0.0
// All requests go to the CUE backend proxy.
// The Gemini API key never touches the frontend.
const CUE_API = (() => {

  // ── Error type ────────────────────────────────

  class APIError extends Error {
    constructor(msg, code) {
      super(msg);
      this.name = "APIError";
      this.code = code; // network | timeout | rate_limit | auth | upstream | bad_request | unknown
    }
  }

  // ── Shared fetch with timeout ─────────────────

  function fetchWithTimeout(url, options) {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CUE.BACKEND.TIMEOUT_MS);

    return fetch(url, { ...options, signal: ctrl.signal })
      .finally(() => clearTimeout(timer));
  }

  // ── Error mapper ──────────────────────────────
  // Converts backend JSON error codes to user-facing messages.

  function mapError(status, body) {
    const code = body?.error ?? "unknown";
    const msg  = body?.message;

    if (status === 429 || code === "rate_limit")  throw new APIError(msg ?? "Rate limited — wait a moment.", "rate_limit");
    if (status === 400 || code === "bad_request")  throw new APIError(msg ?? "Bad request.",                  "bad_request");
    if (code === "auth_error")                     throw new APIError("Backend auth error — check server.",   "auth");
    if (code === "upstream_error")                 throw new APIError(msg ?? "Upstream API error.",           "upstream");
    throw new APIError(msg ?? `Server error ${status}.`, "unknown");
  }

  // ── Non-streaming complete ────────────────────
  // Used by popup and any call that doesn't need streaming.
  // Returns: Promise<string>

  async function complete(messages, systemPrompt) {
    let res;
    try {
      res = await fetchWithTimeout(CUE.BACKEND.URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages, systemPrompt, stream: false }),
      });
    } catch (e) {
      if (e.name === "AbortError") throw new APIError("Request timed out.", "timeout");
      throw new APIError("Network error — is the CUE backend running?", "network");
    }

    let body;
    try { body = await res.json(); } catch { body = {}; }

    if (!res.ok) mapError(res.status, body);

    if (!body.text) throw new APIError("Empty response from backend.", "upstream");
    return body.text;
  }

  // ── Streaming complete ────────────────────────
  // Proxied SSE from backend → onToken callback.
  // Returns: Promise<string>  (full accumulated text)

  async function stream(messages, systemPrompt, onToken) {
    let res;
    try {
      res = await fetchWithTimeout(CUE.BACKEND.URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages, systemPrompt, stream: true }),
      });
    } catch (e) {
      if (e.name === "AbortError") throw new APIError("Request timed out.", "timeout");
      throw new APIError("Network error — is the CUE backend running?", "network");
    }

    // Non-2xx before streaming starts — read JSON error body
    if (!res.ok) {
      let body;
      try { body = await res.json(); } catch { body = {}; }
      mapError(res.status, body);
    }

    // Read SSE stream
    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buf  = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop(); // hold incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;

          try {
            const parsed = JSON.parse(raw);
            const chunk  = parsed.chunk ?? "";
            if (chunk) {
              full += chunk;
              onToken(chunk, full);
            }
          } catch { /* malformed SSE line — skip */ }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!full) throw new APIError("Empty response from backend.", "upstream");
    return full.trim();
  }

  return { complete, stream, APIError };
})();