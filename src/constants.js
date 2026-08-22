import plugin from "../plugin.json";

/** Stable plugin id, re-exported for convenience. */
export const PLUGIN_ID = plugin.id;

/**
 * Models offered in the settings picker.
 * Values are the exact Anthropic model IDs — do not append date suffixes.
 */
export const MODELS = [
  ["claude-opus-5", "Claude Opus 5 (recommended)"],
  ["claude-sonnet-5", "Claude Sonnet 5 (balanced)"],
  ["claude-haiku-4-5", "Claude Haiku 4.5 (fast & cheap)"],
  ["claude-opus-4-8", "Claude Opus 4.8"],
  ["claude-fable-5", "Claude Fable 5 (most capable)"],
];

/** Default settings for a fresh install. */
export const DEFAULTS = {
  apiKey: "",
  model: "claude-opus-5",
  maxTokens: 8192,
  extendedThinking: true,
  streaming: true,
  systemPrompt: "",
};

/** Base system prompt always sent, ahead of the user's custom prompt. */
export const BASE_SYSTEM_PROMPT = [
  "You are Claude, an AI pair-programmer embedded inside the Acode code editor on Android.",
  "Be concise and practical. When you output code, wrap it in fenced Markdown code blocks",
  "and specify the language. Prefer complete, runnable snippets over fragments, and only",
  "explain what is genuinely useful. Assume the user is a developer.",
].join(" ");

/**
 * Instruction used by the code-transform commands (refactor, fix, document).
 * Forces a code-only answer so the result can be inserted back into the buffer.
 */
export const CODE_ONLY_SYSTEM_PROMPT = [
  "You are a code transformation engine inside the Acode editor.",
  "Return ONLY the transformed source code for the snippet the user provides.",
  "Do not add explanations, comments about your changes, or Markdown fences —",
  "output raw code only, preserving the original indentation style.",
].join(" ");

/** Sidebar app + command identifiers. */
export const SIDEBAR_ID = "claude-ai-chat";

export const COMMANDS = {
  OPEN_CHAT: "claude:open-chat",
  ASK: "claude:ask",
  EXPLAIN: "claude:explain-selection",
  REFACTOR: "claude:refactor-selection",
  FIX: "claude:fix-selection",
  DOCUMENT: "claude:document-selection",
};
