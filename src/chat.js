import * as anthropic from "./api.js";
import * as openrouter from "./openrouter.js";
import * as minimax from "./minimax.js";

/**
 * Provider-agnostic chat facade. The UI talks only to this module and to
 * `session.js`; `conn` comes from `session.requireConnection()` and is either
 * `{ provider: "anthropic", client }`, `{ provider: "openrouter", key }`,
 * or `{ provider: "minimax", key }`.
 *
 * Streaming `done` always resolves to a normalized `{ text, outputTokens, model }`.
 */
export function streamChat(conn, options, callbacks) {
  if (conn.provider === "minimax") {
    const h = minimax.streamChat(conn.key, options, callbacks);
    return {
      abort: h.abort,
      done: h.done.then((r) => ({
        text: r.text,
        outputTokens: r.usage?.completion_tokens,
        model: r.model,
      })),
    };
  }
  if (conn.provider === "openrouter") {
    const h = openrouter.streamChat(conn.key, options, callbacks);
    return {
      abort: h.abort,
      done: h.done.then((r) => ({
        text: r.text,
        outputTokens: r.usage?.completion_tokens,
        model: r.model,
      })),
    };
  }
  const h = anthropic.streamChat(conn.client, options, callbacks);
  return {
    abort: h.abort,
    done: h.done.then((m) => ({
      text: anthropic.extractText(m),
      outputTokens: m.usage?.output_tokens,
      model: m.model,
    })),
  };
}

/** Non-streaming completion. Resolves to the reply text (string). */
export async function completeChat(conn, options) {
  if (conn.provider === "minimax") {
    const r = await minimax.completeChat(conn.key, options);
    return r.text;
  }
  if (conn.provider === "openrouter") {
    const r = await openrouter.completeChat(conn.key, options);
    return r.text;
  }
  return anthropic.completeChat(conn.client, options);
}

/** Universal error-to-string mapper (handles Anthropic classes + generic). */
export const describeError = anthropic.describeError;
