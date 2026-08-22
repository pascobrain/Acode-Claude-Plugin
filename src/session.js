import { createClient } from "./api.js";
import { getSetting } from "./utils.js";
import {
  BASE_SYSTEM_PROMPT,
  COMMANDS,
} from "./constants.js";

let cachedClient = null;
let cachedKey = null;

/**
 * Return a cached Anthropic client for the configured API key, or null when no
 * key is set. The client is rebuilt automatically when the key changes.
 */
export function getClient() {
  const key = (getSetting("apiKey") || "").trim();
  if (!key) return null;
  if (!cachedClient || cachedKey !== key) {
    cachedClient = createClient(key);
    cachedKey = key;
  }
  return cachedClient;
}

/** Drop the cached client (call when settings change). */
export function resetClient() {
  cachedClient = null;
  cachedKey = null;
}

/**
 * Ensure an API key is configured. When missing, warn the user, point them at
 * the settings page, and return null.
 */
export function requireClient() {
  const client = getClient();
  if (!client) {
    acode.require("toast")(
      "Set your Anthropic API key in Claude AI plugin settings first.",
      4000,
    );
    try {
      acode.execCommand?.("open-plugin-settings", null, {
        id: COMMANDS.OPEN_CHAT,
      });
    } catch {
      /* best effort */
    }
  }
  return client;
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
