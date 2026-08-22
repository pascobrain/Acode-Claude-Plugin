import Anthropic from "@anthropic-ai/sdk";

/**
 * Build an Anthropic client that is allowed to run inside the Acode WebView.
 *
 * `dangerouslyAllowBrowser` disables the SDK's browser guard (the API key lives
 * on the user's own device, in their own editor, so this is expected), and the
 * explicit header makes the Anthropic API accept the cross-origin request from
 * the WebView.
 */
export function createClient(apiKey) {
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
      "anthropic-dangerous-direct-browser-access": "true",
    },
  });
}

/**
 * Thinking configuration that matches the selected model's API contract.
 * Adaptive thinking for the 4.6+/5 family; a token budget for Haiku / older.
 */
function thinkingParam(model, enabled) {
  if (!enabled) return undefined;
  const legacy = /haiku|claude-3|claude-sonnet-4-5|claude-opus-4-5/.test(model);
  if (legacy) {
    return { type: "enabled", budget_tokens: 2048 };
  }
  return { type: "adaptive", display: "summarized" };
}

/**
 * Assemble the request body shared by streaming and non-streaming calls.
 */
function buildRequest({ model, maxTokens, system, messages, thinking }) {
  const think = thinkingParam(model, thinking);
  let max = Number(maxTokens) || 8192;
  // A token budget must be strictly smaller than max_tokens.
  if (think?.type === "enabled" && max <= think.budget_tokens) {
    max = think.budget_tokens + 4096;
  }
  const body = {
    model,
    max_tokens: max,
    messages,
  };
  if (system) body.system = system;
  if (think) body.thinking = think;
  return body;
}

/**
 * Stream a chat completion.
 *
 * @param callbacks.onText     called with each text delta
 * @param callbacks.onThinking called with each thinking (reasoning) delta
 * @returns the final Anthropic.Message and a `.controller` used to abort.
 */
export function streamChat(client, options, callbacks = {}) {
  const request = buildRequest(options);
  const stream = client.messages.stream(request);

  if (callbacks.onText) stream.on("text", callbacks.onText);
  if (callbacks.onThinking) {
    stream.on("thinking", (delta) => callbacks.onThinking(delta));
  }

  const promise = stream.finalMessage();
  return {
    abort: () => stream.abort(),
    done: promise,
  };
}

/**
 * Non-streaming chat completion. Returns the concatenated text of the reply.
 */
export async function completeChat(client, options) {
  const request = buildRequest(options);
  const message = await client.messages.create(request);
  return extractText(message);
}

/** Concatenate every text block of a message into a single string. */
export function extractText(message) {
  if (!message?.content) return "";
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

/**
 * Turn any thrown value into a short, user-facing error string.
 */
export function describeError(error) {
  if (error?.name === "AbortError") return "Stopped.";
  if (error instanceof Anthropic.AuthenticationError) {
    return "Invalid API key. Check the plugin settings.";
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return "This API key is not allowed to use the selected model.";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "Rate limited by Anthropic. Please retry in a moment.";
  }
  if (error instanceof Anthropic.BadRequestError) {
    return `Bad request: ${error.message}`;
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return "Network error reaching api.anthropic.com. Check your connection.";
  }
  if (error instanceof Anthropic.APIError) {
    return `Anthropic API error${error.status ? " " + error.status : ""}: ${error.message}`;
  }
  return error?.message || "Unknown error.";
}
