# Changelog

## 1.1.0

- **Sign in with OpenRouter** — connect without an Anthropic API key. Run
  "Claude: Connect" (or tap the button in the chat) to authorize via OAuth;
  the plugin receives a key automatically and talks to Claude models through
  OpenRouter.
- Added a **Provider** setting (Anthropic API key or OpenRouter sign-in) and an
  OpenRouter key field for manual entry.
- The chat now shows a connect screen until an account is linked.

## 1.0.0

Initial release.

- Chat sidebar with streamed replies, Markdown rendering and code blocks with
  Copy / Insert actions.
- Attach the current file or selection as context.
- Editor commands: Open chat, Ask about code, Explain, Refactor, Fix bugs,
  Add doc comments.
- Selection-menu entries: Explain and Ask Claude.
- Settings: API key, model picker (Opus 5 / Sonnet 5 / Haiku 4.5 / Opus 4.8 /
  Fable 5), max output tokens, extended thinking, streaming and a custom
  system prompt.
