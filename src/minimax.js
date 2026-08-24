const BASE = "https://integrate.api.nvidia.com/v1";

function headers(key) {
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function buildBody({ model, maxTokens, system, messages, thinking, stream }) {
  const msgs = [];
  if (system) msgs.push({ role: "system", content: system });
  for (const m of messages) msgs.push({ role: m.role, content: m.content });
  
  return {
    model: "nvidia/minimaxai/minimax-m3",
    messages: msgs,
    max_tokens: Number(maxTokens) || 8192,
    stream: !!stream,
  };
}

async function mmError(res) {
  let detail = "";
  try {
    const j = await res.json();
    detail = j?.error?.message || j?.message || "";
  } catch {}
  return new Error(`Minimax error ${res.status}${detail ? ": " + detail : ""}`);
}

/**
 * Stream a chat completion from Minimax/NVIDIA (OpenAI-compatible SSE).
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
    if (!res.ok || !res.body) throw await mmError(res);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    let usage = null;

    for (;;) {
      const { done: streamDone, value } = await reader.read();
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line || line.startsWith(":")) continue;
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;

        let json;
        try {
          json = JSON.parse(data);
        } catch {
          continue;
        }
        if (json.usage) usage = json.usage;
        const delta = json.choices?.[0]?.delta;
        if (!delta) continue;
        if (delta.content) {
          full += delta.content;
          callbacks.onText?.(delta.content);
        }
      }
    }
    return { text: full, usage, model: "nvidia/minimaxai/minimax-m3" };
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
  if (!res.ok) throw await mmError(res);
  const json = await res.json();
  return {
    text: json.choices?.[0]?.message?.content || "",
    usage: json.usage || null,
    model: "nvidia/minimaxai/minimax-m3",
  };
}
