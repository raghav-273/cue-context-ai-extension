// ─────────────────────────────────────────────
// CUE  —  backend/server.js
// Minimal Express proxy. Keeps the Gemini API
// key server-side. Extension talks only to this.
// ─────────────────────────────────────────────

import express        from "express";
import cors           from "cors";
import { config }     from "dotenv";
import { rateLimit }  from "express-rate-limit";

config(); // load .env

const {
  GEMINI_API_KEY,
  GEMINI_MODEL = "gemini-2.5-flash-lite",
  PORT         = 3000,
} = process.env;

if (!GEMINI_API_KEY) {
  console.error("[CUE] GEMINI_API_KEY is not set. Check your .env file.");
  process.exit(1);
}

const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

// ── App ──────────────────────────────────────

const app = express();

app.use(express.json({ limit: "64kb" }));

// ── CORS ──────────────────────────────────────
// Chrome extension content scripts send requests with:
//   - Origin: null                  (content script fetches on some pages)
//   - Origin: chrome-extension://ID (popup / background fetches)
//
// The cors() origin callback receives the literal string "null" (not JS null)
// for content script requests, so the !origin guard misses it and the
// request is rejected — producing the "Not allowed by CORS" error.
//
// Fix: reflect the request Origin unconditionally for local dev.
// In production, restrict to your specific extension ID via ALLOWED_ORIGINS.

const CORS_OPTIONS = {
  origin: true,          // reflect any Origin header — correct for local dev
  methods: ["POST", "GET", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: false,
};

app.use(cors(CORS_OPTIONS));

// Explicitly handle OPTIONS preflight for every route
app.options("*", cors(CORS_OPTIONS));

// ── Rate limiter ─────────────────────────────
// 60 requests / minute per IP — adjust as needed

const limiter = rateLimit({
  windowMs:         60 * 1000,
  max:              60,
  standardHeaders:  true,
  legacyHeaders:    false,
  handler: (_req, res) => {
    res.status(429).json({ error: "rate_limit", message: "Too many requests — try again in a minute." });
  },
});

app.use("/api/", limiter);

// ── POST /api/ai ─────────────────────────────
// Body: { messages, systemPrompt, stream? }
// Response (non-stream): { text }
// Response (stream):      SSE  data: { chunk } … data: [DONE]

app.post("/api/ai", async (req, res) => {
  const { messages, systemPrompt, stream = false } = req.body ?? {};

  // Basic input validation
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: "bad_request", message: "messages array is required." });
  }

  if (typeof systemPrompt !== "string" || !systemPrompt.trim()) {
    return res.status(400).json({ error: "bad_request", message: "systemPrompt is required." });
  }

  const body = buildGeminiBody(messages, systemPrompt);

  if (stream) {
    return handleStream(req, res, body);
  }
  return handleComplete(req, res, body);
});

// ── Health check ──────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", model: GEMINI_MODEL, ts: Date.now() });
});

// ── Catch-all 404 ─────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});

// ── Global error handler ──────────────────────

app.use((err, _req, res, _next) => {
  console.error("[CUE] Unhandled error:", err.message);
  res.status(500).json({ error: "server_error", message: "Internal server error." });
});

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function buildGeminiBody(messages, systemPrompt) {
  return {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: messages.map(m => ({
      role:  m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content ?? "") }],
    })),
    generationConfig: {
      maxOutputTokens: 1500,
      temperature:     0.72,
      topP:            0.92,
    },
  };
}

// Non-streaming: fetch from Gemini, return { text }
async function handleComplete(_req, res, body) {
  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  let geminiRes;
  try {
    geminiRes = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
  } catch (err) {
    console.error("[CUE] Gemini fetch error:", err.message);
    return res.status(502).json({ error: "upstream_error", message: "Could not reach Gemini API." });
  }

  if (!geminiRes.ok) {
    const status = geminiRes.status;
    if (status === 429) return res.status(429).json({ error: "rate_limit",    message: "Gemini rate limit reached." });
    if (status === 401) return res.status(502).json({ error: "auth_error",    message: "Gemini rejected the API key." });
    return res.status(502).json({ error: "upstream_error", message: `Gemini error ${status}.` });
  }

  const data  = await geminiRes.json();
  const text  = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    return res.status(502).json({ error: "empty_response", message: "Gemini returned an empty response." });
  }

  res.json({ text: text.trim() });
}

// Streaming: proxy Gemini SSE → client SSE
async function handleStream(_req, res, body) {
  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

  let geminiRes;
  try {
    geminiRes = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
  } catch (err) {
    console.error("[CUE] Gemini stream fetch error:", err.message);
    return res.status(502).json({ error: "upstream_error", message: "Could not reach Gemini API." });
  }

  if (!geminiRes.ok) {
    const status = geminiRes.status;
    if (status === 429) return res.status(429).json({ error: "rate_limit",    message: "Gemini rate limit reached." });
    if (status === 401) return res.status(502).json({ error: "auth_error",    message: "Gemini rejected the API key." });
    return res.status(502).json({ error: "upstream_error", message: `Gemini error ${status}.` });
  }

  // Set SSE headers
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.flushHeaders();

  const reader  = geminiRes.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

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
          const chunk  = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (chunk) {
            // Forward chunk to client as SSE
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
          }
        } catch { /* malformed SSE line — skip */ }
      }
    }
  } catch (err) {
    console.error("[CUE] Stream read error:", err.message);
  } finally {
    res.write("data: [DONE]\n\n");
    res.end();
  }
}

// ── Start ─────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[CUE] Backend running on http://localhost:${PORT}`);
  console.log(`[CUE] Model: ${GEMINI_MODEL}`);
});