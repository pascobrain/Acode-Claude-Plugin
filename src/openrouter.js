import { OPENROUTER_SLUGS } from "./constants.js";

const BASE = "https://openrouter.ai/api/v1";

/** Map a canonical model id to its OpenRouter slug. */
function slugFor(model) {
  return (
    OPENROUTER_SLUGS[model] ||
    `anthropic/${model.replace(/-(\d+)-(\d+)$/, "-$1.$2")}`
  );
}

function headers(key) {
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    // Optional attribution headers recommended by OpenRouter.
    "HTTP-Referer": "https://acode.app",
    "X-Title": "Acode Claude Plugin",
  };
}

function buildBody({ model, maxTokens, system, messages, thinking, stream }) {
  const msgs = [];
  if (system) msgs.push({ role: "system", content: system });
  for (const m of messages) msgs.push({ role: m.role, content: m.content });
  const body = {
    model: slugFor(model),
    messages: msgs,
    max_tokens: Number(maxTokens) || 8192,
    stream: !!stream,
  };
  if (thinking) body.reasoning = { effort: "medium" };
  return body;
}

async function orError(res) {
  let detail = "";
  try {
    const j = await res.json();
    detail = j?.error?.message || j?.message || "";
  } catch {
    /* ignore */
  }
  if (res.status === 401)
    return new Error("OpenRouter session expired. Reconnect with “Claude: Connect”.");
  if (res.status === 402)
    return new Error("OpenRouter: not enough credits. Add credits at openrouter.ai.");
  if (res.status === 429)
    return new Error("OpenRouter rate limit reached — please retry shortly.");
  return new Error(`OpenRouter error ${res.status}${detail ? ": " + detail : ""}`);
}

/**
 * Stream a chat completion from OpenRouter (OpenAI-compatible SSE).
 * Returns `{ abort, done }`; `done` resolves to `{ text, usage, model }`.
 */
export function streamChat(key, options, callbacks = {}) {
  const controller = new AbortController();

  const done = (async () => {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: headers(key),
      body: JSON.stringify(buildBody({ ...options, stream: true })),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) throw await orError(res);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    let usage = null;
    let model = null;

    for (;;) {
      const { done: streamDone, value } = await reader.read();
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line || line.startsWith(":")) continue; // keepalive comments
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;

        let json;
        try {
          json = JSON.parse(data);
        } catch {
          continue;
        }
        if (json.model) model = json.model;
        if (json.usage) usage = json.usage;
        const delta = json.choices?.[0]?.delta;
        if (!delta) continue;
        if (delta.reasoning && callbacks.onThinking) {
          callbacks.onThinking(delta.reasoning);
        }
        if (delta.content) {
          full += delta.content;
          callbacks.onText?.(delta.content);
        }
      }
    }
    return { text: full, usage, model };
  })();

  return { abort: () => controller.abort(), done };
}

/** Non-streaming completion. Resolves to `{ text, usage, model }`. */
export async function completeChat(key, options) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify(buildBody({ ...options, stream: false })),
  });
  if (!res.ok) throw await orError(res);
  const json = await res.json();
  return {
    text: json.choices?.[0]?.message?.content || "",
    usage: json.usage || null,
    model: json.model || null,
  };
}

/**
 * Exchange an OAuth PKCE authorization code for a user-scoped API key.
 * @returns {Promise<string>} the OpenRouter key (`sk-or-...`).
 */
export async function exchangeCodeForKey(code, codeVerifier, method = "S256") {
  const res = await fetch(`${BASE}/auth/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
      code_challenge_method: method,
    }),
  });
  if (!res.ok) throw await orError(res);
  const json = await res.json();
  if (!json.key) throw new Error("OpenRouter did not return a key.");
  return json.key;
}
