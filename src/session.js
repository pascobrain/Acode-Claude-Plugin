import { createClient } from "./api.js";
import { getSetting } from "./utils.js";
import { BASE_SYSTEM_PROMPT } from "./constants.js";

let cachedClient = null;
let cachedKey = null;

/** Active provider: "anthropic" (API key) or "openrouter" (OAuth sign-in). */
export function getProvider() {
  return getSetting("provider") === "openrouter" ? "openrouter" : "anthropic";
}

function anthropicClient() {
  const key = (getSetting("apiKey") || "").trim();
  if (!key) return null;
  if (!cachedClient || cachedKey !== key) {
    cachedClient = createClient(key);
    cachedKey = key;
  }
  return cachedClient;
}

/** Drop the cached Anthropic client (call when the key/provider changes). */
export function resetClient() {
  cachedClient = null;
  cachedKey = null;
}

/** Whether the active provider currently has usable credentials. */
export function isConnected() {
  return getProvider() === "openrouter"
    ? !!(getSetting("openrouterKey") || "").trim()
    : !!(getSetting("apiKey") || "").trim();
}

/**
 * Connection descriptor for the active provider, or null (after warning the
 * user) when credentials are missing.
 * @returns {{provider:"anthropic",client:object}|{provider:"openrouter",key:string}|null}
 */
export function requireConnection() {
  const provider = getProvider();
  if (provider === "openrouter") {
    const key = (getSetting("openrouterKey") || "").trim();
    if (!key) {
      acode.require("toast")(
        "Sign in with OpenRouter first — run “Claude: Connect” or use the button in the chat.",
        4000,
      );
      return null;
    }
    return { provider, key };
  }
  const client = anthropicClient();
  if (!client) {
    acode.require("toast")(
      "Add your Anthropic API key in settings, or switch the provider to OpenRouter sign-in.",
      5000,
    );
    return null;
  }
  return { provider: "anthropic", client };
}

/** Build the shared request options from current settings. */
export function chatOptions(overrides = {}) {
  const custom = (getSetting("systemPrompt") || "").trim();
  const system = custom
    ? `${BASE_SYSTEM_PROMPT}\n\n${custom}`
    : BASE_SYSTEM_PROMPT;
  return {
    model: getSetting("model"),
    maxTokens: getSetting("maxTokens"),
    thinking: !!getSetting("extendedThinking"),
    streaming: !!getSetting("streaming"),
    system,
    ...overrides,
  };
}
